import { useMemo, useState } from 'react';
import { AlertTriangle, CalendarClock, CalendarDays, CalendarOff, Plus } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import FilterBar from '../components/tasks/FilterBar';
import TaskCalendarView from '../components/tasks/TaskCalendarView';
import { useTaskStore } from '../stores/taskStore';
import { useProjectStore } from '../stores/projectStore';
import { useTeamStore } from '../stores/teamStore';
import { useUiStore } from '../stores/uiStore';
import { filterTasks } from '../utils/filters';
import { getOverdueTasks, getTasksDueWithin } from '../utils/analytics';

const defaultFilters = {
  search: '',
  projectId: 'all',
  status: 'all',
  priority: 'all',
  assigneeId: 'all',
  due: 'all',
  sort: 'dueDate',
};

export default function CalendarPage() {
  const tasks = useTaskStore((s) => s.tasks);
  const projects = useProjectStore((s) => s.projects);
  const members = useTeamStore((s) => s.members);
  const openTaskForm = useUiStore((s) => s.openTaskForm);
  const [filters, setFilters] = useState(defaultFilters);

  const visible = useMemo(() => filterTasks(tasks, filters), [tasks, filters]);
  const overdue = getOverdueTasks(tasks).length;
  const dueSoon = getTasksDueWithin(tasks, 7).length;
  const unscheduled = tasks.filter((t) => !t.dueDate && t.status !== 'completed').length;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Schedule"
        title="Calendar"
        description="Every deadline in one place. Click a task to edit it, or add work directly to a day."
      >
        <Button size="sm" icon={Plus} onClick={() => openTaskForm()}>
          New task
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          {
            label: 'Due this week',
            value: dueSoon,
            icon: CalendarClock,
            tone: 'text-amber-600 dark:text-amber-400',
            hint: 'Next 7 days',
          },
          {
            label: 'Overdue',
            value: overdue,
            icon: AlertTriangle,
            tone: 'text-rose-600 dark:text-rose-400',
            hint: 'Needs rescheduling',
          },
          {
            label: 'Unscheduled',
            value: unscheduled,
            icon: CalendarOff,
            tone: 'text-slate-500 dark:text-slate-400',
            hint: 'Open tasks without a date',
          },
        ].map((item) => (
          <Card key={item.label} className="flex items-center gap-3 p-4">
            <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-elevated ${item.tone}`}>
              <item.icon className="h-[18px] w-[18px]" />
            </span>
            <div className="min-w-0">
              <p className="text-xl font-bold leading-none text-ink">{item.value}</p>
              <p className="mt-1 text-[11px] text-muted">
                {item.label} <span className="text-muted/60">· {item.hint}</span>
              </p>
            </div>
          </Card>
        ))}
      </div>

      <FilterBar
        filters={filters}
        onChange={setFilters}
        projects={projects}
        members={members}
        showSort={false}
        showDate={false}
        showProject
        onClear={() => setFilters(defaultFilters)}
        resultCount={visible.length}
      />

      <TaskCalendarView tasks={visible} projects={projects} members={members} onEdit={openTaskForm} />

      <div className="flex items-center gap-2 rounded-xl border border-edge bg-surface px-4 py-2.5 text-[11px] text-muted">
        <CalendarDays className="h-3.5 w-3.5" />
        Tasks without a due date don't appear on the calendar. Add a deadline from any task's edit form.
      </div>
    </div>
  );
}
