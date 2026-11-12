import { Filter, Search, X } from 'lucide-react';
import Input, { Select } from '../ui/Input';
import Tabs from '../ui/Tabs';
import Button from '../ui/Button';
import { DUE_FILTERS, PRIORITIES, SORT_OPTIONS, TASK_STATUSES } from '../../constants';
import { countActiveFilters } from '../../utils/filters';

const VIEW_TABS = [
  { value: 'kanban', label: 'Board' },
  { value: 'list', label: 'List' },
  { value: 'calendar', label: 'Calendar' },
];

export default function FilterBar({
  filters,
  onChange,
  projects = [],
  members = [],
  showProject = true,
  showAssignee = true,
  showSort = true,
  showDate = true,
  view,
  onViewChange,
  views = VIEW_TABS,
  onClear,
  resultCount,
}) {
  const activeCount = countActiveFilters(filters);
  const set = (key, value) => onChange({ ...filters, [key]: value });

  return (
    <div className="space-y-2.5">
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
        <div className="flex-1">
          <Input
            icon={Search}
            value={filters.search || ''}
            onChange={(e) => set('search', e.target.value)}
            placeholder="Search tasks by title or description…"
            aria-label="Search tasks"
          />
        </div>
        {onViewChange && views && (
          <Tabs tabs={views} value={view} onChange={onViewChange} className="self-start sm:self-auto" />
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="hidden items-center gap-1.5 text-[11px] font-medium text-muted sm:flex">
          <Filter className="h-3.5 w-3.5" />
          Filters
        </span>

        {showProject && (
          <Select
            value={filters.projectId || 'all'}
            onChange={(e) => set('projectId', e.target.value)}
            className="min-w-[150px] flex-1 sm:flex-none"
            options={[
              { value: 'all', label: 'All projects' },
              ...projects.map((p) => ({ value: p.id, label: p.name })),
            ]}
            aria-label="Filter by project"
          />
        )}

        <Select
          value={filters.status || 'all'}
          onChange={(e) => set('status', e.target.value)}
          className="min-w-[130px] flex-1 sm:flex-none"
          options={[{ value: 'all', label: 'All statuses' }, ...TASK_STATUSES.map((s) => ({ value: s.value, label: s.label }))]}
          aria-label="Filter by status"
        />

        <Select
          value={filters.priority || 'all'}
          onChange={(e) => set('priority', e.target.value)}
          className="min-w-[125px] flex-1 sm:flex-none"
          options={[{ value: 'all', label: 'All priorities' }, ...PRIORITIES.map((p) => ({ value: p.value, label: p.label }))]}
          aria-label="Filter by priority"
        />

        {showAssignee && (
          <Select
            value={filters.assigneeId || 'all'}
            onChange={(e) => set('assigneeId', e.target.value)}
            className="min-w-[145px] flex-1 sm:flex-none"
            options={[
              { value: 'all', label: 'All assignees' },
              ...members.map((m) => ({ value: m.id, label: m.name })),
            ]}
            aria-label="Filter by assignee"
          />
        )}

        {showDate && (
          <Select
            value={filters.due || 'all'}
            onChange={(e) => set('due', e.target.value)}
            className="min-w-[130px] flex-1 sm:flex-none"
            options={DUE_FILTERS}
            aria-label="Filter by due date"
          />
        )}

        {showSort && (
          <Select
            value={filters.sort || 'priority'}
            onChange={(e) => set('sort', e.target.value)}
            className="min-w-[130px] flex-1 sm:flex-none"
            options={SORT_OPTIONS}
            aria-label="Sort tasks"
          />
        )}

        {activeCount > 0 && onClear && (
          <Button variant="ghost" size="sm" icon={X} onClick={onClear} className="text-[11px]">
            Clear ({activeCount})
          </Button>
        )}

        {typeof resultCount === 'number' && (
          <span className="ml-auto text-[11px] text-muted">
            {resultCount} {resultCount === 1 ? 'task' : 'tasks'}
          </span>
        )}
      </div>
    </div>
  );
}
