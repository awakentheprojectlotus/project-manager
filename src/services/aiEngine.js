import { addDays, addMonths } from 'date-fns';
import { useProjectStore } from '../stores/projectStore';
import { useTaskStore } from '../stores/taskStore';
import { useTeamStore } from '../stores/teamStore';
import { useUiStore } from '../stores/uiStore';
import {
  getAtRiskProjects,
  getCompletionTrend,
  getOverdueTasks,
  getProjectProgress,
  getProjectTasks,
  getTaskCounts,
  getTasksDueWithin,
  getUrgentTasks,
  getWorkload,
} from '../utils/analytics';
import { daysUntil, formatDate, toISO, todayISO } from '../utils/date';
import { findMemberByName, findProjectByName, findTaskByName, extractQuoted, normalize } from '../utils/match';
import { PROJECT_STATUS_MAP, TASK_STATUS_MAP } from '../constants';

const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

const bullets = (lines) => lines.filter(Boolean).map((l) => `• ${l}`).join('\n');

const priorityLabel = (p) => p.charAt(0).toUpperCase() + p.slice(1);

const parsePriority = (text) => {
  if (/\b(urgent|critical|asap|immediately)\b/.test(text)) return 'urgent';
  if (/\bhigh\b|\bimportant\b/.test(text)) return 'high';
  if (/\bmedium\b|\bnormal\b|\bmoderate\b/.test(text)) return 'medium';
  if (/\blow\b|\bminor\b|\bsomeday\b/.test(text)) return 'low';
  return null;
};

const parseTaskStatus = (text) => {
  if (/\bin[ -]?review\b|\breview\b/.test(text)) return 'in-review';
  if (/\bin[ -]?progress\b|\bstarted\b|\bworking on\b/.test(text)) return 'in-progress';
  if (/\b(completed|complete|done|finished|closed|resolved)\b/.test(text)) return 'completed';
  if (/\b(to[ -]?do|todo|not started|backlog)\b/.test(text)) return 'todo';
  return null;
};

const parseProjectStatus = (text) => {
  if (/\bon[ -]?hold\b|\bpaused?\b|\bsuspend/.test(text)) return 'on-hold';
  if (/\bplanning\b|\bplanned\b|\bdiscovery\b/.test(text)) return 'planning';
  if (/\bin[ -]?progress\b|\bactive\b|\bongoing\b|\bresume\b|\brestart\b/.test(text))
    return 'in-progress';
  if (/\b(completed|complete|done|finished|shipped|delivered|closed)\b/.test(text))
    return 'completed';
  return null;
};

const parseDateFromText = (text) => {
  const now = new Date();
  if (/\btoday\b/.test(text)) return todayISO();
  if (/\btomorrow\b/.test(text)) return toISO(addDays(now, 1));
  if (/\byesterday\b/.test(text)) return toISO(addDays(now, -1));
  if (/\bend of (the )?week\b/.test(text)) {
    const day = now.getDay();
    const diff = (5 - day + 7) % 7 || 7;
    return toISO(addDays(now, diff));
  }
  if (/\bnext week\b/.test(text)) return toISO(addDays(now, 7));
  if (/\bnext month\b/.test(text)) return toISO(addMonths(now, 1));

  const iso = text.match(/\b(\d{4}-\d{2}-\d{2})\b/);
  if (iso) return iso[1];

  const relative = text.match(/\bin\s+(\d+)\s*(day|days|week|weeks|month|months)\b/);
  if (relative) {
    const n = Number(relative[1]);
    const unit = relative[2];
    if (unit.startsWith('day')) return toISO(addDays(now, n));
    if (unit.startsWith('week')) return toISO(addDays(now, n * 7));
    return toISO(addMonths(now, n));
  }

  const weekday = text.match(/\b(next|this|on|by)?\s*(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/);
  if (weekday) {
    const target = WEEKDAYS.indexOf(weekday[2]);
    let diff = (target - now.getDay() + 7) % 7;
    if (diff === 0) diff = 7;
    if (weekday[1] === 'this') diff = (target - now.getDay() + 7) % 7;
    return toISO(addDays(now, diff));
  }

  const monthDay = text.match(
    /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{1,2})(?:,?\s*(\d{4}))?\b/
  );
  if (monthDay) {
    const year = monthDay[3] ? Number(monthDay[3]) : now.getFullYear();
    const date = new Date(`${monthDay[1]} ${monthDay[2]}, ${year}`);
    if (!Number.isNaN(date.getTime())) {
      if (!monthDay[3] && date < now) date.setFullYear(date.getFullYear() + 1);
      return toISO(date);
    }
  }

  const numeric = text.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/);
  if (numeric) {
    const year = numeric[3]
      ? Number(numeric[3].length === 2 ? `20${numeric[3]}` : numeric[3])
      : now.getFullYear();
    const date = new Date(year, Number(numeric[1]) - 1, Number(numeric[2]));
    if (!Number.isNaN(date.getTime())) {
      if (!numeric[3] && date < now) date.setFullYear(date.getFullYear() + 1);
      return toISO(date);
    }
  }

  return null;
};

const extractNewTaskTitle = (raw, { project, member } = {}) => {
  const quoted = extractQuoted(raw);
  let title = null;
  if (quoted) title = quoted;
  else {
    const patterns = [
      /\b(?:called|named|titled)\s+(.+)$/i,
      /\b(?:create|add|make)\s+(?:a\s+)?(?:new\s+)?task\s+(?:to\s+|for\s+|that\s+)?(.+)$/i,
      /\bnew\s+task\s+(?:to\s+|for\s+)?(.+)$/i,
    ];
    for (const pattern of patterns) {
      const match = raw.match(pattern);
      if (match) {
        title = match[1];
        break;
      }
    }
  }
  if (!title) return null;

  if (project) {
    const escaped = project.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    title = title.replace(new RegExp(`\\b(?:in|for|under|to)\\s+(?:the\\s+)?${escaped}\\b`, 'gi'), ' ');
    title = title.replace(new RegExp(`\\bthe\\s+${escaped}\\b`, 'gi'), ' ');
  }
  if (member) {
    const escaped = member.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    title = title.replace(new RegExp(`\\b(?:assign(?:ed)?\\s+to|to|for)\\s+${escaped}\\b`, 'gi'), ' ');
  }
  title = title
    .replace(/\b(?:assign(?:ed)?\s+to|owner)\s+[A-Z][\w'-]+(?:\s+[A-Z][\w'-]+)?/g, ' ')
    .replace(/\b(?:with\s+)?(urgent|high|medium|low)\s+priority\b/gi, ' ')
    .replace(/\bpriority\s+(urgent|high|medium|low)\b/gi, ' ')
    .replace(/\b(?:due|deadline|by)\s+(?:on\s+)?[^,.;]+$/i, ' ')
    .replace(/\s{2,}/g, ' ')
    .replace(/^[\s,.;:-]+|[\s,.;:-]+$/g, '')
    .trim();
  return title || null;
};

const dueText = (task) => {
  if (!task.dueDate) return 'no due date';
  const diff = daysUntil(task.dueDate);
  if (task.status === 'completed') return formatDate(task.dueDate);
  if (diff < 0) return `${Math.abs(diff)}d overdue (${formatDate(task.dueDate)})`;
  if (diff === 0) return 'due today';
  if (diff === 1) return 'due tomorrow';
  return `due ${formatDate(task.dueDate)} (${diff}d)`;
};

const projectLine = (project, tasks) => {
  const progress = getProjectProgress(project, tasks);
  const counts = getTaskCounts(getProjectTasks(project.id, tasks));
  const diff = daysUntil(project.dueDate);
  const due =
    diff === null ? '' : diff < 0 ? `, ${Math.abs(diff)}d overdue` : `, due in ${diff}d`;
  return `${project.name} — ${PROJECT_STATUS_MAP[project.status]?.label}, ${progress}% complete, ${counts.open} open${due}`;
};

const buildRecommendations = (projects, tasks, members) => {
  const overdue = getOverdueTasks(tasks);
  const urgent = getUrgentTasks(tasks).filter((t) => t.priority === 'urgent');
  const risk = getAtRiskProjects(projects, tasks);
  const workload = getWorkload(members, tasks);
  const unassigned = tasks.filter((t) => t.status !== 'completed' && !t.assigneeId);
  const lines = [];

  if (risk.length) {
    lines.push(
      `At-risk projects: ${risk
        .slice(0, 3)
        .map((r) => `${r.project.name} (${r.reasons.join(', ') || r.risk + ' risk'})`)
        .join('; ')}.`
    );
  }
  if (overdue.length) {
    lines.push(
      `Clear ${overdue.length} overdue ${overdue.length === 1 ? 'task' : 'tasks'} first, starting with "${overdue[0].title}" (${dueText(overdue[0])}).`
    );
  }
  if (urgent.length) {
    lines.push(
      `${urgent.length} urgent ${urgent.length === 1 ? 'task is' : 'tasks are'} still open — keep those at the top of today's queue.`
    );
  }
  const overloaded = workload.filter((w) => w.utilization > 90 || w.open >= 5);
  if (overloaded.length) {
    const least = workload[workload.length - 1];
    lines.push(
      `${overloaded[0].member.name} is the most loaded (${overloaded[0].open} open tasks, ~${overloaded[0].utilization}% capacity). Consider rebalancing to ${least.member.name} (${least.open} open).`
    );
  }
  if (unassigned.length) {
    lines.push(
      `${unassigned.length} open ${unassigned.length === 1 ? 'task has' : 'tasks have'} no assignee — assign them so nothing slips.`
    );
  }
  const trend = getCompletionTrend(tasks, 4);
  const last = trend[trend.length - 1];
  if (last) {
    lines.push(`This week: ${last.completed} tasks completed, ${last.created} created.`);
  }
  if (!lines.length) {
    lines.push('Everything looks healthy. Keep the current priorities and review progress at the end of the week.');
  }
  return `Here is what I would focus on:\n${bullets(lines)}`;
};

const buildWorkspaceSummary = (projects, tasks) => {
  const counts = getTaskCounts(tasks);
  const risk = getAtRiskProjects(projects, tasks);
  const lines = [
    `${projects.length} projects: ${projects.filter((p) => p.status === 'in-progress').length} in progress, ${projects.filter((p) => p.status === 'completed').length} completed, ${projects.filter((p) => p.status === 'on-hold').length} on hold.`,
    `${counts.open} open tasks with ${counts.overdue} overdue; overall task completion is ${counts.completionRate}%.`,
  ];
  if (risk.length) {
    lines.push(`Needs attention: ${risk.map((r) => r.project.name).join(', ')}.`);
  }
  const upcoming = getTasksDueWithin(tasks, 7);
  if (upcoming.length) {
    lines.push(
      `${upcoming.length} tasks due in the next 7 days, starting with "${upcoming[0].title}" (${dueText(upcoming[0])}).`
    );
  }
  return lines.join('\n');
};

const greetingReply = () => {
  const { projects } = useProjectStore.getState();
  const { tasks } = useTaskStore.getState();
  const counts = getTaskCounts(tasks);
  return `Hi! I'm connected to your live workspace — ${projects.length} projects and ${tasks.length} tasks.\n\nRight now you have ${counts.open} open tasks and ${counts.overdue} overdue. Ask me about progress, workload or deadlines, or tell me to update something.`;
};

export const interpretLocally = (message) => {
  const raw = message || '';
  const text = normalize(raw);
  const { projects } = useProjectStore.getState();
  const { tasks } = useTaskStore.getState();
  const { members } = useTeamStore.getState();
  const currentUserId = useUiStore.getState().currentUserId;
  const currentUser = members.find((m) => m.id === currentUserId);

  const project = findProjectByName(raw, projects);
  const member = findMemberByName(raw, members);
  const task = findTaskByName(raw, tasks, { projectId: project?.id || null });

  const wantsDelete = /\b(delete|remove|archive|drop)\b/.test(text);
  const wantsAdd = /\b(add|create|new|make)\b/.test(text);
  const asksTask = /\btask(s)?\b/.test(text);
  const asksProject = /\bproject(s)?\b/.test(text);
  const isQuestion = /\?/.test(raw) || /^(what|which|who|how|show|list|find|give|tell|are|is|do|does|can|when)\b/.test(text);
  const priority = parsePriority(text);
  const taskStatus = parseTaskStatus(text);
  const projectStatus = parseProjectStatus(text);
  const parsedDate = parseDateFromText(text);

  if (/^(hi|hello|hey|yo|good (morning|afternoon|evening))\b/.test(text)) {
    return { reply: greetingReply(), actions: [], requiresConfirmation: false };
  }

  if (/^(help|what can you do|capabilities|commands)\b/.test(text)) {
    return {
      reply: `I work directly on your workspace data. You can:\n${bullets([
        'Ask about progress, overdue work, deadlines or workload.',
        'Create and update tasks, assign owners and change statuses.',
        'Update project status, priority or deadlines.',
        'Delete projects and tasks — always with confirmation.',
        'Get prioritisation and risk recommendations.',
      ])}\n\nTry: "Which projects are behind schedule?" or "Create a task called Design March campaign for Padma".`,
      actions: [],
      requiresConfirmation: false,
    };
  }

  if (wantsDelete) {
    if (project && !(task && asksTask && !asksProject)) {
      return {
        reply: `I can delete **${project.name}** and its ${getProjectTasks(project.id, tasks).length} tasks. This cannot be undone — confirm below and I'll execute it.`,
        actions: [{ type: 'project.delete', projectId: project.id }],
        requiresConfirmation: true,
      };
    }
    if (task) {
      return {
        reply: `Ready to delete the task **${task.title}**. This cannot be undone — confirm below.`,
        actions: [{ type: 'task.delete', taskId: task.id }],
        requiresConfirmation: true,
      };
    }
    if (member && /\b(member|teammate|team|person)\b/.test(text)) {
      return {
        reply: `Remove **${member.name}** from the team? Their ${memberStatsText(member, tasks)} will be unassigned. Confirm below to proceed.`,
        actions: [{ type: 'member.remove', memberId: member.id }],
        requiresConfirmation: true,
      };
    }
  }

  if (wantsAdd && !asksTask && !asksProject && (member || /\b(team ?member|teammate|person)\b/.test(text))) {
    const name =
      extractQuoted(raw) ||
      raw.match(/\b(?:called|named)\s+([A-Za-z][A-Za-z .'-]{1,50})/)?.[1]?.trim();
    if (name) {
      return {
        reply: `I'll add **${name}** to the team as a Contributor. You can edit their role later in Team Members.`,
        actions: [{ type: 'member.add', data: { name, role: 'Contributor' } }],
        requiresConfirmation: false,
      };
    }
  }

  if (/\b(create|add|make|new)\b/.test(text) && asksTask) {
    const title = extractNewTaskTitle(raw, { project, member });
    if (!title) {
      return {
        reply:
          'Sure — what should the task be called? For example: "Create a task called Design March campaign for Padma".',
        actions: [],
        requiresConfirmation: false,
      };
    }
    const projectId = project?.id || null;
    const assigneeId = member?.id || null;
    const data = {
      title,
      projectId,
      assigneeId,
      status: taskStatus || 'todo',
      priority: priority || 'medium',
      dueDate: parsedDate,
    };
    const extras = [
      project ? `in **${project.name}**` : 'with no project',
      member ? `assigned to **${member.name}**` : 'unassigned',
      `${priorityLabel(data.priority)} priority`,
      parsedDate ? `due ${formatDate(parsedDate)}` : 'no due date',
    ].join(', ');
    return {
      reply: `Creating **${title}** ${extras}.`,
      actions: [{ type: 'task.create', data }],
      requiresConfirmation: false,
    };
  }

  if (/\bmove\b|\bupdate\b|\bmark\b/.test(text) && /\ball\b/.test(text) && asksTask && taskStatus) {
    let targets = getOverdueTasks(tasks);
    let label = 'overdue';
    if (/\burgent\b/.test(text)) {
      targets = tasks.filter((t) => t.status !== 'completed' && t.priority === 'urgent');
      label = 'urgent';
    } else if (/\bhigh\b/.test(text)) {
      targets = tasks.filter((t) => t.status !== 'completed' && t.priority === 'high');
      label = 'high-priority';
    } else if (project) {
      targets = getProjectTasks(project.id, tasks).filter((t) => t.status !== 'completed');
      label = `open tasks in ${project.name}`;
    }
    if (!targets.length) {
      return {
        reply: `There are no ${label} tasks to update right now.`,
        actions: [],
        requiresConfirmation: false,
      };
    }
    return {
      reply: `I found **${targets.length}** ${label} tasks. Moving them to **${TASK_STATUS_MAP[taskStatus]?.label}** will update all of them — confirm below to apply.`,
      actions: [
        {
          type: 'task.updateMany',
          taskIds: targets.map((t) => t.id),
          changes: { status: taskStatus },
        },
      ],
      requiresConfirmation: targets.length >= 3,
    };
  }

  if (/\bassign\b/.test(text) && member && !asksProject) {
    if (task) {
      return {
        reply: `Assigning **${task.title}** to **${member.name}**.`,
        actions: [{ type: 'task.update', taskId: task.id, changes: { assigneeId: member.id } }],
        requiresConfirmation: false,
      };
    }
    if (project) {
      const open = getProjectTasks(project.id, tasks).filter((t) => t.status !== 'completed');
      return {
        reply: `I couldn't identify a single task in **${project.name}**. Open tasks there:\n${bullets(
          open.slice(0, 6).map((t) => `"${t.title}"`)
        )}\nWhich one should go to ${member.name}?`,
        actions: [],
        requiresConfirmation: false,
      };
    }
    return {
      reply: `Which task should I assign to **${member.name}**? Mention the task title, for example: "Assign the TikTok script task to ${member.name.split(' ')[0]}".`,
      actions: [],
      requiresConfirmation: false,
    };
  }

  if (/\bpriority\b/.test(text) && project && priority && /\b(change|set|update|make|raise|lower|move)\b/.test(text)) {
    return {
      reply: `Setting **${project.name}** priority to **${priorityLabel(priority)}**.`,
      actions: [{ type: 'project.update', projectId: project.id, changes: { priority } }],
      requiresConfirmation: false,
    };
  }

  if (
    project &&
    /\b(deadline|due date|due)\b/.test(text) &&
    /\b(change|set|update|move|push|extend|shift)\b/.test(text)
  ) {
    if (!parsedDate) {
      return {
        reply: `What should the new deadline for **${project.name}** be? Try "set the deadline to next Friday" or a date like 2026-12-01.`,
        actions: [],
        requiresConfirmation: false,
      };
    }
    return {
      reply: `Updating the deadline for **${project.name}** from ${formatDate(project.dueDate)} to **${formatDate(parsedDate)}**.`,
      actions: [{ type: 'project.update', projectId: project.id, changes: { dueDate: parsedDate } }],
      requiresConfirmation: false,
    };
  }

  if (
    project &&
    /\b(deadline|due date|when (is|does)|how long)\b/.test(text) &&
    !/\b(change|set|update|move|push|extend|shift)\b/.test(text)
  ) {
    const diff = daysUntil(project.dueDate);
    return {
      reply: `**${project.name}** is due on **${formatDate(project.dueDate)}**${
        diff === null
          ? ''
          : diff < 0
            ? ` — that is ${Math.abs(diff)} day${Math.abs(diff) === 1 ? '' : 's'} overdue.`
            : diff === 0
              ? ' — that is today.'
              : ` (${diff} day${diff === 1 ? '' : 's'} from now).`
      }\n${bullets([
        `${getProjectProgress(project, tasks)}% complete`,
        `${getTaskCounts(getProjectTasks(project.id, tasks)).open} open tasks`,
        `Status: ${PROJECT_STATUS_MAP[project.status]?.label}`,
      ])}`,
      actions: [],
      requiresConfirmation: false,
    };
  }

  if (task && taskStatus && /\b(mark|move|set|update|change|complete|finish|start|review)\b/.test(text)) {if (task.status === taskStatus) {
      return {
        reply: `**${task.title}** is already **${TASK_STATUS_MAP[taskStatus]?.label}**.`,
        actions: [],
        requiresConfirmation: false,
      };
    }
    return {
      reply: `Moving **${task.title}** from ${TASK_STATUS_MAP[task.status]?.label} to **${TASK_STATUS_MAP[taskStatus]?.label}**.`,
      actions: [{ type: 'task.update', taskId: task.id, changes: { status: taskStatus } }],
      requiresConfirmation: false,
    };
  }

  if (project && projectStatus && /\b(mark|move|set|update|change|complete|finish|pause|resume|start|close)\b/.test(text)) {
    if (project.status === projectStatus) {
      return {
        reply: `**${project.name}** is already **${PROJECT_STATUS_MAP[projectStatus]?.label}**.`,
        actions: [],
        requiresConfirmation: false,
      };
    }
    return {
      reply: `Updating **${project.name}** from ${PROJECT_STATUS_MAP[project.status]?.label} to **${PROJECT_STATUS_MAP[projectStatus]?.label}**.`,
      actions: [
        { type: 'project.update', projectId: project.id, changes: { status: projectStatus } },
      ],
      requiresConfirmation: false,
    };
  }

  if (/behind|at risk|late|delayed|slipping|miss(ing)? (a )?deadline/.test(text)) {
    const risk = getAtRiskProjects(projects, tasks);
    if (!risk.length) {
      return {
        reply: 'Nothing is behind schedule right now — every active project is on track. Nice work.',
        actions: [],
        requiresConfirmation: false,
      };
    }
    return {
      reply: `**${risk.length} ${risk.length === 1 ? 'project needs' : 'projects need'} attention:**\n${bullets(
        risk.map(
          (r) => `**${r.project.name}** — ${r.risk} risk, ${r.progress}% complete (expected ${r.expected}%): ${r.reasons.join(', ') || 'behind plan'}`
        )
      )}`,
      actions: [],
      requiresConfirmation: false,
    };
  }

  if (/\boverdue\b|\bpast due\b/.test(text) && !/\bmove\b|\bupdate\b/.test(text)) {
    const overdue = getOverdueTasks(tasks);
    if (!overdue.length) {
      return { reply: 'There are no overdue tasks right now.', actions: [], requiresConfirmation: false };
    }
    return {
      reply: `**${overdue.length} overdue ${overdue.length === 1 ? 'task' : 'tasks'}:**\n${bullets(
        overdue.map(
          (t) =>
            `**${t.title}** — ${projectName(t.projectId, projects)}, ${
              memberNameOf(t.assigneeId, members) || 'Unassigned'
            }, ${dueText(t)}`
        )
      )}`,
      actions: [],
      requiresConfirmation: false,
    };
  }

  if (/\b(due|deadline|upcoming|this week|next 7 days|due soon)\b/.test(text) && !project) {
    const due = getTasksDueWithin(tasks, 7);
    const overdue = getOverdueTasks(tasks);
    if (!due.length) {
      return {
        reply: `No tasks are due in the next 7 days.${overdue.length ? ` There are ${overdue.length} overdue tasks you may want to check.` : ''}`,
        actions: [],
        requiresConfirmation: false,
      };
    }
    return {
      reply: `**${due.length} ${due.length === 1 ? 'task' : 'tasks'} due in the next 7 days:**\n${bullets(
        due.slice(0, 8).map(
          (t) =>
            `**${t.title}** — ${projectName(t.projectId, projects) || 'No project'}, ${
              memberNameOf(t.assigneeId, members) || 'Unassigned'
            }, ${dueText(t)}`
        )
      )}${overdue.length ? `\n\nPlus ${overdue.length} overdue ${overdue.length === 1 ? 'task' : 'tasks'}.` : ''}`,
      actions: [],
      requiresConfirmation: false,
    };
  }

  if (/\bwho has the most\b|\bworkload\b|\boverloaded\b|\bbusiest\b|\bcapacity\b/.test(text)) {
    const workload = getWorkload(members, tasks);
    if (!workload.length) {
      return { reply: 'There are no team members yet.', actions: [], requiresConfirmation: false };
    }
    return {
      reply: `**Team workload (open tasks):**\n${bullets(
        workload.map(
          (w) =>
            `**${w.member.name}** — ${w.open} open (${w.overdue} overdue), ~${w.utilization}% capacity`
        )
      )}\n\n${workload[0].member.name} has the most assigned work right now.`,
      actions: [],
      requiresConfirmation: false,
    };
  }

  if (/\burgent\b|\bcritical\b|\bhigh priority\b|\bhighest priority\b/.test(text) && !wantsAdd) {
    const urgentOnly = /\burgent\b|\bcritical\b/.test(text);
    const urgent = urgentOnly
      ? tasks.filter((t) => t.status !== 'completed' && t.priority === 'urgent')
      : getUrgentTasks(tasks);
    if (!urgent.length) {
      return {
        reply: `No open ${urgentOnly ? 'urgent' : 'urgent or high-priority'} tasks. The board is clear.`,
        actions: [],
        requiresConfirmation: false,
      };
    }
    return {
      reply: `**${urgent.length} ${urgentOnly ? 'urgent' : 'high-priority'} ${urgent.length === 1 ? 'task' : 'tasks'}:**\n${bullets(
        urgent.map(
          (t) =>
            `**${t.title}** — ${projectName(t.projectId, projects) || 'No project'}, ${
              memberNameOf(t.assigneeId, members) || 'Unassigned'
            }, ${dueText(t)}`
        )
      )}`,
      actions: [],
      requiresConfirmation: false,
    };
  }

  if (project && /completion|progress|how (is|far)|percent|complete/.test(text)) {
    const progress = getProjectProgress(project, tasks);
    const projectTasks = getProjectTasks(project.id, tasks);
    const counts = getTaskCounts(projectTasks);
    const diff = daysUntil(project.dueDate);
    return {
      reply: `**${project.name}** is **${progress}% complete** (${counts.completed}/${counts.total} tasks).\n${bullets([
        `${PROJECT_STATUS_MAP[project.status]?.label} · ${priorityLabel(project.priority)} priority`,
        diff === null ? 'No due date' : diff < 0 ? `${Math.abs(diff)} days overdue` : `${diff} days until the deadline`,
        `${counts.open} open, ${counts.overdue} overdue`,
        project.memberIds.length ? `${project.memberIds.length} team members assigned` : 'No members assigned',
      ])}`,
      actions: [],
      requiresConfirmation: false,
    };
  }

  if (task && isQuestion) {
    return {
      reply: `**${task.title}**\n${bullets([
        `Project: ${projectName(task.projectId, projects) || 'None'}`,
        `Status: ${TASK_STATUS_MAP[task.status]?.label} · ${priorityLabel(task.priority)} priority`,
        `Assignee: ${memberNameOf(task.assigneeId, members) || 'Unassigned'}`,
        dueText(task),
        task.subtasks?.length
          ? `Subtasks: ${task.subtasks.filter((s) => s.done).length}/${task.subtasks.length} complete`
          : null,
      ])}`,
      actions: [],
      requiresConfirmation: false,
    };
  }

  if (member && /what|which|show|list|assigned|tasks|working on/.test(text)) {
    const assigned = tasks.filter((t) => t.assigneeId === member.id);
    const counts = getTaskCounts(assigned);
    const open = assigned.filter((t) => t.status !== 'completed');
    return {
      reply: `**${member.name}** (${member.role}) has ${counts.open} open tasks and ${counts.completed} completed.\n${bullets(
        open.slice(0, 8).map((t) => `**${t.title}** — ${TASK_STATUS_MAP[t.status]?.label}, ${dueText(t)}`)
      )}`,
      actions: [],
      requiresConfirmation: false,
    };
  }

  if (/recommend|suggest|improve|advice|what should|focus|prioriti|risk/.test(text)) {
    return {
      reply: buildRecommendations(projects, tasks, members),
      actions: [],
      requiresConfirmation: false,
    };
  }

  if (project && /status|summary|overview|how is|details|info/.test(text)) {
    return {
      reply: `${projectLine(project, tasks)}\n\n${project.description || ''}\n${bullets([
        `Team: ${project.memberIds.map((id) => memberNameOf(id, members)).filter(Boolean).join(', ') || 'Unassigned'}`,
        `Start: ${formatDate(project.startDate)} · Due: ${formatDate(project.dueDate)}`,
        projectStatusSummary(project, tasks),
      ])}`,
      actions: [],
      requiresConfirmation: false,
    };
  }

  if (/\bprojects?\b/.test(text) && /list|show|all|status|summary|overview|how many/.test(text)) {
    return {
      reply: `**All ${projects.length} projects:**\n${bullets(projects.map((p) => projectLine(p, tasks)))}`,
      actions: [],
      requiresConfirmation: false,
    };
  }

  if (/summary|overview|status report|how are we|health/.test(text)) {
    return {
      reply: `**Workspace summary**\n${buildWorkspaceSummary(projects, tasks)}`,
      actions: [],
      requiresConfirmation: false,
    };
  }

  if (/team|members|people/.test(text) && /list|show|who|all/.test(text)) {
    return {
      reply: `**Team (${members.length}):**\n${bullets(
        members.map((m) => {
          const w = getWorkload([m], tasks)[0];
          return `**${m.name}** — ${m.role}, ${w.open} open tasks`;
        })
      )}`,
      actions: [],
      requiresConfirmation: false,
    };
  }

  if (/my (tasks|work|plate)/.test(text)) {
    const mine = tasks.filter((t) => t.assigneeId === currentUserId);
    const counts = getTaskCounts(mine);
    const open = mine.filter((t) => t.status !== 'completed');
    return {
      reply: `You (${currentUser?.name || 'there'}) have **${counts.open} open tasks** and ${counts.overdue} overdue.\n${bullets(
        open.slice(0, 8).map((t) => `**${t.title}** — ${TASK_STATUS_MAP[t.status]?.label}, ${dueText(t)}`)
      )}`,
      actions: [],
      requiresConfirmation: false,
    };
  }

  const suggestions = [
    'Which projects are behind schedule?',
    'What tasks are due this week?',
    'Who has the most assigned tasks?',
    'Show me all urgent tasks',
  ];
  return {
    reply: `I couldn't map that to your workspace with certainty. I can answer questions like:\n${bullets(
      suggestions.map((s) => `"${s}"`)
    )}\n\nOr ask me to update something, e.g. "Mark the monthly performance report task as completed".`,
    actions: [],
    requiresConfirmation: false,
  };
};

const projectName = (projectId, projects) =>
  projects.find((p) => p.id === projectId)?.name || null;

const memberNameOf = (memberId, members) =>
  members.find((m) => m.id === memberId)?.name || null;

const memberStatsText = (member, tasks) => {
  const assigned = tasks.filter((t) => t.assigneeId === member.id);
  return `${assigned.length} assigned ${assigned.length === 1 ? 'task' : 'tasks'}`;
};

const projectStatusSummary = (project, tasks) => {
  const counts = getTaskCounts(getProjectTasks(project.id, tasks));
  return `${counts.completed} of ${counts.total} tasks complete · ${counts.overdue} overdue`;
};

export const getLocalWelcome = () =>
  `Hi, I'm **Pulse AI** — your project assistant. I'm connected to the live workspace, so my answers use your real projects, tasks and team.

Try asking me about deadlines, workload or risk, or tell me to create and update work.`;
