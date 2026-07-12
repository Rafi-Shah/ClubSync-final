import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { PageTitle, Badge } from '../../components/member/MemberUI';
import { LoadingState, ErrorState, EmptyState } from '../../components/States';
import { getMyIdeas } from '../../lib/memberApi';
import { supabase } from '../../lib/supabase';

export default function IdeaSubmission() {
  const { member } = useAuth();
  const [ideas, setIdeas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', category: 'general' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!member) return;
    try { setIdeas(await getMyIdeas(member.id)); }
    catch { setError(true); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [member]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!member) return;
    setSaving(true);
    try {
      await supabase.from('ideas').insert({
        member_id: member.id,
        title: form.title,
        description: form.description,
        category: form.category,
      });
      setForm({ title: '', description: '', category: 'general' });
      setShowForm(false);
      await load();
    } catch { setError(true); }
    finally { setSaving(false); }
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message="Failed to load ideas." />;

  return (
    <div>
      <PageTitle title="Idea Submission" subtitle="Share your ideas to improve the club" action={
        <button onClick={() => setShowForm(s => !s)} className="btn-primary">{showForm ? 'Cancel' : 'Submit Idea'}</button>
      } />

      {showForm && (
        <form onSubmit={handleSubmit} className="card p-6 mb-6 space-y-4">
          <div>
            <label className="label">Title *</label>
            <input type="text" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input" placeholder="Monthly project showcase" />
          </div>
          <div>
            <label className="label">Category</label>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input">
              <option value="general">General</option>
              <option value="event">Event</option>
              <option value="process">Process</option>
              <option value="technology">Technology</option>
              <option value="community">Community</option>
            </select>
          </div>
          <div>
            <label className="label">Description *</label>
            <textarea rows={4} required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input resize-none" placeholder="Describe your idea in detail..." />
          </div>
          <button type="submit" disabled={saving} className="btn-primary disabled:opacity-60">{saving ? 'Submitting...' : 'Submit Idea'}</button>
        </form>
      )}

      {ideas.length === 0 ? (
        <EmptyState title="No ideas submitted" message="Share your ideas to help improve the club!" />
      ) : (
        <div className="space-y-3">
          {ideas.map(idea => (
            <div key={idea.id} className="card p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-medium text-slate-900 dark:text-white">{idea.title}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{idea.description}</p>
                  <div className="flex items-center gap-3 mt-3">
                    <span className="badge bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 capitalize">{idea.category}</span>
                    <span className="text-xs text-slate-400">{new Date(idea.created_at).toLocaleDateString()}</span>
                  </div>
                  {idea.admin_notes && (
                    <div className="mt-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border-l-2 border-primary-400">
                      <p className="text-xs font-medium text-slate-500 mb-1">Admin Response:</p>
                      <p className="text-sm text-slate-700 dark:text-slate-300">{idea.admin_notes}</p>
                    </div>
                  )}
                </div>
                <Badge status={idea.status} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
