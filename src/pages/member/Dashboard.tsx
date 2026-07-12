import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { PageTitle, StatCard, Badge } from '../../components/member/MemberUI';
import { LoadingState, ErrorState } from '../../components/States';
import { getMyTasks, getMyAttendance, getUpcomingEvents, getUpcomingMeetings, getMyNotifications, getMyVolunteerHours } from '../../lib/memberApi';

export default function MemberDashboard() {
  const { member, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [tasks, setTasks] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [volunteerHours, setVolunteerHours] = useState<any[]>([]);

  useEffect(() => {
    if (!member) return;
    Promise.all([
      getMyTasks(member.id),
      getMyAttendance(member.id),
      getUpcomingEvents(),
      getUpcomingMeetings(),
      getMyNotifications(user!.id),
      getMyVolunteerHours(member.id),
    ])
      .then(([t, a, e, m, n, v]) => {
        setTasks(t); setAttendance(a); setEvents(e); setMeetings(m); setNotifications(n); setVolunteerHours(v);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [member, user]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message="Failed to load dashboard." />;

  const pendingTasks = tasks.filter(t => t.status === 'pending' || t.status === 'in_progress');
  const presentCount = attendance.filter(a => a.status === 'present').length;
  const approvedHours = volunteerHours.filter(v => v.status === 'approved').reduce((sum, v) => sum + Number(v.hours), 0);
  const unreadNotifs = notifications.filter(n => !n.is_read).length;

  return (
    <div>
      <PageTitle title="Dashboard" subtitle={`Welcome back, ${member?.full_name ?? 'Member'}!`} />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Pending Tasks" value={pendingTasks.length} icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" color="amber" />
        <StatCard label="Attendance" value={`${presentCount}/${attendance.length}`} icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" color="green" />
        <StatCard label="Volunteer Hours" value={approvedHours.toFixed(1)} icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" color="blue" />
        <StatCard label="Unread" value={unreadNotifs} icon="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5" color="primary" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Upcoming events */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-slate-900 dark:text-white">Upcoming Events</h2>
            <Link to="/portal/events" className="text-sm text-primary-600 dark:text-primary-400 hover:underline">View all</Link>
          </div>
          {events.length > 0 ? (
            <div className="space-y-3">
              {events.slice(0, 4).map(e => (
                <div key={e.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="w-12 h-12 rounded-lg bg-primary-100 dark:bg-primary-950/50 grid place-items-center text-center shrink-0">
                    <p className="text-xs font-bold text-primary-600 dark:text-primary-400">{new Date(e.start_at).toLocaleDateString('en-US', { month: 'short' })}</p>
                    <p className="text-sm font-bold text-primary-700 dark:text-primary-300 leading-none">{new Date(e.start_at).getDate()}</p>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{e.title}</p>
                    <p className="text-xs text-slate-500 truncate">{e.location ?? 'TBD'}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-slate-500 py-4 text-center">No upcoming events</p>}
        </div>

        {/* My tasks */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-slate-900 dark:text-white">My Tasks</h2>
            <Link to="/portal/tasks" className="text-sm text-primary-600 dark:text-primary-400 hover:underline">View all</Link>
          </div>
          {pendingTasks.length > 0 ? (
            <div className="space-y-3">
              {pendingTasks.slice(0, 5).map(t => (
                <div key={t.id} className="flex items-center justify-between gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{t.title}</p>
                    {t.due_at && <p className="text-xs text-slate-500">Due {new Date(t.due_at).toLocaleDateString()}</p>}
                  </div>
                  <Badge status={t.status} />
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-slate-500 py-4 text-center">No pending tasks</p>}
        </div>

        {/* Upcoming meetings */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-slate-900 dark:text-white">Upcoming Meetings</h2>
            <Link to="/portal/meetings" className="text-sm text-primary-600 dark:text-primary-400 hover:underline">View all</Link>
          </div>
          {meetings.length > 0 ? (
            <div className="space-y-3">
              {meetings.slice(0, 4).map(m => (
                <div key={m.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="w-2 h-2 rounded-full bg-primary-500 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{m.title}</p>
                    <p className="text-xs text-slate-500">{new Date(m.start_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                  </div>
                  <span className="text-xs text-slate-400 capitalize">{m.meeting_type}</span>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-slate-500 py-4 text-center">No upcoming meetings</p>}
        </div>

        {/* Recent notifications */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-slate-900 dark:text-white">Recent Notifications</h2>
            <Link to="/portal/notifications" className="text-sm text-primary-600 dark:text-primary-400 hover:underline">View all</Link>
          </div>
          {notifications.length > 0 ? (
            <div className="space-y-3">
              {notifications.slice(0, 5).map(n => (
                <div key={n.id} className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${!n.is_read ? 'bg-primary-50/50 dark:bg-primary-950/20' : ''}`}>
                  <div className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${!n.is_read ? 'bg-primary-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{n.title}</p>
                    {n.body && <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.body}</p>}
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-slate-500 py-4 text-center">No notifications</p>}
        </div>
      </div>
    </div>
  );
}
