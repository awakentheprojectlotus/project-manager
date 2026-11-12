import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { TASK_STATUS_MAP, PRIORITY_MAP } from '../../constants';

function ChartTooltip({ active, payload, label, labelFormatter }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-edge bg-elevated px-3 py-2 shadow-pop">
      {label !== undefined && (
        <p className="mb-1 text-[11px] font-semibold text-ink">
          {labelFormatter ? labelFormatter(label) : label}
        </p>
      )}
      <div className="space-y-0.5">
        {payload.map((entry) => (
          <p key={entry.dataKey || entry.name} className="flex items-center gap-2 text-[11px] text-muted">
            <span
              className="h-1.5 w-1.5 shrink-0 rounded-full"
              style={{ backgroundColor: entry.color || entry.payload?.fill }}
            />
            <span className="flex-1">{entry.name}</span>
            <span className="font-semibold text-ink">{entry.value}</span>
          </p>
        ))}
      </div>
    </div>
  );
}

export function TaskCompletionChart({ data }) {
  return (
    <div className="h-[230px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="completedGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity={0.32} />
              <stop offset="100%" stopColor="#6366f1" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="createdGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#94a3b8" stopOpacity={0.18} />
              <stop offset="100%" stopColor="#94a3b8" stopOpacity={0.01} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} strokeDasharray="3 4" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} dy={8} interval="preserveStartEnd" />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={36} />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#94a3b8', strokeDasharray: '3 3' }} />
          <Area
            type="monotone"
            dataKey="completed"
            name="Completed"
            stroke="#6366f1"
            strokeWidth={2.5}
            fill="url(#completedGradient)"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2, stroke: '#fff' }}
          />
          <Area
            type="monotone"
            dataKey="created"
            name="Created"
            stroke="#94a3b8"
            strokeWidth={2}
            strokeDasharray="5 4"
            fill="url(#createdGradient)"
            dot={false}
            activeDot={{ r: 3.5 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function StatusDonut({ data, total, height = 190 }) {
  const pieData = data.filter((d) => d.value > 0).map((d) => ({ ...d, fill: TASK_STATUS_MAP[d.key]?.hex || '#94a3b8' }));
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div className="relative h-[190px] w-[190px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData.length ? pieData : [{ name: 'No tasks', value: 1, fill: '#e2e8f0' }]}
              dataKey="value"
              nameKey="name"
              innerRadius={58}
              outerRadius={80}
              paddingAngle={pieData.length ? 2.5 : 0}
              stroke="none"
            >
              {(pieData.length ? pieData : [{ fill: '#e2e8f0' }]).map((entry, index) => (
                <Cell key={index} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-ink">{total}</span>
          <span className="text-[10px] uppercase tracking-wider text-muted">tasks</span>
        </div>
      </div>
      <ul className="w-full flex-1 space-y-2">
        {data.map((item) => {
          const meta = TASK_STATUS_MAP[item.key];
          return (
            <li key={item.key} className="flex items-center gap-2 text-xs">
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: meta?.hex }} />
              <span className="flex-1 whitespace-nowrap text-muted">{item.name}</span>
              <span className="font-semibold text-ink">{item.value}</span>
              <span className="w-9 text-right text-[11px] text-muted">
                {total ? Math.round((item.value / total) * 100) : 0}%
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function WorkloadChart({ data }) {
  const chartData = data.slice(0, 5).map((w) => ({
    name: w.member.name.split(' ')[0],
    fullName: w.member.name,
    open: w.open,
    utilization: w.utilization,
  }));
  return (
    <div className="h-[200px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="vertical" margin={{ top: 2, right: 14, left: 0, bottom: 0 }}>
          <CartesianGrid horizontal={false} strokeDasharray="3 4" />
          <XAxis type="number" hide allowDecimals={false} />
          <YAxis
            type="category"
            dataKey="name"
            width={70}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11 }}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(148,163,184,0.08)' }} />
          <Bar dataKey="open" name="Open tasks" radius={[0, 6, 6, 0]} barSize={14}>
            {chartData.map((entry, index) => (
              <Cell
                key={index}
                fill={entry.utilization > 100 ? '#f43f5e' : entry.utilization > 80 ? '#f59e0b' : '#6366f1'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function PriorityChart({ data }) {
  const chartData = data.map((d) => ({ ...d, fill: PRIORITY_MAP[d.key]?.hex || '#94a3b8' }));
  return (
    <div className="h-[190px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 8, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 4" />
          <XAxis dataKey="name" tickLine={false} axisLine={false} dy={6} tick={{ fontSize: 11 }} />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={30} />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(148,163,184,0.08)' }} />
          <Bar dataKey="value" name="Open tasks" radius={[6, 6, 0, 0]} barSize={36}>
            {chartData.map((entry, index) => (
              <Cell key={index} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export { ChartTooltip };
