import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { PageTitle, Badge } from '../../components/member/MemberUI';
import FileUpload from '../../components/FileUpload';
import { updateProfile } from '../../lib/memberApi';

export default function MyProfile() {
  const { member, roles, refreshMember } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    full_name: member?.full_name ?? '',
    phone: member?.phone ?? '',
    bio: member?.bio ?? '',
    avatar_url: member?.avatar_url ?? '',
    student_id: member?.student_id ?? '',
    batch: member?.batch ?? '',
    facebook: member?.facebook ?? '',
    github: member?.github ?? '',
    linkedin: member?.linkedin ?? '',
    gmail: member?.gmail ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!member) return;
    setSaving(true);
    setMsg(null);
    try {
      await updateProfile(member.id, {
        full_name: form.full_name,
        phone: form.phone || null,
        bio: form.bio || null,
        avatar_url: form.avatar_url || null,
        student_id: form.student_id || null,
        batch: form.batch || null,
        facebook: form.facebook || null,
        github: form.github || null,
        linkedin: form.linkedin || null,
        gmail: form.gmail || null,
      });
      await refreshMember();
      setMsg({ ok: true, text: 'Profile updated successfully.' });
      setEditing(false);
    } catch {
      setMsg({ ok: false, text: 'Failed to update profile.' });
    } finally {
      setSaving(false);
    }
  };

  if (!member) return null;
  const initials = member.full_name.charAt(0).toUpperCase();

  return (
    <div>
      <PageTitle title="My Profile" subtitle="View and update your member profile" action={
        !editing ? <button onClick={() => setEditing(true)} className="btn-primary">Edit Profile</button> : undefined
      } />

      {msg && (
        <div className={`p-3 rounded-lg mb-4 text-sm ${msg.ok ? 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300' : 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300'}`}>
          {msg.text}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Profile card */}
        <div className="card p-6 text-center">
          <div className="w-24 h-24 rounded-full mx-auto mb-4 bg-primary-600 text-white grid place-items-center text-3xl font-bold overflow-hidden">
            {member.avatar_url ? <img src={member.avatar_url} alt={member.full_name} className="w-full h-full object-cover" /> : initials}
          </div>
          <h2 className="font-display font-bold text-lg text-slate-900 dark:text-white">{member.full_name}</h2>
          <p className="text-sm text-slate-500">{member.email}</p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {roles.map(r => <span key={r.slug} className="badge bg-primary-100 text-primary-700 dark:bg-primary-950/50 dark:text-primary-300">{r.name}</span>)}
          </div>
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2 text-sm text-left">
            <div className="flex justify-between"><span className="text-slate-500">Member Code</span><span className="font-medium text-slate-900 dark:text-white">{member.member_code}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Status</span><Badge status={member.status} /></div>
            <div className="flex justify-between"><span className="text-slate-500">Joined</span><span className="font-medium text-slate-900 dark:text-white">{member.joined_at ? new Date(member.joined_at).toLocaleDateString() : 'N/A'}</span></div>
          </div>
        </div>

        {/* Details / Edit form */}
        <div className="lg:col-span-2 card p-6">
          {editing ? (
            <form onSubmit={handleSave} className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="label">Full Name</label>
                  <input type="text" required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="input" />
                </div>
                <div>
                  <label className="label">Phone</label>
                  <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input" />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="label">Student ID</label>
                  <input type="text" value={form.student_id} onChange={(e) => setForm({ ...form, student_id: e.target.value })} className="input" placeholder="e.g. 21-XXXXX-1" />
                </div>
                <div>
                  <label className="label">Batch</label>
                  <input type="text" value={form.batch} onChange={(e) => setForm({ ...form, batch: e.target.value })} className="input" placeholder="e.g. 21-1" />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="label">Facebook Profile URL</label>
                  <input type="url" value={form.facebook} onChange={(e) => setForm({ ...form, facebook: e.target.value })} className="input" placeholder="https://facebook.com/..." />
                </div>
                <div>
                  <label className="label">LinkedIn Profile URL</label>
                  <input type="url" value={form.linkedin} onChange={(e) => setForm({ ...form, linkedin: e.target.value })} className="input" placeholder="https://linkedin.com/in/..." />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="label">GitHub Profile URL</label>
                  <input type="url" value={form.github} onChange={(e) => setForm({ ...form, github: e.target.value })} className="input" placeholder="https://github.com/..." />
                </div>
                <div>
                  <label className="label">Contact Gmail</label>
                  <input type="email" value={form.gmail} onChange={(e) => setForm({ ...form, gmail: e.target.value })} className="input" placeholder="example@gmail.com" />
                </div>
              </div>

              <div>
                <FileUpload
                  bucket="avatars"
                  folder={member.user_id}
                  value={form.avatar_url || null}
                  onChange={(url) => setForm({ ...form, avatar_url: url })}
                  label="Profile Photo"
                  accept="image/*"
                  helpText="JPG or PNG, max 3MB."
                />
              </div>
              <div>
                <label className="label">Bio</label>
                <textarea rows={4} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} className="input resize-none" placeholder="Tell us about yourself..." />
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={saving} className="btn-primary disabled:opacity-60">{saving ? 'Saving...' : 'Save Changes'}</button>
                <button type="button" onClick={() => setEditing(false)} className="btn-outline">Cancel</button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Phone</p>
                  <p className="text-slate-900 dark:text-white font-medium">{member.phone || 'Not set'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Student ID</p>
                  <p className="text-slate-900 dark:text-white font-medium">{member.student_id || 'Not set'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Batch</p>
                  <p className="text-slate-900 dark:text-white font-medium">{member.batch || 'Not set'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Facebook</p>
                  <p className="text-slate-900 dark:text-white font-medium truncate">{member.facebook || 'Not set'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">LinkedIn</p>
                  <p className="text-slate-900 dark:text-white font-medium truncate">{member.linkedin || 'Not set'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">GitHub</p>
                  <p className="text-slate-900 dark:text-white font-medium truncate">{member.github || 'Not set'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Gmail</p>
                  <p className="text-slate-900 dark:text-white font-medium truncate">{member.gmail || 'Not set'}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Bio</p>
                <p className="text-slate-900 dark:text-white whitespace-pre-line leading-relaxed">{member.bio || 'No bio added yet.'}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
