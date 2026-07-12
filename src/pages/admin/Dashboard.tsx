import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDashboardStats, getAllTasks, getApplications, getContactMessages, getEvents } from '../../lib/adminApi';
import { PageTitle, StatCard, Badge, Table, TableRow, TableCell, formatDate } from '../../components/admin/AdminUI';
import { LoadingState, ErrorState } from '../../components/States';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [s, t, a, m, e] = await Promise.all([
          getDashboardStats(),
          getAllTasks(),
          getApplications(),
          getContactMessages(),
          getEvents(),
        ]);
        setStats(s);
        setTasks(t.slice(0, 5));
        setApplications(a.filter(x => x.status === 'submitted').slice(0, 5));
        setMessages(m.filter(x => !x.is_read).slice(0, 5));
        setEvents(e.filter(x => new Date(x.start_at) >= new Date()).slice(0, 5));
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <LoadingState message="Loading dashboard..." />;
  if (error) return <ErrorState message={error} />;

  return (
    <div>
      <PageTitle title="Dashboard" subtitle="Overview of your club's operations" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Active Members" value={stats?.activeMembers ?? 0} icon="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" color="primary" />
        <StatCard label="Upcoming Events" value={stats?.totalEvents ?? 0} icon="M15 5v2m0 10v2M9 5v2m0 10v2M5 9h2m10 0h2M5 15h2m10 0h2M7 7h10a2 2 0 012 2v6a2 2 0 01-2 2H7a2 2 0 01-2-2V9a2 2 0 012-2z" color="blue" />
        <StatCard label="Pending Tasks" value={stats?.pendingTasks ?? 0} icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" color="amber" />
        <StatCard label="New Applications" value={stats?.pendingApplications ?? 0} icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" color="green" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        <StatCard label="Budget Balance" value={`$${(stats?.totalBudget ?? 0).toFixed(2)}`} icon="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" color="green" />
        <StatCard label="Inventory Items" value={stats?.totalInventory ?? 0} icon="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" color="blue" />
        <StatCard label="Unread Messages" value={stats?.unreadContacts ?? 0} icon="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" color="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Tasks */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-display font-bold text-slate-900 dark:text-white">Recent Tasks</h2>
            <Link to="/admin/tasks" className="text-sm text-primary-600 hover:text-primary-700">View all</Link>
          </div>
          <Table headers={['Task', 'Assignee', 'Status', 'Due']}>
            {tasks.length === 0 ? (
              <TableRow><TableCell className="text-center py-8 text-slate-400">No tasks yet</TableCell></TableRow>
            ) : tasks.map(t => (
              <TableRow key={t.id}>
                <TableCell className="font-medium">{t.title}</TableCell>
                <TableCell>{t.assignee?.full_name ?? '—'}</TableCell>
                <TableCell><Badge status={t.status} /></TableCell>
                <TableCell>{formatDate(t.due_at)}</TableCell>
              </TableRow>
            ))}
          </Table>
        </div>

        {/* Pending Applications */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-display font-bold text-slate-900 dark:text-white">Pending Applications</h2>
            <Link to="/admin/recruitment" className="text-sm text-primary-600 hover:text-primary-700">View all</Link>
          </div>
          <Table headers={['Applicant', 'Position', 'Date']}>
            {applications.length === 0 ? (
              <TableRow><TableCell className="text-center py-8 text-slate-400">No pending applications</TableCell></TableRow>
            ) : applications.map(a => (
              <TableRow key={a.id}>
                <TableCell className="font-medium">{a.applicant_name}</TableCell>
                <TableCell>{a.recruitment?.title ?? '—'}</TableCell>
                <TableCell>{formatDate(a.created_at)}</TableCell>
              </TableRow>
            ))}
          </Table>
        </div>

        {/* Upcoming Events */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-display font-bold text-slate-900 dark:text-white">Upcoming Events</h2>
            <Link to="/admin/events" className="text-sm text-primary-600 hover:text-primary-700">View all</Link>
          </div>
          <Table headers={['Event', 'Date', 'Status']}>
            {events.length === 0 ? (
              <TableRow><TableCell className="text-center py-8 text-slate-400">No upcoming events</TableCell></TableRow>
            ) : events.map(e => (
              <TableRow key={e.id}>
                <TableCell className="font-medium">{e.title}</TableCell>
                <TableCell>{formatDate(e.start_at)}</TableCell>
                <TableCell><Badge status={e.status} /></TableCell>
              </TableRow>
            ))}
          </Table>
        </div>

        {/* Unread Messages */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-display font-bold text-slate-900 dark:text-white">Unread Contact Messages</h2>
            <Link to="/admin/cms" className="text-sm text-primary-600 hover:text-primary-700">View all</Link>
          </div>
          <Table headers={['Name', 'Subject', 'Date']}>
            {messages.length === 0 ? (
              <TableRow><TableCell className="text-center py-8 text-slate-400">No unread messages</TableCell></TableRow>
            ) : messages.map(m => (
              <TableRow key={m.id}>
                <TableCell className="font-medium">{m.name}</TableCell>
                <TableCell>{m.subject}</TableCell>
                <TableCell>{formatDate(m.created_at)}</TableCell>
              </TableRow>
            ))}
          </Table>
        </div>
      </div>
    </div>
  );
}
