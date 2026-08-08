import { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';
import Section from '../components/Section';
import { LoadingState, ErrorState } from '../components/States';
import { getSiteSettings, submitContactMessage } from '../lib/api';
import type { SiteSettings } from '../types';

export default function Contact() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitState, setSubmitState] = useState<{ ok: boolean; message: string } | null>(null);

  useEffect(() => {
    getSiteSettings()
      .then(setSettings)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitState(null);
    try {
      await submitContactMessage(form);
      setSubmitState({ ok: true, message: 'Message sent! Our executive team will get back to you shortly.' });
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch {
      setSubmitState({ ok: false, message: 'Failed to send message. Please check your connection and try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingState message="Loading contact information..." />;
  if (error) return <ErrorState message="Failed to load contact information." onRetry={() => window.location.reload()} />;

  return (
    <>
      <PageHeader
        title="Contact Us"
        subtitle="Have questions about partnerships, events, or membership? We'd love to hear from you."
        breadcrumb="Home / Contact"
      />
      <Section className="bg-slate-50/40 dark:bg-slate-950/40">
        <div className="container-page grid lg:grid-cols-2 gap-10 lg:gap-12">
          {/* Contact Details Column */}
          <div className="space-y-8">
            <div>
              <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400 mb-2 px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/20">
                GET IN TOUCH
              </span>
              <h2 className="text-3xl font-display font-extrabold text-slate-900 dark:text-white tracking-tight">
                Let's Build Something Together
              </h2>
              <p className="text-slate-600 dark:text-slate-400 mt-2 leading-relaxed font-normal">
                Reach out to our team directly or send us a message using the contact form.
              </p>
            </div>

            <div className="space-y-6">
              {settings?.contact_email && (
                <div className="glass-card p-6 border border-slate-200/70 dark:border-white/10 flex items-start gap-4 hover:shadow-lg transition-all duration-300">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-primary-600 to-indigo-600 text-white grid place-items-center shrink-0 shadow-md shadow-primary-500/20">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Email Address</p>
                    <a href={`mailto:${settings.contact_email}`} className="text-base font-semibold text-slate-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                      {settings.contact_email}
                    </a>
                  </div>
                </div>
              )}

              {settings?.contact_phone && (
                <div className="glass-card p-6 border border-slate-200/70 dark:border-white/10 flex items-start gap-4 hover:shadow-lg transition-all duration-300">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white grid place-items-center shrink-0 shadow-md shadow-indigo-500/20">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-2.826-1.47-5.114-3.758-6.584-6.584l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Phone Support</p>
                    <a href={`tel:${settings.contact_phone}`} className="text-base font-semibold text-slate-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                      {settings.contact_phone}
                    </a>
                  </div>
                </div>
              )}

              {settings?.address && (
                <div className="glass-card p-6 border border-slate-200/70 dark:border-white/10 flex items-start gap-4 hover:shadow-lg transition-all duration-300">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-violet-600 to-purple-600 text-white grid place-items-center shrink-0 shadow-md shadow-violet-500/20">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Campus Location</p>
                    <p className="text-base font-semibold text-slate-900 dark:text-white leading-snug">
                      {settings.address}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Contact Glass Form Column */}
          <div className="glass-card p-8 sm:p-10 border border-slate-200/80 dark:border-white/10 shadow-2xl relative">
            <h3 className="font-display font-extrabold text-2xl text-slate-900 dark:text-white mb-6">
              Send Us a Message
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

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="label">Full Name *</label>
                <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input text-sm" placeholder="Your name" />
              </div>

              <div>
                <label className="label">Email Address *</label>
                <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input text-sm" placeholder="you@example.com" />
              </div>

              <div>
                <label className="label">Subject *</label>
                <input type="text" required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="input text-sm" placeholder="e.g. Sponsorship inquiry, Event question..." />
              </div>

              <div>
                <label className="label">Message *</label>
                <textarea required rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="input text-sm resize-none" placeholder="Write your message here..." />
              </div>

              <button type="submit" disabled={submitting} className="btn-primary w-full py-3.5 text-base font-bold shadow-xl disabled:opacity-60 disabled:cursor-not-allowed">
                {submitting ? 'Sending Message...' : 'Send Message'}
              </button>
            </form>
          </div>
        </div>
      </Section>
    </>
  );
}

