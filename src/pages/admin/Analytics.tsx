import { useEffect, useState } from 'react';
import { PageTitle, StatCard } from '../../components/admin/AdminUI';
import { LoadingState, ErrorState, EmptyState } from '../../components/States';
import {
  getAllMembers,
  getEvents,
  getAllTasks,
  getBudgets,
  getAllAttendance,
  getAllVolunteerHours,
} from '../../lib/adminApi';

interface Member {
  id: string;
  joined_at: string | null;
}

interface EventRow {
  id: string;
  status: string;
}

interface Task {
  id: string;
  status: string;
}

interface Budget {
  id: string;
  type: string;
  amount: number;
}

interface Attendance {
  id: string;
  status: string;
}

interface VolunteerHour {
  id: string;
  hours: number;
}

export default function Analytics() {
  const [members, setMembers] = useState<Member[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [volunteerHours, setVolunteerHours] = useState<VolunteerHour[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const [m, e, t, b, a, v] = await Promise.all([
        getAllMembers(),
        getEvents(),
        getAllTasks(),
        getBudgets(),
        getAllAttendance(),
        getAllVolunteerHours(),
      ]);
      setMembers(m as Member[]);
      setEvents(e as EventRow[]);
      setTasks(t as Task[]);
      setBudgets(b as Budget[]);
      setAttendance(a as Attendance[]);
      setVolunteerHours(v as VolunteerHour[]);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      await refresh();
    })();
  }, []);

  if (loading) return <LoadingState message="Loading analytics..." />;
  if (error) return <ErrorState message={error} onRetry={refresh} />;

  // Stats
  const totalMembers = members.length;
  const totalEvents = events.length;
  const completedTasks = tasks.filter((t) => t.status === 'completed').length;
  const taskRate = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;
  const totalVolunteerHours = volunteerHours.reduce((s, v) => s + (Number(v.hours) || 0), 0);
  const totalIncome = budgets.filter((b) => b.type === 'income').reduce((s, b) => s + (Number(b.amount) || 0), 0);
  const totalExpense = budgets.filter((b) => b.type === 'expense').reduce((s, b) => s + (Number(b.amount) || 0), 0);
  const totalBudget = totalIncome - totalExpense;

  // Attendance rate
  const presentCount = attendance.filter((a) => a.status === 'present').length;
  const attendanceRate = attendance.length > 0 ? Math.round((presentCount / attendance.length) * 100) : 0;

  // Member growth by joined_at month
  const monthMap = new Map<string, number>();
  members.forEach((m) => {
    if (!m.joined_at) return;
    const d = new Date(m.joined_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthMap.set(key, (monthMap.get(key) ?? 0) + 1);
  });
  const monthLabels: Record<string, string> = {
    '01': 'Jan', '02': 'Feb', '03': 'Mar', '04': 'Apr', '05': 'May', '06': 'Jun',
    '07': 'Jul', '08': 'Aug', '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dec',
  };
  const monthEntries = Array.from(monthMap.entries()).sort();
  const maxMonthCount = Math.max(1, ...monthEntries.map(([, c]) => c));

  // Event status distribution
  const eventStatusMap = new Map<string, number>();
  events.forEach((e) => {
    eventStatusMap.set(e.status, (eventStatusMap.get(e.status) ?? 0) + 1);
  });
  const eventStatuses = Array.from(eventStatusMap.entries()).sort((a, b) => b[1] - a[1]);
  const maxEventStatus = Math.max(1, ...eventStatuses.map(([, c]) => c));

  // Budget bar max
  const budgetMax = Math.max(1, totalIncome, totalExpense);

  return (
    <div>
      <PageTitle title="Analytics" subtitle="Insights across your club" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <StatCard label="Total Members" value={totalMembers} icon="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-8 0 4 4 0 008 0z" color="primary" />
        <StatCard label="Total Events" value={totalEvents} icon="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" color="blue" />
        <StatCard label="Task Completion" value={`${taskRate}%`} icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" color="green" />
        <StatCard label="Volunteer Hours" value={totalVolunteerHours} icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" color="amber" />
        <StatCard label="Total Budget" value={`$${totalBudget.toLocaleString()}`} icon="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" color="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Member Growth */}
        <div className="card p-6">
          <h3 className="text-lg font-display font-bold text-slate-900 dark:text-white mb-4">Member Growth</h3>
          {monthEntries.length === 0 ? (
            <EmptyState title="No data" message="No member join dates recorded." />
          ) : (
            <div className="flex items-end gap-2 h-48">
              {monthEntries.map(([key, count]) => {
                const [, mon] = key.split('-');
                const heightPct = Math.round((count / maxMonthCount) * 100);
                return (
                  <div key={key} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{count}</span>
                    <div className="w-full bg-primary-500 rounded-t-md transition-all" style={{ height: `${heightPct}%` }} />
                    <span className="text-xs text-slate-500 dark:text-slate-400 truncate">{monthLabels[mon] ?? mon}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Event Status Distribution */}
        <div className="card p-6">
          <h3 className="text-lg font-display font-bold text-slate-900 dark:text-white mb-4">Event Status Distribution</h3>
          {eventStatuses.length === 0 ? (
            <EmptyState title="No data" message="No events found." />
          ) : (
            <div className="space-y-3">
              {eventStatuses.map(([status, count]) => {
                const widthPct = Math.round((count / maxEventStatus) * 100);
                return (
                  <div key={status}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300 capitalize">{status.replace(/_/g, ' ')}</span>
                      <span className="text-sm text-slate-500 dark:text-slate-400">{count}</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${widthPct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Task Completion Rate */}
        <div className="card p-6">
          <h3 className="text-lg font-display font-bold text-slate-900 dark:text-white mb-4">Task Completion Rate</h3>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-600 dark:text-slate-400">{completedTasks} of {tasks.length} tasks completed</span>
            <span className="text-2xl font-display font-bold text-slate-900 dark:text-white">{taskRate}%</span>
          </div>
          <div className="w-full h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${taskRate}%` }} />
          </div>
        </div>

        {/* Attendance Rate */}
        <div className="card p-6">
          <h3 className="text-lg font-display font-bold text-slate-900 dark:text-white mb-4">Attendance Rate</h3>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-600 dark:text-slate-400">{presentCount} of {attendance.length} records present</span>
            <span className="text-2xl font-display font-bold text-slate-900 dark:text-white">{attendanceRate}%</span>
          </div>
          <div className="w-full h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-primary-500 rounded-full transition-all" style={{ width: `${attendanceRate}%` }} />
          </div>
        </div>

        {/* Budget Breakdown */}
        <div className="card p-6 lg:col-span-2">
          <h3 className="text-lg font-display font-bold text-slate-900 dark:text-white mb-4">Budget Breakdown</h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-green-600 dark:text-green-400">Income</span>
                <span className="text-sm text-slate-600 dark:text-slate-400">${totalIncome.toLocaleString()}</span>
              </div>
              <div className="w-full h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${Math.round((totalIncome / budgetMax) * 100)}%` }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-red-600 dark:text-red-400">Expense</span>
                <span className="text-sm text-slate-600 dark:text-slate-400">${totalExpense.toLocaleString()}</span>
              </div>
              <div className="w-full h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-red-500 rounded-full transition-all" style={{ width: `${Math.round((totalExpense / budgetMax) * 100)}%` }} />
              </div>
            </div>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Net Balance</span>
              <span className={`text-lg font-display font-bold ${totalBudget >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                ${totalBudget.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
