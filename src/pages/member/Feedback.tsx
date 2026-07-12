import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { PageTitle } from '../../components/member/MemberUI';
import { LoadingState, ErrorState, EmptyState } from '../../components/States';
import { getMyFeedback, getUpcomingEvents, getUpcomingMeetings } from '../../lib/memberApi';
import { supabase } from '../../lib/supabase';

export default function Feedback() {
  const { member } = useAuth();
  const [feedback, setFeedback] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ feedback_type: 'general', subject: '', body: '', rating: 5, related_event_id: '', related_meeting_id: '', is_anonymous: false });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!member) return;
    try {
      const [f, e, m] = await Promise.all([getMyFeedback(member.id), getUpcomingEvents(), getUpcomingMeetings()]);
      setFeedback(f); setEvents(e); setMeetings(m);
    } catch { setError(true); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [member]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!member) return;
    setSaving(true);
    try {
      await supabase.from('feedback').insert({
        member_id: member.id,
        feedback_type: form.feedback_type,
        subject: form.subject,
        body: form.body,
        rating: Number(form.rating),
        related_event_id: form.related_event_id || null,
        related_meeting_id: form.related_meeting_id || null,
        is_anonymous: form.is_anonymous,
      });
      setForm({ feedback_type: 'general', subject: '', body: '', rating: 5, related_event_id: '', related_meeting_id: '', is_anonymous: false });
      setShowForm(false);
      await load();
    } catch { setError(true); }
    finally { setSaving(false); }
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message="Failed to load feedback." />;

  return (
    <div>
      <PageTitle title="Feedback" subtitle="Share your thoughts to help us improve" action={
        <button onClick={() => setShowForm(s => !s)} className="btn-primary">{showForm ? 'Cancel' : 'Give Feedback'}</button>
      } />

      {showForm && (
        <form onSubmit={handleSubmit} className="card p-6 mb-6 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Type</label>
              <select value={form.feedback_type} onChange={(e) => setForm({ ...form, feedback_type: e.target.value })} className="input">
                <option value="general">General</option>
                <option value="event">Event</option>
                <option value="meeting">Meeting</option>
                <option value="club">Club</option>
              </select>
            </div>
            <div>
              <label className="label">Rating</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(n => (
                  <button key={n} type="button" onClick={() => setForm({ ...form, rating: n })} className={`text-2xl transition-colors ${n <= form.rating ? 'text-amber-400' : 'text-slate-300 dark:text-slate-600'}`}>★</button>
                ))}
              </div>
            </div>
          </div>
          <div>
            <label className="label">Subject *</label>
            <input type="text" required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="input" placeholder="What is your feedback about?" />
          </div>
          <div>
            <label className="label">Message *</label>
            <textarea rows={4} required value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} className="input resize-none" placeholder="Share your thoughts..." />
          </div>
          {form.feedback_type === 'event' && (
            <div>
              <label className="label">Related Event</label>
              <select value={form.related_event_id} onChange={(e) => setForm({ ...form, related_event_id: e.target.value })} className="input">
                <option value="">None</option>
                {events.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
              </select>
            </div>
          )}
          {form.feedback_type === 'meeting' && (
            <div>
              <label className="label">Related Meeting</label>
              <select value={form.related_meeting_id} onChange={(e) => setForm({ ...form, related_meeting_id: e.target.value })} className="input">
                <option value="">None</option>
                {meetings.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
              </select>
            </div>
          )}
          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
            <input type="checkbox" checked={form.is_anonymous} onChange={(e) => setForm({ ...form, is_anonymous: e.target.checked })} className="rounded border-slate-300 dark:border-slate-700 text-primary-600 focus:ring-primary-500" />
            Submit anonymously
          </label>
          <button type="submit" disabled={saving} className="btn-primary disabled:opacity-60">{saving ? 'Submitting...' : 'Submit Feedback'}</button>
        </form>
      )}

      {feedback.length === 0 ? (
        <EmptyState title="No feedback submitted" message="Your feedback helps us improve the club experience." />
      ) : (
        <div className="space-y-3">
          {feedback.map(f => (
            <div key={f.id} className="card p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-medium text-slate-900 dark:text-white">{f.subject}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{f.body}</p>
                  <div className="flex items-center gap-3 mt-3">
                    <span className="badge bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 capitalize">{f.feedback_type}</span>
                    {f.rating && <div className="flex">{Array.from({ length: 5 }).map((_, i) => <span key={i} className={`text-sm ${i < f.rating ? 'text-amber-400' : 'text-slate-300 dark:text-slate-600'}`}>★</span>)}</div>}
                    <span className="text-xs text-slate-400">{new Date(f.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
