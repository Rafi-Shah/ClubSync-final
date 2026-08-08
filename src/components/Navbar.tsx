import { NavLink, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import ThemeToggle from './ThemeToggle';

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
  { to: '/committee', label: 'Committee' },
  { to: '/departments', label: 'Departments' },
  { to: '/events', label: 'Events' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/achievements', label: 'Achievements' },
  { to: '/recruitment', label: 'Recruitment' },
  { to: '/sponsors', label: 'Sponsors' },
  { to: '/faq', label: 'FAQ' },
  { to: '/contact', label: 'Contact' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 15);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  return (
    <>
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 px-4 sm:px-6 lg:px-8 ${
          scrolled ? 'pt-3 pb-1' : 'pt-4 pb-2'
        }`}
      >
        <div
          className={`max-w-7xl mx-auto rounded-2xl transition-all duration-300 ${
            scrolled
              ? 'bg-white/85 dark:bg-slate-950/85 backdrop-blur-xl shadow-lg shadow-slate-900/5 border border-slate-200/60 dark:border-white/10 px-4 sm:px-6'
              : 'bg-white/40 dark:bg-slate-950/40 backdrop-blur-md border border-transparent px-2 sm:px-4'
          }`}
        >
          <nav className="flex items-center justify-between h-14 sm:h-16">
            {/* Brand logo */}
            <Link
              to="/"
              className="flex items-center gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-xl"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary-600 via-indigo-600 to-violet-500 text-white font-display font-extrabold grid place-items-center text-sm shadow-md shadow-primary-500/25 group-hover:scale-105 group-hover:shadow-lg group-hover:shadow-primary-500/35 transition-all duration-300">
                CS
              </div>
              <div className="flex flex-col">
                <span className="font-display font-extrabold text-lg sm:text-xl tracking-tight text-slate-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                  Club<span className="bg-gradient-to-r from-primary-600 to-violet-600 dark:from-primary-400 dark:to-violet-400 bg-clip-text text-transparent">Sync</span>
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden lg:flex items-center gap-1 bg-slate-100/60 dark:bg-slate-900/60 p-1.5 rounded-xl border border-slate-200/50 dark:border-slate-800/60 backdrop-blur-md">
              {navLinks.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  end={l.to === '/'}
                  className={({ isActive }) =>
                    `relative px-3 py-1.5 rounded-lg text-xs font-semibold tracking-tight transition-all duration-200 ${
                      isActive
                        ? 'text-primary-600 dark:text-primary-300 bg-white dark:bg-slate-800 shadow-sm'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800/50'
                    }`
                  }
                >
                  {l.label}
                </NavLink>
              ))}
            </div>

            {/* Desktop Right Controls & Member Portal CTA */}
            <div className="flex items-center gap-2">
              <ThemeToggle />

              <Link
                to="/login"
                className="hidden sm:inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white shadow-sm hover:shadow-md shadow-primary-600/20 hover:-translate-y-0.5 transition-all duration-200"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                <span>Member Portal</span>
              </Link>

              {/* Mobile Drawer Trigger */}
              <button
                onClick={() => setMobileOpen(true)}
                className="lg:hidden p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
                aria-label="Open navigation menu"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* Mobile Drawer Navigation */}
      <div
        className={`fixed inset-0 z-50 lg:hidden transition-all duration-300 ${
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div
          className="absolute inset-0 bg-slate-950/60 backdrop-blur-md transition-opacity duration-300"
          onClick={() => setMobileOpen(false)}
        />
        <aside
          className={`absolute right-0 top-0 h-full w-80 max-w-[85%] bg-white/95 dark:bg-slate-950/95 backdrop-blur-2xl border-l border-slate-200/60 dark:border-white/10 shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
            mobileOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between p-5 border-b border-slate-200/80 dark:border-slate-800/80">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-primary-600 text-white grid place-items-center font-bold text-xs">CS</span>
              <span className="font-display font-bold text-base text-slate-900 dark:text-white">Navigation</span>
            </div>
            <button
              onClick={() => setMobileOpen(false)}
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Close menu"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {navLinks.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === '/'}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/60 border border-primary-200/50 dark:border-primary-800/50'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-900/80'
                  }`
                }
              >
                <span>{l.label}</span>
                <svg className="w-4 h-4 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </NavLink>
            ))}
          </nav>

          <div className="p-4 border-t border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30">
            <Link
              to="/login"
              onClick={() => setMobileOpen(false)}
              className="btn-primary w-full text-center flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              <span>Member Portal Sign In</span>
            </Link>
          </div>
        </aside>
      </div>
    </>
  );
}

