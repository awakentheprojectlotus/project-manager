import { useProjectStore } from '../stores/projectStore';
import { useTaskStore } from '../stores/taskStore';
import { useTeamStore } from '../stores/teamStore';
import {
  PRIORITY_VALUES,
  PROJECT_STATUS_VALUES,
  TASK_STATUS_VALUES,
  PROJECT_STATUS_MAP,
  TASK_STATUS_MAP,
} from '../constants';

export const ACTION_TYPES = [
  'project.update',
  'project.delete',
  'task.create',
  'task.update',
  'task.updateMany',
  'task.delete',
  'member.add',
  'member.remove',
];

const PROJECT_CHANGE_KEYS = [
  'name',
  'description',
  'status',
  'priority',
  'startDate',
  'dueDate',
  'memberIds',
  'color',
];

const TASK_CHANGE_KEYS = [
  'title',
  'description',
  'status',
  'priority',
  'assigneeId',
  'dueDate',
  'projectId',
];

const DESTRUCTIVE = new Set(['project.delete', 'task.delete', 'member.remove']);

const isValidDate = (value) => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00`);
  return !Number.isNaN(d.getTime());
};

const cleanText = (value, max = 500) =>
  typeof value === 'string' ? value.trim().slice(0, max) : undefined;

const cleanDate = (value) => {
  if (value === null || value === '') return null;
  return isValidDate(value) ? value : undefined;
};

const pickChanges = (changes, allowed, snapshot, kind) => {
  const out = {};
  const errors = [];
  if (!changes || typeof changes !== 'object') return { out, errors: ['changes must be an object'] };

  Object.entries(changes).forEach(([key, value]) => {
    if (!allowed.includes(key)) return;
    if (key === 'status') {
      const values = kind === 'project' ? PROJECT_STATUS_VALUES : TASK_STATUS_VALUES;
      if (!values.includes(value)) errors.push(`invalid status '${value}'`);
      else out.status = value;
    } else if (key === 'priority') {
      if (!PRIORITY_VALUES.includes(value)) errors.push(`invalid priority '${value}'`);
      else out.priority = value;
    } else if (key === 'dueDate' || key === 'startDate') {
      const cleaned = cleanDate(value);
      if (cleaned === undefined) errors.push(`invalid date '${value}'`);
      else out[key] = cleaned;
    } else if (key === 'assigneeId') {
      if (value === null || value === '') out.assigneeId = null;
      else if (!snapshot.memberIds.has(value)) errors.push(`unknown assignee '${value}'`);
      else out.assigneeId = value;
    } else if (key === 'projectId') {
      if (!value) out.projectId = null;
      else if (!snapshot.projectIds.has(value)) errors.push(`unknown project '${value}'`);
      else out.projectId = value;
    } else if (key === 'memberIds') {
      if (!Array.isArray(value)) errors.push('memberIds must be an array');
      else out.memberIds = value.filter((id) => snapshot.memberIds.has(id));
    } else if (key === 'title' || key === 'name') {
      const cleaned = cleanText(value, 140);
      if (!cleaned) errors.push(`${key} cannot be empty`);
      else out[key] = cleaned;
    } else if (key === 'description') {
      out.description = cleanText(value, 2000) || '';
    } else if (key === 'color') {
      if (typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value)) out.color = value;
    }
  });

  return { out, errors };
};

export const validateActions = (rawActions, { projects, tasks, members }) => {
  const snapshot = {
    projectIds: new Set(projects.map((p) => p.id)),
    taskIds: new Set(tasks.map((t) => t.id)),
    memberIds: new Set(members.map((m) => m.id)),
  };

  const valid = [];
  const errors = [];

  (Array.isArray(rawActions) ? rawActions : []).forEach((action, index) => {
    const label = `Action ${index + 1}`;
    if (!action || typeof action !== 'object') {
      errors.push(`${label}: not an object`);
      return;
    }
    const type = action.type;
    if (!ACTION_TYPES.includes(type)) {
      errors.push(`${label}: unsupported type '${type}'`);
      return;
    }

    try {
      if (type === 'project.update') {
        const projectId = action.projectId || action.id;
        if (!snapshot.projectIds.has(projectId)) throw new Error(`unknown project '${projectId}'`);
        const { out, errors: changeErrors } = pickChanges(
          action.changes,
          PROJECT_CHANGE_KEYS,
          snapshot,
          'project'
        );
        if (changeErrors.length) throw new Error(changeErrors.join('; '));
        if (!Object.keys(out).length) throw new Error('no valid changes');
        valid.push({ type, projectId, changes: out });
      } else if (type === 'project.delete') {
        const projectId = action.projectId || action.id;
        if (!snapshot.projectIds.has(projectId)) throw new Error(`unknown project '${projectId}'`);
        valid.push({ type, projectId });
      } else if (type === 'task.create') {
        const data = action.data || {};
        const title = cleanText(data.title, 140);
        if (!title) throw new Error('task title is required');
        const projectId = data.projectId || null;
        if (projectId && !snapshot.projectIds.has(projectId))
          throw new Error(`unknown project '${projectId}'`);
        const assigneeId = data.assigneeId || null;
        if (assigneeId && !snapshot.memberIds.has(assigneeId))
          throw new Error(`unknown assignee '${assigneeId}'`);
        const status = TASK_STATUS_VALUES.includes(data.status) ? data.status : 'todo';
        const priority = PRIORITY_VALUES.includes(data.priority) ? data.priority : 'medium';
        const dueDate = cleanDate(data.dueDate);
        if (dueDate === undefined) throw new Error(`invalid due date '${data.dueDate}'`);
        valid.push({
          type,
          data: {
            title,
            description: cleanText(data.description, 2000) || '',
            projectId,
            assigneeId,
            status,
            priority,
            dueDate,
          },
        });
      } else if (type === 'task.update') {
        const taskId = action.taskId || action.id;
        if (!snapshot.taskIds.has(taskId)) throw new Error(`unknown task '${taskId}'`);
        const { out, errors: changeErrors } = pickChanges(
          action.changes,
          TASK_CHANGE_KEYS,
          snapshot,
          'task'
        );
        if (changeErrors.length) throw new Error(changeErrors.join('; '));
        if (!Object.keys(out).length) throw new Error('no valid changes');
        valid.push({ type, taskId, changes: out });
      } else if (type === 'task.updateMany') {
        const ids = (Array.isArray(action.taskIds) ? action.taskIds : []).filter((id) =>
          snapshot.taskIds.has(id)
        );
        if (!ids.length) throw new Error('no valid task ids');
        if (ids.length > 100) throw new Error('bulk update limited to 100 tasks');
        const { out, errors: changeErrors } = pickChanges(
          action.changes,
          TASK_CHANGE_KEYS,
          snapshot,
          'task'
        );
        if (changeErrors.length) throw new Error(changeErrors.join('; '));
        if (!Object.keys(out).length) throw new Error('no valid changes');
        valid.push({ type, taskIds: ids, changes: out });
      } else if (type === 'task.delete') {
        const taskId = action.taskId || action.id;
        if (!snapshot.taskIds.has(taskId)) throw new Error(`unknown task '${taskId}'`);
        valid.push({ type, taskId });
      } else if (type === 'member.add') {
        const data = action.data || {};
        const name = cleanText(data.name, 80);
        if (!name) throw new Error('member name is required');
        valid.push({
          type,
          data: {
            name,
            email: cleanText(data.email, 120) || '',
            role: cleanText(data.role, 80) || 'Contributor',
          },
        });
      } else if (type === 'member.remove') {
        const memberId = action.memberId || action.id;
        if (!snapshot.memberIds.has(memberId)) throw new Error(`unknown member '${memberId}'`);
        valid.push({ type, memberId });
      }
    } catch (err) {
      errors.push(`${label}: ${err.message}`);
    }
  });

  return { actions: valid, errors };
};

export const actionRequiresConfirmation = (actions) =>
  actions.some((a) => DESTRUCTIVE.has(a.type) || (a.type === 'task.updateMany' && a.taskIds.length >= 3));

export const describeActions = (actions, before = {}) =>
  actions.map((a) => {
    if (a.type === 'project.update') {
      const project = before.projects?.find((p) => p.id === a.projectId);
      const parts = Object.entries(a.changes).map(([k, v]) => {
        if (k === 'status') return `status → ${PROJECT_STATUS_MAP[v]?.label || v}`;
        if (k === 'priority') return `priority → ${v}`;
        if (k === 'dueDate') return `deadline → ${v || 'none'}`;
        if (k === 'memberIds') return `${v.length} members assigned`;
        return `${k} updated`;
      });
      return `Update "${project?.name || a.projectId}": ${parts.join(', ')}`;
    }
    if (a.type === 'project.delete') {
      const project = before.projects?.find((p) => p.id === a.projectId);
      return `Delete project "${project?.name || a.projectId}" and all of its tasks`;
    }
    if (a.type === 'task.create') return `Create task "${a.data.title}"`;
    if (a.type === 'task.update') {
      const task = before.tasks?.find((t) => t.id === a.taskId);
      const parts = Object.entries(a.changes).map(([k, v]) => {
        if (k === 'status') return `status → ${TASK_STATUS_MAP[v]?.label || v}`;
        if (k === 'priority') return `priority → ${v}`;
        if (k === 'assigneeId')
          return `assignee → ${before.members?.find((m) => m.id === v)?.name || 'Unassigned'}`;
        if (k === 'dueDate') return `due → ${v || 'none'}`;
        return `${k} updated`;
      });
      return `Update "${task?.title || a.taskId}": ${parts.join(', ')}`;
    }
    if (a.type === 'task.updateMany')
      return `Update ${a.taskIds.length} tasks${a.changes.status ? ` to ${TASK_STATUS_MAP[a.changes.status]?.label || a.changes.status}` : ''}`;
    if (a.type === 'task.delete') {
      const task = before.tasks?.find((t) => t.id === a.taskId);
      return `Delete task "${task?.title || a.taskId}"`;
    }
    if (a.type === 'member.add') return `Add team member "${a.data.name}"`;
    if (a.type === 'member.remove') {
      const member = before.members?.find((m) => m.id === a.memberId);
      return `Remove team member "${member?.name || a.memberId}" and unassign their tasks`;
    }
    return a.type;
  });

export const executeActions = (actions) => {
  const projectStore = useProjectStore.getState();
  const taskStore = useTaskStore.getState();
  const teamStore = useTeamStore.getState();
  const results = [];

  actions.forEach((action) => {
    try {
      if (action.type === 'project.update') {
        projectStore.updateProject(action.projectId, action.changes);
        results.push({ ok: true, message: 'Project updated' });
      } else if (action.type === 'project.delete') {
        projectStore.deleteProject(action.projectId);
        results.push({ ok: true, message: 'Project deleted' });
      } else if (action.type === 'task.create') {
        taskStore.createTask(action.data);
        results.push({ ok: true, message: 'Task created' });
      } else if (action.type === 'task.update') {
        taskStore.updateTask(action.taskId, action.changes);
        results.push({ ok: true, message: 'Task updated' });
      } else if (action.type === 'task.updateMany') {
        const count = taskStore.updateTasksMany(action.taskIds, action.changes);
        results.push({ ok: true, message: `${count} tasks updated` });
      } else if (action.type === 'task.delete') {
        taskStore.deleteTask(action.taskId);
        results.push({ ok: true, message: 'Task deleted' });
      } else if (action.type === 'member.add') {
        teamStore.addMember(action.data);
        results.push({ ok: true, message: 'Team member added' });
      } else if (action.type === 'member.remove') {
        teamStore.removeMember(action.memberId);
        results.push({ ok: true, message: 'Team member removed' });
      }
    } catch (err) {
      results.push({ ok: false, message: err.message || 'Action failed' });
    }
  });

  return {
    results,
    applied: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
  };
};
