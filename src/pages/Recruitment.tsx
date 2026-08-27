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
      setSubmitState({ ok: true, message: 'Application submitted successfully! We will review your application and be in touch soon.' });
      setForm({ applicant_name: '', applicant_email: '', applicant_phone: '', student_id: '', department_preference: '', motivation: '', experience: '' });
      setCvUrl(null);
    } catch {
      setSubmitState({ ok: false, message: 'Failed to submit application. Please check your information and try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingState message="Loading recruitment drives..." />;
  if (error) return <ErrorState message="Failed to load recruitment information." onRetry={() => window.location.reload()} />;

  return (
    <>
      <PageHeader
        title="Recruitment Drive"
        subtitle="Apply to become a student member and build the future of technology on campus."
        breadcrumb="Home / Recruitment"
      />
      <Section className="bg-slate-50/40 dark:bg-slate-950/40">
        <div className="container-page max-w-3xl">
          {recruitments.length === 0 ? (
            <EmptyState title="Recruitment currently closed" message="There are no active recruitment drives right now. Please check back at the start of next semester!" />
          ) : (
            <>
              {/* Open Recruitment Information Cards */}
              <div className="space-y-4 mb-10">
                {recruitments.map(r => (
                  <div key={r.id} className="glass-card p-6 border border-slate-200/80 dark:border-white/10 relative overflow-hidden">
                    <div className="flex items-center justify-between gap-4 mb-2">
                      <h3 className="font-display font-extrabold text-xl text-slate-900 dark:text-white">{r.title}</h3>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Accepting Applications</span>
                      </span>
                    </div>

                    {r.description && <p className="text-sm text-slate-600 dark:text-slate-400 font-normal leading-relaxed">{r.description}</p>}

                    {r.requirements && (
                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Key Requirements:</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-line leading-relaxed font-normal">{r.requirements}</p>
                      </div>
                    )}

                    <div className="mt-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
                      Opened: {new Date(r.open_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      {r.close_at && ` • Closes: ${new Date(r.close_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
                    </div>
                  </div>
                ))}
              </div>

              {/* Application Glass Form */}
              <div className="glass-card p-8 sm:p-12 border border-slate-200/80 dark:border-white/10 shadow-2xl relative">
                <h3 className="font-display font-extrabold text-2xl text-slate-900 dark:text-white mb-6">
                  Member Application Form
                </h3>

                {submitState && (
                  <div
                    className={`p-4 rounded-xl mb-6 text-sm font-medium flex items-center gap-3 ${
                      submitState.ok
                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                        : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/30'
                    }`}
                  >
                    <span>{submitState.ok ? '✅' : '⚠️'}</span>
                    <span>{submitState.message}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="label">Recruitment Drive *</label>
                    <select value={selectedRecruitment} onChange={(e) => setSelectedRecruitment(e.target.value)} className="input text-sm" required>
                      {recruitments.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
                    </select>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label className="label">Full Name *</label>
                      <input type="text" required value={form.applicant_name} onChange={(e) => setForm({ ...form, applicant_name: e.target.value })} className="input text-sm" placeholder="e.g. Alex Johnson" />
                    </div>
                    <div>
                      <label className="label">University Email *</label>
                      <input type="email" required value={form.applicant_email} onChange={(e) => setForm({ ...form, applicant_email: e.target.value })} className="input text-sm" placeholder="alex@university.edu" />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label className="label">Phone Number</label>
                      <input type="tel" value={form.applicant_phone} onChange={(e) => setForm({ ...form, applicant_phone: e.target.value })} className="input text-sm" placeholder="+880 0000000000" />
                    </div>
                    <div>
                      <label className="label">Student ID</label>
                      <input type="text" value={form.student_id} onChange={(e) => setForm({ ...form, student_id: e.target.value })} className="input text-sm" placeholder="232000000" />
                    </div>
                  </div>

                  <div>
                    <label className="label">Department Preference</label>
                    <select value={form.department_preference} onChange={(e) => setForm({ ...form, department_preference: e.target.value })} className="input text-sm">
                      <option value="">Select a preferred department</option>
                      {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="label">Why do you want to join ClubSync? *</label>
                    <textarea required rows={4} value={form.motivation} onChange={(e) => setForm({ ...form, motivation: e.target.value })} className="input text-sm resize-none" placeholder="Tell us what excites you about building projects with ClubSync..." />
                  </div>

                  <div>
                    <label className="label">Relevant Experience & Skills</label>
                    <textarea rows={3} value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })} className="input text-sm resize-none" placeholder="Share any programming languages, design tools, or team leadership experience..." />
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

                  <button type="submit" disabled={submitting} className="btn-primary w-full py-3.5 text-base font-bold shadow-xl disabled:opacity-60 disabled:cursor-not-allowed">
                    {submitting ? 'Submitting Application...' : 'Submit Application'}
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

