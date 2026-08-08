import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center text-center px-4 py-24 relative overflow-hidden bg-slate-950 text-white">
      {/* Background Grid Mesh & Ambient Orb */}
      <div className="pointer-events-none absolute inset-0 opacity-20 bg-grid-mesh" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[35rem] h-[20rem] bg-indigo-600/20 blur-[140px] rounded-full" />

      <div className="relative z-10 glass-card p-10 sm:p-16 max-w-lg border border-white/10 shadow-2xl space-y-4">
        <p className="text-7xl sm:text-9xl font-display font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-primary-400 via-indigo-400 to-violet-400 tracking-tight">
          404
        </p>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight">
          Page Not Found
        </h1>
        <p className="text-slate-300 text-sm leading-relaxed max-w-sm mx-auto font-normal">
          The page you are looking for doesn't exist, has been removed, or is temporarily unavailable.
        </p>
        <div className="pt-4">
          <Link
            to="/"
            className="btn bg-white text-slate-950 hover:bg-slate-100 shadow-xl font-bold px-8 py-3 rounded-xl hover:scale-105 transition-all inline-flex items-center gap-2"
          >
            <span>Back to Home</span>
            <svg className="w-4 h-4 text-slate-950" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}

