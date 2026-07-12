import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { PageTitle } from '../../components/member/MemberUI';
import { LoadingState, ErrorState, EmptyState } from '../../components/States';
import { getMyNotifications, markNotificationRead, markAllNotificationsRead } from '../../lib/memberApi';

export default function Notifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = async () => {
    if (!user) return;
    try { setNotifications(await getMyNotifications(user.id)); }
    catch { setError(true); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [user]);

  const handleMarkRead = async (id: string) => {
    await markNotificationRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const handleMarkAll = async () => {
    if (!user) return;
    await markAllNotificationsRead(user.id);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message="Failed to load notifications." />;

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div>
      <PageTitle title="Notifications" subtitle={`${unreadCount} unread`} action={
        unreadCount > 0 ? <button onClick={handleMarkAll} className="btn-outline">Mark all read</button> : undefined
      } />

      {notifications.length === 0 ? (
        <EmptyState title="No notifications" message="You're all caught up!" />
      ) : (
        <div className="space-y-2">
          {notifications.map(n => (
            <div key={n.id} className={`card p-4 flex items-start gap-3 cursor-pointer transition-colors ${!n.is_read ? 'border-primary-200 dark:border-primary-800 bg-primary-50/30 dark:bg-primary-950/10' : ''}`} onClick={() => !n.is_read && handleMarkRead(n.id)}>
              <div className={`w-2 h-2 rounded-full shrink-0 mt-2 ${!n.is_read ? 'bg-primary-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm ${!n.is_read ? 'font-semibold text-slate-900 dark:text-white' : 'font-medium text-slate-700 dark:text-slate-300'}`}>{n.title}</p>
                  <span className="text-xs text-slate-400 shrink-0">{new Date(n.created_at).toLocaleDateString()}</span>
                </div>
                {n.body && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{n.body}</p>}
                {n.link && <a href={n.link} className="text-xs text-primary-600 dark:text-primary-400 hover:underline mt-1 inline-block">View</a>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
