import { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';
import Section from '../components/Section';
import { LoadingState, ErrorState, EmptyState } from '../components/States';
import FileUpload from '../components/FileUpload';
import { getOpenRecruitments, getDepartments, submitApplication } from '../lib/api';
import type { Recruitment, Department } from '../types';

export default function RecruitmentPage() {
  const [recruitments, setRecruitments] = useState<Recruitment[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [selectedRecruitment, setSelectedRecruitment] = useState('');
  const [form, setForm] = useState({
    applicant_name: '', applicant_email: '', applicant_phone: '',
    student_id: '', department_preference: '', motivation: '', experience: '',
  });
  const [cvUrl, setCvUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitState, setSubmitState] = useState<{ ok: boolean; message: string } | null>(null);

  useEffect(() => {
    Promise.all([getOpenRecruitments(), getDepartments()])
      .then(([r, d]) => { setRecruitments(r); setDepartments(d); if (r.length > 0) setSelectedRecruitment(r[0].id); })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecruitment) return;
    setSubmitting(true);
    setSubmitState(null);
    try {
      await submitApplication({
        recruitment_id: selectedRecruitment,
        applicant_name: form.applicant_name,
        applicant_email: form.applicant_email,
        applicant_phone: form.applicant_phone || null,
        student_id: form.student_id || null,
        department_preference: form.department_preference || null,
        motivation: form.motivation || null,
        experience: form.experience || null,
        cv_url: cvUrl,
      });
      setSubmitState({ ok: true, message: 'Application submitted successfully! We will be in touch soon.' });
      setForm({ applicant_name: '', applicant_email: '', applicant_phone: '', student_id: '', department_preference: '', motivation: '', experience: '' });
      setCvUrl(null);
    } catch {
      setSubmitState({ ok: false, message: 'Failed to submit application. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message="Failed to load recruitment info." />;

  return (
    <>
      <PageHeader title="Join ClubSync" subtitle="Apply to become a member and start your journey with us." breadcrumb="Home / Recruitment" />
      <Section>
        <div className="container-page max-w-3xl">
          {recruitments.length === 0 ? (
            <EmptyState title="No open recruitments" message="Recruitment is currently closed. Check back at the start of next semester!" />
          ) : (
            <>
              {/* Open recruitments */}
              <div className="space-y-4 mb-10">
                {recruitments.map(r => (
                  <div key={r.id} className="card p-6">
                    <h3 className="font-display font-semibold text-lg text-slate-900 dark:text-white">{r.title}</h3>
                    {r.description && <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">{r.description}</p>}
                    {r.requirements && (
                      <div className="mt-3">
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Requirements:</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-line">{r.requirements}</p>
                      </div>
                    )}
                    <p className="text-xs text-slate-500 mt-3">
                      Open: {new Date(r.open_at).toLocaleDateString()} {r.close_at && `• Closes: ${new Date(r.close_at).toLocaleDateString()}`}
                    </p>
                  </div>
                ))}
              </div>

              {/* Application form */}
              <div className="card p-6 sm:p-8">
                <h3 className="font-display font-bold text-xl text-slate-900 dark:text-white mb-6">Application Form</h3>

                {submitState && (
                  <div className={`p-4 rounded-lg mb-6 text-sm ${submitState.ok ? 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'}`}>
                    {submitState.message}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="label">Recruitment Drive *</label>
                    <select value={selectedRecruitment} onChange={(e) => setSelectedRecruitment(e.target.value)} className="input" required>
                      {recruitments.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
                    </select>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label className="label">Full Name *</label>
                      <input type="text" required value={form.applicant_name} onChange={(e) => setForm({ ...form, applicant_name: e.target.value })} className="input" placeholder="Jane Doe" />
                    </div>
                    <div>
                      <label className="label">Email *</label>
                      <input type="email" required value={form.applicant_email} onChange={(e) => setForm({ ...form, applicant_email: e.target.value })} className="input" placeholder="jane@university.edu" />
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label className="label">Phone</label>
                      <input type="tel" value={form.applicant_phone} onChange={(e) => setForm({ ...form, applicant_phone: e.target.value })} className="input" placeholder="+1 555 000 0000" />
                    </div>
                    <div>
                      <label className="label">Student ID</label>
                      <input type="text" value={form.student_id} onChange={(e) => setForm({ ...form, student_id: e.target.value })} className="input" placeholder="STU-2025-0001" />
                    </div>
                  </div>
                  <div>
                    <label className="label">Department Preference</label>
                    <select value={form.department_preference} onChange={(e) => setForm({ ...form, department_preference: e.target.value })} className="input">
                      <option value="">Select a department</option>
                      {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Why do you want to join? *</label>
                    <textarea required rows={4} value={form.motivation} onChange={(e) => setForm({ ...form, motivation: e.target.value })} className="input resize-none" placeholder="Tell us what excites you about ClubSync..." />
                  </div>
                  <div>
                    <label className="label">Relevant Experience</label>
                    <textarea rows={3} value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })} className="input resize-none" placeholder="Share any relevant skills, projects, or experience..." />
                  </div>
                  <FileUpload
                    bucket="documents"
                    folder="applications"
                    value={cvUrl}
                    onChange={setCvUrl}
                    label="CV / Resume (optional)"
                    accept=".pdf,.doc,.docx"
                    imagePreview={false}
                    helpText="PDF or Word document, max 5MB."
                  />
                  <button type="submit" disabled={submitting} className="btn-primary w-full disabled:opacity-60 disabled:cursor-not-allowed">
                    {submitting ? 'Submitting...' : 'Submit Application'}
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </Section>
    </>
  );
}
