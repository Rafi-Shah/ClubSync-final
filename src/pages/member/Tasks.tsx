import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { PageTitle, Badge } from '../../components/member/MemberUI';
import { LoadingState, ErrorState, EmptyState } from '../../components/States';
import { getMyTasks } from '../../lib/memberApi';
import { supabase } from '../../lib/supabase';

export default function Tasks() {
  const { member } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState('all');
  const [updateError, setUpdateError] = useState<string | null>(null);

  useEffect(() => {
    if (!member) return;
    getMyTasks(member.id).then(setTasks).catch(() => setError(true)).finally(() => setLoading(false));
  }, [member]);

  const filtered = useMemo(() => {
    if (filter === 'all') return tasks;
    return tasks.filter(t => t.status === filter);
  }, [tasks, filter]);

  const updateStatus = async (id: string, status: string) => {
    setUpdateError(null);
    const updates: any = { status };
    if (status === 'completed') updates.completed_at = new Date().toISOString();
    // supabase-js does NOT throw on a failed update — it returns { error }
    // instead. Without checking it, the local state below was updated
    // optimistically regardless of whether the write actually succeeded,
    // so the UI could show "Completed" while the DB still had "Pending".
    const { error: updateErr } = await supabase.from('tasks').update(updates).eq('id', id);
    if (updateErr) {
      setUpdateError('Failed to update task status. Please try again.');
      return;
    }
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const filters = ['all', 'pending', 'in_progress', 'review', 'completed'];

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message="Failed to load tasks." />;

  return (
    <div>
      <PageTitle title="My Tasks" subtitle="Tasks assigned to you" />

      {updateError && (
        <p className="text-sm text-red-600 dark:text-red-400 mb-4">{updateError}</p>
      )}

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {filters.map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors whitespace-nowrap ${filter === f ? 'bg-primary-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>
            {f.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No tasks" message="You have no tasks in this category." />
      ) : (
        <div className="space-y-3">
          {filtered.map(t => (
            <div key={t.id} className="card p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-slate-900 dark:text-white">{t.title}</h3>
                  {t.description && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t.description}</p>}
                  <div className="flex flex-wrap items-center gap-3 mt-3">
                    <Badge status={t.status} />
                    <span className={`badge ${t.priority === 'urgent' ? 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300' : t.priority === 'high' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>{t.priority}</span>
                    {t.due_at && <span className="text-xs text-slate-500">Due: {new Date(t.due_at).toLocaleDateString()}</span>}
                  </div>
                </div>
                <div className="shrink-0">
                  <select
                    value={t.status}
                    onChange={(e) => updateStatus(t.id, e.target.value)}
                    className="text-sm px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="review">Review</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}