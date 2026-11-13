import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import {
  ArrowRight,
  CheckSquare,
  FolderPlus,
  Search,
  Sparkles,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { useUiStore } from '../../stores/uiStore';
import { useProjectStore } from '../../stores/projectStore';
import { useTaskStore } from '../../stores/taskStore';
import { useTeamStore } from '../../stores/teamStore';
import { normalize } from '../../utils/match';
import { useScrollLock } from '../../hooks/useScrollLock';
import { StatusBadge } from '../ui/Badge';
import Avatar from '../ui/Avatar';
import { formatDate } from '../../utils/date';

export default function CommandPalette() {
  const open = useUiStore((s) => s.commandOpen);
  const setOpen = useUiStore((s) => s.setCommandOpen);
  const openTaskForm = useUiStore((s) => s.openTaskForm);
  const openProjectForm = useUiStore((s) => s.openProjectForm);
  const openMemberForm = useUiStore((s) => s.openMemberForm);
  const openMemberDetail = useUiStore((s) => s.openMemberDetail);
  const projects = useProjectStore((s) => s.projects);
  const tasks = useTaskStore((s) => s.tasks);
  const members = useTeamStore((s) => s.members);
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const [query, setQuery] = useState('');
  const [index, setIndex] = useState(0);
  useScrollLock(open);

  useEffect(() => {
    if (open) {
      setQuery('');
      setIndex(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  const q = normalize(query);

  const groups = useMemo(() => {
    const byQuery = (text) => !q || normalize(text).includes(q);
    const projectItems = projects
      .filter((p) => byQuery(`${p.name} ${p.key} ${p.description}`))
      .slice(0, 5)
      .map((project) => ({
        id: `project-${project.id}`,
        label: project.name,
        meta: `${project.key} · Due ${formatDate(project.dueDate)}`,
        icon: null,
        project,
        type: 'project',
        action: () => navigate(`/projects/${project.id}`),
      }));

    const taskItems = tasks
      .filter((t) => byQuery(`${t.title} ${t.description}`))
      .slice(0, 6)
      .map((task) => ({
        id: `task-${task.id}`,
        label: task.title,
        meta: projects.find((p) => p.id === task.projectId)?.name || 'No project',
        task,
        type: 'task',
        action: () => openTaskForm(task),
      }));

    const memberItems = members
      .filter((m) => byQuery(`${m.name} ${m.role} ${m.email}`))
      .slice(0, 4)
      .map((member) => ({
        id: `member-${member.id}`,
        label: member.name,
        meta: member.role,
        member,
        type: 'member',
        action: () => openMemberDetail(member.id),
      }));

    const quickActions = [
      {
        id: 'action-task',
        label: 'Create a new task',
        meta: 'Quick action',
        icon: CheckSquare,
        type: 'action',
        action: () => openTaskForm(),
      },
      {
        id: 'action-project',
        label: 'Create a new project',
        meta: 'Quick action',
        icon: FolderPlus,
        type: 'action',
        action: () => openProjectForm(),
      },
      {
        id: 'action-member',
        label: 'Add a team member',
        meta: 'Quick action',
        icon: UserPlus,
        type: 'action',
        action: () => openMemberForm(),
      },
      {
        id: 'action-ai',
        label: 'Ask Pulse AI',
        meta: 'Assistant',
        icon: Sparkles,
        type: 'action',
        action: () => navigate('/assistant'),
      },
      {
        id: 'action-team',
        label: 'Open team members',
        meta: 'Navigate',
        icon: Users,
        type: 'action',
        action: () => navigate('/team'),
      },
    ].filter((item) => byQuery(item.label));

    return [
      { title: 'Projects', items: projectItems },
      { title: 'Tasks', items: taskItems },
      { title: 'Team members', items: memberItems },
      { title: 'Quick actions', items: quickActions },
    ].filter((group) => group.items.length > 0);
  }, [q, projects, tasks, members, navigate, openTaskForm, openProjectForm, openMemberForm, openMemberDetail]);

  const flat = useMemo(() => groups.flatMap((group) => group.items), [groups]);

  useEffect(() => {
    setIndex((prev) => (flat.length ? Math.min(prev, flat.length - 1) : 0));
  }, [flat.length]);

  const runItem = (item) => {
    if (!item) return;
    setOpen(false);
    item.action();
  };

  const onKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setIndex((prev) => (flat.length ? (prev + 1) % flat.length : 0));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setIndex((prev) => (flat.length ? (prev - 1 + flat.length) % flat.length : 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      runItem(flat[index]);
    } else if (event.key === 'Escape') {
      setOpen(false);
    }
  };

  useEffect(() => {
    const active = listRef.current?.querySelector('[data-active="true"]');
    active?.scrollIntoView({ block: 'nearest' });
  }, [index]);

  if (!open) return null;

  let cursor = -1;

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-start justify-center p-4 sm:pt-[12vh]">
      <div
        className="absolute inset-0 animate-fade-in bg-slate-950/55 backdrop-blur-[3px]"
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />
      <div className="relative z-10 w-full max-w-xl animate-scale-in overflow-hidden rounded-2xl border border-edge bg-surface shadow-pop">
        <div className="flex items-center gap-3 border-b border-edge px-4 py-3">
          <Search className="h-[18px] w-[18px] shrink-0 text-muted" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setIndex(0);
            }}
            onKeyDown={onKeyDown}
            placeholder="Search projects, tasks and people…"
            className="h-7 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-muted"
          />
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="grid h-7 w-7 place-items-center rounded-lg text-muted hover:bg-elevated hover:text-ink"
            aria-label="Close search"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div ref={listRef} className="scrollbar-thin max-h-[55vh] overflow-y-auto px-2 py-2">
          {flat.length === 0 ? (
            <p className="px-3 py-10 text-center text-sm text-muted">
              No results for “{query}”. Try a project, task or teammate name.
            </p>
          ) : (
            groups.map((group) => (
              <div key={group.title} className="mb-1">
                <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
                  {group.title}
                </p>
                {group.items.map((item) => {
                  cursor += 1;
                  const active = cursor === index;
                  const ItemIcon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      data-active={active}
                      onMouseEnter={() => setIndex(flat.indexOf(item))}
                      onClick={() => runItem(item)}
                      className={clsx(
                        'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition',
                        active ? 'bg-brand-50 dark:bg-brand-500/10' : 'hover:bg-canvas'
                      )}
                    >
                      {item.type === 'project' && (
                        <span
                          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[11px] font-bold text-white"
                          style={{ backgroundColor: item.project.color }}
                        >
                          {item.project.key.slice(0, 3)}
                        </span>
                      )}
                      {item.type === 'task' && (
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-elevated">
                          <CheckSquare className="h-4 w-4 text-muted" />
                        </span>
                      )}
                      {item.type === 'member' && <Avatar member={item.member} size="sm" />}
                      {item.type === 'action' && (
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                          {ItemIcon && <ItemIcon className="h-4 w-4" />}
                        </span>
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-medium text-ink">{item.label}</span>
                        <span className="block truncate text-[11px] text-muted">{item.meta}</span>
                      </span>
                      {item.type === 'project' && <StatusBadge status={item.project.status} kind="project" size="sm" />}
                      {item.type === 'task' && <StatusBadge status={item.task.status} size="sm" />}
                      <ArrowRight
                        className={clsx(
                          'h-3.5 w-3.5 shrink-0 transition',
                          active ? 'text-brand-500' : 'text-transparent'
                        )}
                      />
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <div className="flex items-center justify-between border-t border-edge bg-canvas/60 px-4 py-2 text-[10px] text-muted">
          <span>Navigate with ↑ ↓ · Enter to open</span>
          <span>Pulse search</span>
        </div>
      </div>
    </div>,
    document.body
  );
}
