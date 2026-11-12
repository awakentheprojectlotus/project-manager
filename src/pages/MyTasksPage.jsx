import { useMemo, useState } from 'react';
import { AlertTriangle, CalendarClock, CheckCircle2, ListChecks, Plus } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import FilterBar from '../components/tasks/FilterBar';
import KanbanBoard from '../components/tasks/KanbanBoard';
import TaskListView from '../components/tasks/TaskListView';
import TaskCalendarView from '../components/tasks/TaskCalendarView';
import { useTaskStore } from '../stores/taskStore';
import { useProjectStore } from '../stores/projectStore';
import { useTeamStore } from '../stores/teamStore';
import { useUiStore } from '../stores/uiStore';
import { filterTasks, sortTasks } from '../utils/filters';
import { getTaskCounts, getDueToday } from '../utils/analytics';

const defaultFilters = {
  search: '',
  projectId: 'all',
  status: 'all',
  priority: 'all',
  assigneeId: 'all',
  due: 'all',
  sort: 'priority',
};

export default function MyTasksPage() {
  const tasks = useTaskStore((s) => s.tasks);
  const deleteTask = useTaskStore((s) => s.deleteTask);
  const projects = useProjectStore((s) => s.projects);
  const members = useTeamStore((s) => s.members);
  const currentUserId = useUiStore((s) => s.currentUserId);
  const defaultView = useUiStore((s) => s.prefs.defaultTaskView);
  const openTaskForm = useUiStore((s) => s.openTaskForm);
  const confirm = useUiStore((s) => s.confirm);
  const pushToast = useUiStore((s) => s.pushToast);

  const [filters, setFilters] = useState(defaultFilters);
  const [view, setView] = useState(defaultView || 'kanban');

  const myTasks = useMemo(
    () => tasks.filter((t) => t.assigneeId === currentUserId),
    [tasks, currentUserId]
  );
  const visibleTasks = useMemo(
    () => sortTasks(filterTasks(myTasks, filters), filters.sort),
    [myTasks, filters]
  );

  const counts = getTaskCounts(myTasks);
  const dueToday = getDueToday(myTasks).length;

  const handleDelete = async (task) => {
    const ok = await confirm({
      title: 'Delete this task?',
      description: `'${task.title}' will be permanently removed.`,
      confirmLabel: 'Delete task',
    });
    if (!ok) return;
    deleteTask(task.id);
    pushToast({ type: 'info', title: 'Task deleted', message: `'${task.title}' was removed.` });
  };

  const user = members.find((m) => m.id === currentUserId);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Personal focus"
        title="My Tasks"
        description={`Everything assigned to ${user?.name || 'you'}, across every project.`}
      >
        <Button size="sm" icon={Plus} onClick={() => openTaskForm(null, { assigneeId: currentUserId })}>
          New task
        </Button>
      </PageHeader>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Pending', value: counts.open, icon: ListChecks, tone: 'text-brand-600 dark:text-brand-400' },
          { label: 'Due today', value: dueToday, icon: CalendarClock, tone: 'text-amber-600 dark:text-amber-400' },
          { label: 'Overdue', value: counts.overdue, icon: AlertTriangle, tone: 'text-rose-600 dark:text-rose-400' },
          { label: 'Completed', value: counts.completed, icon: CheckCircle2, tone: 'text-emerald-600 dark:text-emerald-400' },
        ].map((item) => (
          <Card key={item.label} className="flex items-center gap-3 p-3.5">
            <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-elevated ${item.tone}`}>
              <item.icon className="h-4 w-4" />
            </span>
            <div>
              <p className="text-lg font-bold leading-none text-ink">{item.value}</p>
              <p className="mt-1 text-[11px] text-muted">{item.label}</p>
            </div>
          </Card>
        ))}
      </div>

      <FilterBar
        filters={filters}
        onChange={setFilters}
        projects={projects}
        members={members}
        showAssignee={false}
        view={view}
        onViewChange={setView}
        onClear={() => setFilters(defaultFilters)}
        resultCount={visibleTasks.length}
      />

      {view === 'kanban' && (
        <KanbanBoard
          tasks={visibleTasks}
          projects={projects}
          members={members}
          onEdit={openTaskForm}
          onDelete={handleDelete}
        />
      )}
      {view === 'list' && (
        <TaskListView
          tasks={visibleTasks}
          projects={projects}
          members={members}
          onEdit={openTaskForm}
          onDelete={handleDelete}
          emptyTitle="No tasks assigned to you"
          emptyDescription="When work is assigned to you it will appear here. You can also create a task for yourself."
        />
      )}
      {view === 'calendar' && (
        <TaskCalendarView
          tasks={visibleTasks}
          projects={projects}
          members={members}
          onEdit={openTaskForm}
        />
      )}
    </div>
  );
}
