import { useEffect, useState, useRef } from 'react';
import PageHeader from '../components/PageHeader';
import Section from '../components/Section';
import { LoadingState, ErrorState } from '../components/States';
import { getSiteSettings, submitContactMessage } from '../lib/api';
import type { SiteSettings } from '../types';

const developers = [
  {
    name: 'Rafi Shah',
    role: 'Lead Developer',
    photo: 'docs/screenshots/IMG_6161.JPG',
    facebook: 'https://www.facebook.com/rafi.shah168',
    github: 'https://github.com/Rafi-Shah',
    gmail: 'mailto:rafishah7774440@gmail.com',
    linkedin: 'https://www.linkedin.com/in/rafi-shah-95683a389'
  },
  {
    name: 'Meherin Afrin Muna',
    role: 'Frontend Designer',
    photo: 'docs/screenshots/1000097000.jpg',
    facebook: 'https://www.facebook.com/meherin.muna.2910',
    github: 'https://github.com/Meherin-Afrin-Muna',
    gmail: 'mailto:meherinmuna29@gmail.com',
    linkedin: 'https://www.linkedin.com/in/meherin-afrin-muna-79167a371'
  },
  {
    name: 'Akhi Akter',
    role: 'Data Entry',
    photo: 'docs/screenshots/akhi.jpeg',
    facebook: 'https://www.facebook.com/aakhiakter0725',
    github: 'https://github.com/Akhi2425473',
    gmail: 'mailto:akhi199909@gmail.com',
    linkedin: 'https://www.linkedin.com/in/akhi-akter-8812743b2/'
  }
];

export default function Contact() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeTab, setActiveTab] = useState<'contact' | 'devs'>('contact');

  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitState, setSubmitState] = useState<{ ok: boolean; message: string } | null>(null);

  const vantaRef = useRef<HTMLDivElement>(null);
  const vantaEffectRef = useRef<any>(null);
  const observerRef = useRef<MutationObserver | null>(null);

  useEffect(() => {
    getSiteSettings()
      .then(setSettings)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  // Component Mount/Unmount cleanup only
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      if (vantaEffectRef.current) {
        try {
          vantaEffectRef.current.destroy();
        } catch(e) {}
      }
    };
  }, []);

  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    if (isMobile) return;
    
    // Dynamically load scripts for Vanta to avoid Vite bundling/CommonJS issues
    const loadScript = (src: string) => {
      return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
          resolve(true);
          return;
        }
        const script = document.createElement('script');
        script.src = src;
        script.crossOrigin = 'anonymous';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    };

    const initVanta = async () => {
      if (vantaEffectRef.current) return;

      try {
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js');
        await loadScript('https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.birds.min.js');
        
        if (vantaRef.current && (window as any).VANTA && (window as any).VANTA.BIRDS && !vantaEffectRef.current) {
          const isDark = document.documentElement.classList.contains('dark');
          
          vantaEffectRef.current = (window as any).VANTA.BIRDS({
            el: vantaRef.current,
            mouseControls: true,
            touchControls: true,
            gyroControls: false,
            minHeight: 200.00,
            minWidth: 200.00,
            scale: 1.00,
            scaleMobile: 1.00,
            backgroundColor: isDark ? 0x0f172a : 0xf8fafc, // slate-900 / slate-50
            color1: isDark ? 0x4f46e5 : 0x818cf8, // indigo-600 / indigo-400
            color2: isDark ? 0x8b5cf6 : 0xa78bfa, // violet-500 / violet-400
            colorMode: "variance",
            birdSize: 1.30,
            wingSpan: 24.00,
            speedLimit: 4.00,
            separation: 40.00,
            alignment: 30.00,
            cohesion: 30.00,
            quantity: 3.0 // Elegantly lower quantity
          });

          // Listen for theme changes to dynamically update Vanta colors
          observerRef.current = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
              if (mutation.attributeName === 'class' && vantaEffectRef.current) {
                const currentIsDark = document.documentElement.classList.contains('dark');
                vantaEffectRef.current.setOptions({
                  backgroundColor: currentIsDark ? 0x0f172a : 0xf8fafc,
                  color1: currentIsDark ? 0x4f46e5 : 0x818cf8,
                  color2: currentIsDark ? 0x8b5cf6 : 0xa78bfa,
                });
              }
            });
          });

          observerRef.current.observe(document.documentElement, { attributes: true });
        }
      } catch (err) {
        console.error("Vanta load error:", err);
      }
    };

    if (activeTab === 'devs') {
      if (!vantaEffectRef.current) {
        initVanta();
      } else {
        // Trigger resize safely so it recalculates dimensions when it becomes visible again
        setTimeout(() => {
          try {
            if (vantaEffectRef.current && vantaEffectRef.current.resize) {
              vantaEffectRef.current.resize();
            }
          } catch(e) {}
        }, 50);
      }
    }
  }, [activeTab]);

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
        <div className="container-page">
          
          {/* Tab Navigation */}
          <div className="flex justify-center mb-12">
            <div className="inline-flex p-1 bg-slate-200/50 dark:bg-slate-800/50 rounded-xl backdrop-blur-sm border border-slate-300/50 dark:border-slate-700/50 shadow-sm relative z-20">
              <button
                onClick={() => setActiveTab('contact')}
                className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  activeTab === 'contact'
                    ? 'bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Contact Info
              </button>
              <button
                onClick={() => setActiveTab('devs')}
                className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  activeTab === 'devs'
                    ? 'bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Developer Team
              </button>
            </div>
          </div>

          {/* Contact Tab - Display block when active, hidden otherwise */}
          <div className={activeTab === 'contact' ? 'block' : 'hidden'}>
            <div className="grid lg:grid-cols-2 gap-10 lg:gap-12 animate-fade-in-up relative z-10">
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
          </div>

          {/* Devs Tab - Display block when active, hidden otherwise */}
          <div className={activeTab === 'devs' ? 'block' : 'hidden'}>
            <div 
              ref={vantaRef} 
              className="relative rounded-[2rem] overflow-hidden animate-fade-in-up border border-slate-200/50 dark:border-slate-800/50 shadow-2xl transition-all"
              style={{ minHeight: '600px' }}
            >
              {/* Fallback Background for mobile/low-perf devices */}
              <div className="absolute inset-0 bg-slate-50 dark:bg-slate-900 -z-20"></div>
              
              {/* Semi-transparent overlay to ensure text/card readability over the Vanta animation */}
              <div className="absolute inset-0 bg-white/60 dark:bg-slate-950/60 backdrop-blur-[2px] -z-10 pointer-events-none transition-colors duration-500"></div>

              <div className="relative z-10 max-w-5xl mx-auto p-8 sm:p-12">
                <div className="text-center mb-10">
                  <h2 className="text-3xl font-display font-extrabold text-slate-900 dark:text-white tracking-tight drop-shadow-sm dark:drop-shadow-md">
                    Meet the Developers
                  </h2>
                  <p className="text-slate-600 dark:text-slate-300 mt-3 max-w-2xl mx-auto font-medium drop-shadow-sm">
                    The talented minds behind ClubSync. Connect with us directly on our social platforms.
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 relative z-20">
                  {developers.map((dev, i) => (
                    <div key={i} className="bg-white/90 dark:bg-slate-900/70 backdrop-blur-md p-8 rounded-2xl flex flex-col items-center text-center shadow-lg shadow-slate-200/50 dark:shadow-none hover:shadow-2xl hover:shadow-slate-200/60 dark:hover:shadow-xl dark:hover:shadow-primary-900/10 transition-all duration-300 border border-slate-200/80 dark:border-slate-800/70 group hover:-translate-y-1">
                      <div className="w-28 h-28 rounded-full overflow-hidden mb-5 border-4 border-slate-50 dark:border-slate-800 shadow-sm dark:shadow-md group-hover:scale-105 transition-transform duration-300 bg-white">
                        <img src={dev.photo} alt={dev.name} className="w-full h-full object-cover" loading="lazy" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-1">{dev.name}</h3>
                      <p className="text-sm font-medium text-primary-600 dark:text-primary-400 mb-6">{dev.role}</p>
                      
                      <div className="flex items-center gap-4 mt-auto">
                        {dev.facebook && (
                          <a href={dev.facebook} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-all shadow-sm" aria-label="Facebook">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.69.24 2.69.24v2.97h-1.52c-1.49 0-1.96.93-1.96 1.89v2.26h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07z"/></svg>
                          </a>
                        )}
                        {dev.github && (
                          <a href={dev.github} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-all shadow-sm" aria-label="GitHub">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>
                          </a>
                        )}
                        {dev.gmail && (
                          <a href={dev.gmail} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-all shadow-sm" aria-label="Gmail">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z"/></svg>
                          </a>
                        )}
                        {dev.linkedin && (
                          <a href={dev.linkedin} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-all shadow-sm" aria-label="LinkedIn">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.5v8.37h2.5v-4.93c0-.98.79-1.77 1.77-1.77s1.77.79 1.77 1.77v4.93h2.54M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68 1.68 1.68 0 0 0-1.68-1.68 1.68 1.68 0 0 0-1.68 1.68c0 .93.75 1.68 1.68 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/></svg>
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
