import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { PageTitle, StatCard } from '../../components/member/MemberUI';
import { LoadingState, ErrorState, EmptyState } from '../../components/States';
import { getMyPerformance, getMyAttendance, getMyTasks, getMyVolunteerHours } from '../../lib/memberApi';

export default function Performance() {
  const { member } = useAuth();
  const [metrics, setMetrics] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [volunteer, setVolunteer] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!member) return;
    Promise.all([getMyPerformance(member.id), getMyAttendance(member.id), getMyTasks(member.id), getMyVolunteerHours(member.id)])
      .then(([m, a, t, v]) => { setMetrics(m); setAttendance(a); setTasks(t); setVolunteer(v); })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [member]);

  const currentStats = useMemo(() => {
    const present = attendance.filter(a => a.status === 'present').length;
    const rate = attendance.length > 0 ? Math.round((present / attendance.length) * 100) : 0;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const assigned = tasks.length;
    const approvedHours = volunteer.filter(v => v.status === 'approved').reduce((sum, v) => sum + Number(v.hours), 0);
    const latest = metrics[0];
    return { rate, completed, assigned, approvedHours, latest };
  }, [attendance, tasks, volunteer, metrics]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message="Failed to load performance data." />;

  return (
    <div>
      <PageTitle title="My Performance" subtitle="Track your engagement and contributions" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Attendance Rate" value={`${currentStats.rate}%`} icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" color="green" />
        <StatCard label="Tasks Completed" value={`${currentStats.completed}/${currentStats.assigned}`} icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" color="blue" />
        <StatCard label="Volunteer Hours" value={currentStats.approvedHours.toFixed(1)} icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" color="amber" />
        <StatCard label="Overall Score" value={currentStats.latest?.overall_score?.toFixed(0) ?? '—'} icon="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" color="primary" />
      </div>

      {/* Progress bars */}
      <div className="card p-6 mb-6">
        <h2 className="font-display font-semibold text-slate-900 dark:text-white mb-4">Engagement Breakdown</h2>
        <div className="space-y-4">
          <ProgressBar label="Attendance" value={currentStats.rate} max={100} color="bg-green-500" />
          <ProgressBar label="Task Completion" value={currentStats.assigned > 0 ? Math.round((currentStats.completed / currentStats.assigned) * 100) : 0} max={100} color="bg-blue-500" />
          <ProgressBar label="Volunteer Goal (50 hrs)" value={Math.min(currentStats.approvedHours, 50)} max={50} color="bg-amber-500" />
        </div>
      </div>

      {/* Historical metrics */}
      {metrics.length > 0 ? (
        <div className="card p-6">
          <h2 className="font-display font-semibold text-slate-900 dark:text-white mb-4">Performance History</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">Period</th>
                  <th className="text-left px-4 py-2 font-medium">Attendance</th>
                  <th className="text-left px-4 py-2 font-medium">Tasks</th>
                  <th className="text-left px-4 py-2 font-medium">Volunteer</th>
                  <th className="text-left px-4 py-2 font-medium">Events</th>
                  <th className="text-left px-4 py-2 font-medium">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {metrics.map(m => (
                  <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="px-4 py-3 text-slate-900 dark:text-white">{new Date(m.period_start).toLocaleDateString()} - {new Date(m.period_end).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-slate-500">{m.attendance_rate?.toFixed(0)}%</td>
                    <td className="px-4 py-3 text-slate-500">{m.tasks_completed}/{m.tasks_assigned}</td>
                    <td className="px-4 py-3 text-slate-500">{m.volunteer_hours?.toFixed(1)}h</td>
                    <td className="px-4 py-3 text-slate-500">{m.events_attended}</td>
                    <td className="px-4 py-3"><span className="font-bold text-primary-600 dark:text-primary-400">{m.overall_score?.toFixed(0)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState title="No historical data" message="Performance metrics will appear here once recorded by administrators." />
      )}
    </div>
  );
}

function ProgressBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div>
      <div className="flex justify-between mb-1.5">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
        <span className="text-sm text-slate-500">{value.toFixed(0)}{max === 100 ? '%' : ''}</span>
      </div>
      <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
