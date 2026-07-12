import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { PageTitle, Badge, StatCard } from '../../components/member/MemberUI';
import { LoadingState, ErrorState, EmptyState } from '../../components/States';
import { getMyVolunteerHours, getUpcomingEvents } from '../../lib/memberApi';
import { supabase } from '../../lib/supabase';

export default function VolunteerHours() {
  const { member } = useAuth();
  const [hours, setHours] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ activity_description: '', hours: '1', activity_date: new Date().toISOString().slice(0, 10), event_id: '' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!member) return;
    try {
      const [h, e] = await Promise.all([getMyVolunteerHours(member.id), getUpcomingEvents()]);
      setHours(h); setEvents(e);
    } catch { setError(true); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [member]);

  const stats = useMemo(() => {
    const approved = hours.filter(h => h.status === 'approved').reduce((s, h) => s + Number(h.hours), 0);
    const pending = hours.filter(h => h.status === 'pending').reduce((s, h) => s + Number(h.hours), 0);
    const total = hours.reduce((s, h) => s + Number(h.hours), 0);
    return { approved, pending, total };
  }, [hours]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!member) return;
    setSaving(true);
    try {
      await supabase.from('volunteer_hours').insert({
        member_id: member.id,
        activity_description: form.activity_description,
        hours: parseFloat(form.hours),
        activity_date: form.activity_date,
        event_id: form.event_id || null,
      });
      setForm({ activity_description: '', hours: '1', activity_date: new Date().toISOString().slice(0, 10), event_id: '' });
      setShowForm(false);
      await load();
    } catch { setError(true); }
    finally { setSaving(false); }
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message="Failed to load volunteer hours." />;

  return (
    <div>
      <PageTitle title="Volunteer Hours" subtitle="Track and log your community service" action={
        <button onClick={() => setShowForm(s => !s)} className="btn-primary">{showForm ? 'Cancel' : 'Log Hours'}</button>
      } />

      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard label="Approved" value={`${stats.approved.toFixed(1)}h`} icon="M5 13l4 4L19 7" color="green" />
        <StatCard label="Pending" value={`${stats.pending.toFixed(1)}h`} icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" color="amber" />
        <StatCard label="Total" value={`${stats.total.toFixed(1)}h`} icon="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2z" color="primary" />
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card p-6 mb-6 space-y-4">
          <div>
            <label className="label">Activity Description *</label>
            <input type="text" required value={form.activity_description} onChange={(e) => setForm({ ...form, activity_description: e.target.value })} className="input" placeholder="Community outreach at local school" />
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="label">Hours *</label>
              <input type="number" step="0.5" min="0.5" required value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })} className="input" />
            </div>
            <div>
              <label className="label">Date *</label>
              <input type="date" required value={form.activity_date} onChange={(e) => setForm({ ...form, activity_date: e.target.value })} className="input" />
            </div>
            <div>
              <label className="label">Related Event</label>
              <select value={form.event_id} onChange={(e) => setForm({ ...form, event_id: e.target.value })} className="input">
                <option value="">None</option>
                {events.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
              </select>
            </div>
          </div>
          <button type="submit" disabled={saving} className="btn-primary disabled:opacity-60">{saving ? 'Saving...' : 'Submit for Approval'}</button>
        </form>
      )}

      {hours.length === 0 ? (
        <EmptyState title="No volunteer hours logged" message="Log your community service hours to track your contributions." />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Activity</th>
                  <th className="text-left px-4 py-3 font-medium">Date</th>
                  <th className="text-left px-4 py-3 font-medium">Hours</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {hours.map(h => (
                  <tr key={h.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="px-4 py-3 text-slate-900 dark:text-white">{h.activity_description}{h.event?.title ? ` (${h.event.title})` : ''}</td>
                    <td className="px-4 py-3 text-slate-500">{new Date(h.activity_date).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-slate-500">{Number(h.hours).toFixed(1)}h</td>
                    <td className="px-4 py-3"><Badge status={h.status} /></td>
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
