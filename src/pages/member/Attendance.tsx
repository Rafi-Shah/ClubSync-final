import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { PageTitle, Badge, StatCard } from '../../components/member/MemberUI';
import { LoadingState, ErrorState, EmptyState } from '../../components/States';
import { getMyAttendance } from '../../lib/memberApi';

export default function Attendance() {
  const { member } = useAuth();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!member) return;
    getMyAttendance(member.id).then(setRecords).catch(() => setError(true)).finally(() => setLoading(false));
  }, [member]);

  const stats = useMemo(() => {
    const present = records.filter(r => r.status === 'present').length;
    const late = records.filter(r => r.status === 'late').length;
    const absent = records.filter(r => r.status === 'absent').length;
    const excused = records.filter(r => r.status === 'excused').length;
    const rate = records.length > 0 ? Math.round(((present + late) / records.length) * 100) : 0;
    return { present, late, absent, excused, rate, total: records.length };
  }, [records]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message="Failed to load attendance." />;

  return (
    <div>
      <PageTitle title="My Attendance" subtitle="Your attendance record for events and meetings" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Attendance Rate" value={`${stats.rate}%`} icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" color="green" />
        <StatCard label="Present" value={stats.present} icon="M5 13l4 4L19 7" color="green" />
        <StatCard label="Late" value={stats.late} icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" color="amber" />
        <StatCard label="Absent" value={stats.absent} icon="M6 18L18 6M6 6l12 12" color="red" />
      </div>

      {records.length === 0 ? (
        <EmptyState title="No attendance records" message="Your attendance will appear here once recorded." />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Activity</th>
                  <th className="text-left px-4 py-3 font-medium">Type</th>
                  <th className="text-left px-4 py-3 font-medium">Date</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {records.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="px-4 py-3 text-slate-900 dark:text-white">{r.event?.title ?? r.meeting?.title ?? 'Unknown'}</td>
                    <td className="px-4 py-3 text-slate-500 capitalize">{r.event_id ? 'Event' : 'Meeting'}</td>
                    <td className="px-4 py-3 text-slate-500">{new Date(r.recorded_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3"><Badge status={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
