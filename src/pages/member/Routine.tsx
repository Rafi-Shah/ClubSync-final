import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { PageTitle } from '../../components/member/MemberUI';
import { LoadingState, ErrorState, EmptyState } from '../../components/States';
import { getMyRoutines } from '../../lib/memberApi';
import { supabase } from '../../lib/supabase';

const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function Routine() {
  const { member } = useAuth();
  const [routines, setRoutines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', day_of_week: 1, start_time: '09:00', end_time: '10:00', location: '' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!member) return;
    try {
      const data = await getMyRoutines(member.id);
      setRoutines(data);
    } catch { setError(true); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [member]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!member) return;
    setSaving(true);
    try {
      await supabase.from('routines').insert({
        member_id: member.id,
        title: form.title,
        description: form.description || null,
        day_of_week: form.day_of_week,
        start_time: form.start_time,
        end_time: form.end_time,
        location: form.location || null,
      });
      setForm({ title: '', description: '', day_of_week: 1, start_time: '09:00', end_time: '10:00', location: '' });
      setShowForm(false);
      await load();
    } catch { setError(true); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    await supabase.from('routines').delete().eq('id', id);
    await load();
  };

  const handleToggle = async (id: string, active: boolean) => {
    await supabase.from('routines').update({ is_active: !active }).eq('id', id);
    await load();
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message="Failed to load routine." />;

  return (
    <div>
      <PageTitle title="My Routine" subtitle="Your weekly schedule" action={
        <button onClick={() => setShowForm(s => !s)} className="btn-primary">{showForm ? 'Cancel' : 'Add Entry'}</button>
      } />

      {showForm && (
        <form onSubmit={handleAdd} className="card p-6 mb-6 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Title *</label>
              <input type="text" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input" placeholder="Team meeting" />
            </div>
            <div>
              <label className="label">Day *</label>
              <select value={form.day_of_week} onChange={(e) => setForm({ ...form, day_of_week: Number(e.target.value) })} className="input">
                {days.map((d, i) => <option key={i} value={i}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Start Time *</label>
              <input type="time" required value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} className="input" />
            </div>
            <div>
              <label className="label">End Time *</label>
              <input type="time" required value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} className="input" />
            </div>
            <div>
              <label className="label">Location</label>
              <input type="text" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="input" placeholder="Room 204" />
            </div>
            <div>
              <label className="label">Description</label>
              <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input" placeholder="Weekly sync" />
            </div>
          </div>
          <button type="submit" disabled={saving} className="btn-primary disabled:opacity-60">{saving ? 'Saving...' : 'Save Entry'}</button>
        </form>
      )}

      {routines.length === 0 ? (
        <EmptyState title="No routine entries" message="Add your weekly schedule entries to keep track of your commitments." />
      ) : (
        <div className="space-y-6">
          {days.map((day, dayIdx) => {
            const dayRoutines = routines.filter(r => r.day_of_week === dayIdx);
            if (dayRoutines.length === 0) return null;
            return (
              <div key={dayIdx}>
                <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">{day}</h3>
                <div className="space-y-2">
                  {dayRoutines.map(r => (
                    <div key={r.id} className={`card p-4 flex items-center gap-4 ${!r.is_active ? 'opacity-50' : ''}`}>
                      <div className="text-center shrink-0 w-20">
                        <p className="text-sm font-medium text-primary-600 dark:text-primary-400">{r.start_time?.slice(0, 5)}</p>
                        <p className="text-xs text-slate-400">{r.end_time?.slice(0, 5)}</p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-white">{r.title}</p>
                        {r.location && <p className="text-xs text-slate-500">{r.location}</p>}
                        {r.description && <p className="text-xs text-slate-400 mt-0.5">{r.description}</p>}
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button onClick={() => handleToggle(r.id, r.is_active)} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800" title={r.is_active ? 'Deactivate' : 'Activate'}>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d={r.is_active ? 'M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l7.07 7.07M21 21l-7.07-7.07' : 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'} /></svg>
                        </button>
                        <button onClick={() => handleDelete(r.id)} className="p-2 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30" title="Delete">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
