import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getSiteSettings } from '../lib/api';
import type { SiteSettings } from '../types';

export default function Footer() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  useEffect(() => {
    getSiteSettings().then(setSettings).catch(() => {});
  }, []);

  const socials = settings?.social_links ?? {};
  const socialIcons = {
    twitter: 'M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z',
    instagram: 'M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.43.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.43.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.72 3.72 0 0 1-1.38-.9 3.72 3.72 0 0 1-.9-1.38c-.16-.43-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.43-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16zm0 1.62c-3.15 0-3.5.01-4.74.07-1.07.05-1.65.23-2.04.38-.51.2-.88.44-1.26.82-.38.38-.62.75-.82 1.26-.15.39-.33.97-.38 2.04-.06 1.24-.07 1.59-.07 4.74s.01 3.5.07 4.74c.05 1.07.23 1.65.38 2.04.2.51.44.88.82 1.26.38.38.75.62 1.26.82.39.15.97.33 2.04.38 1.24.06 1.59.07 4.74.07s3.5-.01 4.74-.07c1.07-.05 1.65-.23 2.04-.38.51-.2.88-.44 1.26-.82.38-.38.62-.75.82-1.26.15-.39.33-.97.38-2.04.06-1.24.07-1.59.07-4.74s-.01-3.5-.07-4.74c-.05-1.07-.23-1.65-.38-2.04a3.42 3.42 0 0 0-.82-1.26 3.42 3.42 0 0 0-1.26-.82c-.39-.15-.97-.33-2.04-.38-1.24-.06-1.59-.07-4.74-.07zm0 2.76a5.46 5.46 0 1 1 0 10.92 5.46 5.46 0 0 1 0-10.92zm0 9a3.54 3.54 0 1 0 0-7.08 3.54 3.54 0 0 0 0 7.08zm6.95-9.18a1.27 1.27 0 1 1-2.54 0 1.27 1.27 0 0 1 2.54 0z',
    linkedin: 'M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.5v8.37h2.5v-4.93c0-.98.79-1.77 1.77-1.77s1.77.79 1.77 1.77v4.93h2.54M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68 1.68 1.68 0 0 0-1.68-1.68 1.68 1.68 0 0 0-1.68 1.68c0 .93.75 1.68 1.68 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z',
    facebook: 'M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.69.24 2.69.24v2.97h-1.52c-1.49 0-1.96.93-1.96 1.89v2.26h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07z',
  };

  return (
    <footer className="bg-slate-950 text-slate-300 relative border-t border-slate-800/80 overflow-hidden">
      {/* Top Accent Glow Border */}
      <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-primary-500/60 to-transparent" />

      {/* Subtle Background Mesh Grid */}
      <div className="pointer-events-none absolute inset-0 opacity-10 bg-grid-mesh" />

      <div className="container-page py-16 lg:py-20 relative z-10 grid gap-10 md:grid-cols-2 lg:grid-cols-5">
        {/* Brand Column (Spans 2 on desktop) */}
        <div className="lg:col-span-2 space-y-4">
          <Link to="/" className="inline-flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-600 via-indigo-600 to-violet-600 text-white grid place-items-center font-display font-extrabold text-base shadow-lg shadow-primary-500/20 group-hover:scale-105 transition-transform">
              CS
            </div>
            <span className="font-display font-extrabold text-2xl text-white tracking-tight">
              {settings?.club_name ?? 'ClubSync'}
            </span>
          </Link>
          <p className="text-sm text-slate-400 leading-relaxed max-w-sm font-normal">
            {settings?.description ?? 'Empowering university students to innovate, collaborate, and lead through real-world tech projects, workshops, and community events.'}
          </p>

          {/* Social Links */}
          <div className="pt-2 flex items-center gap-3">
            {Object.entries(socials).map(([key, url]) => (
              <a
                key={key}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-400 hover:text-white hover:bg-gradient-to-tr hover:from-primary-600 hover:to-indigo-600 hover:border-primary-500/50 hover:scale-110 hover:-rotate-3 transition-all duration-300 grid place-items-center shadow-md"
                aria-label={key}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d={(socialIcons as Record<string, string>)[key] ?? ''} />
                </svg>
              </a>
            ))}
          </div>
        </div>

        {/* Navigation Links Column */}
        <div className="space-y-4">
          <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">Explore</h4>
          <ul className="space-y-2.5 text-sm">
            {[
              { label: 'About Us', path: '/about' },
              { label: 'Events Schedule', path: '/events' },
              { label: 'Recruitment Drive', path: '/recruitment' },
              { label: 'Media Gallery', path: '/gallery' },
              { label: 'Key Achievements', path: '/achievements' },
            ].map(item => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className="group inline-flex items-center gap-1.5 text-slate-400 hover:text-primary-400 transition-colors"
                >
                  <span className="w-1 h-1 rounded-full bg-slate-600 group-hover:bg-primary-400 group-hover:scale-150 transition-all" />
                  <span className="group-hover:translate-x-1 transition-transform">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Organization Column */}
        <div className="space-y-4">
          <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">Organization</h4>
          <ul className="space-y-2.5 text-sm">
            {[
              { label: 'Club Departments', path: '/departments' },
              { label: 'Executive Committee', path: '/committee' },
              { label: 'Sponsors & Partners', path: '/sponsors' },
              { label: 'Help & FAQ', path: '/faq' },
              { label: 'Contact Us', path: '/contact' },
            ].map(item => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className="group inline-flex items-center gap-1.5 text-slate-400 hover:text-primary-400 transition-colors"
                >
                  <span className="w-1 h-1 rounded-full bg-slate-600 group-hover:bg-primary-400 group-hover:scale-150 transition-all" />
                  <span className="group-hover:translate-x-1 transition-transform">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact & Portal Access Column */}
        <div className="space-y-4">
          <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">Contact & Portal</h4>
          <ul className="space-y-2.5 text-sm text-slate-400">
            {settings?.contact_email && (
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-primary-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
                <span className="truncate">{settings.contact_email}</span>
              </li>
            )}
            {settings?.contact_phone && (
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-primary-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-2.826-1.47-5.114-3.758-6.584-6.584l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                </svg>
                <span>{settings.contact_phone}</span>
              </li>
            )}
            {settings?.address && (
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 text-primary-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
                <span className="line-clamp-2">{settings.address}</span>
              </li>
            )}
          </ul>

          <div className="pt-2">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/15 text-white border border-white/15 transition-all hover:scale-105"
            >
              <span>Member Portal Login</span>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l3 3m0 0l-3 3m3-3H2.25" />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Sub-Footer Copyright Bar */}
      <div className="border-t border-slate-900 py-6 relative z-10">
        <div className="container-page flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} {settings?.club_name ?? 'ClubSync'}. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link to="/contact" className="hover:text-slate-400 transition-colors">Support</Link>
            <Link to="/faq" className="hover:text-slate-400 transition-colors">FAQ</Link>
            <span className="text-slate-700">|</span>
            <span className="text-slate-600">Built for Innovation & Impact</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

