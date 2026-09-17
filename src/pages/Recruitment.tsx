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
            <div className="glass-card max-w-2xl mx-auto my-16 p-8 sm:p-14 flex flex-col items-center justify-center text-center gap-8 relative overflow-hidden border border-slate-200/80 dark:border-white/10 shadow-2xl animate-fade-in-up">
              {/* Animated background blobs */}
              <div className="absolute -top-20 -left-20 w-72 h-72 bg-primary-500/20 dark:bg-primary-500/10 rounded-full blur-3xl animate-pulse-slow" />
              <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-indigo-500/20 dark:bg-indigo-500/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
              
              <div className="relative z-10">
                <div className="w-28 h-28 sm:w-36 sm:h-36 mx-auto bg-gradient-to-tr from-slate-50 to-white dark:from-slate-800 dark:to-slate-700 rounded-[2.5rem] shadow-xl flex items-center justify-center mb-2 animate-float border border-slate-200/50 dark:border-white/10 rotate-3">
                  <div className="absolute inset-0 bg-gradient-to-tr from-primary-500/10 to-indigo-500/10 rounded-[2.5rem]" />
                  <svg className="w-14 h-14 sm:w-16 sm:h-16 text-primary-500 drop-shadow-md relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                  </svg>
                </div>
              </div>
              
              <div className="space-y-4 relative z-10">
                <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-primary-900 to-slate-900 dark:from-white dark:via-primary-100 dark:to-white animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                  Recruitment is Closed
                </h2>
                <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-lg mx-auto leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                  We are not accepting new applications at this moment. We usually open recruitment drives at the beginning of each semester. 
                  <br className="hidden sm:block" /> Stay tuned!
                </p>
              </div>

              <div className="mt-4 relative z-10 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                <a
                  href="/"
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold hover:scale-105 hover:shadow-xl hover:shadow-slate-900/20 dark:hover:shadow-white/20 transition-all duration-300"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                  </svg>
                  Return to Home
                </a>
              </div>
            </div>
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

