import type { ClubEvent } from '../types';

function formatDate(iso: string): { day: string; month: string; year: string; full: string } {
  const d = new Date(iso);
  return {
    day: d.toLocaleDateString('en-US', { day: '2-digit' }),
    month: d.toLocaleDateString('en-US', { month: 'short' }),
    year: d.getFullYear().toString(),
    full: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
  };
}

function statusBadge(status: string) {
  switch (status.toLowerCase()) {
    case 'published':
      return {
        bg: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
        dot: 'bg-emerald-500',
      };
    case 'ongoing':
      return {
        bg: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30',
        dot: 'bg-amber-500 animate-pulse',
      };
    case 'completed':
      return {
        bg: 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/30',
        dot: 'bg-slate-400',
      };
    default:
      return {
        bg: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30',
        dot: 'bg-indigo-500',
      };
  }
}

export default function EventCard({ event }: { event: ClubEvent }) {
  const dateObj = formatDate(event.start_at);
  const statusCfg = statusBadge(event.status);

  return (
    <article className="glass-card group flex flex-col h-full overflow-hidden hover:-translate-y-1.5 hover:shadow-2xl transition-all duration-300 border border-slate-200/70 dark:border-white/10">
      {/* Cover Image Header */}
      <div className="relative h-52 overflow-hidden bg-slate-950">
        {event.cover_image_url ? (
          <img
            src={event.cover_image_url}
            alt={event.title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          />
        ) : (
          <div className="w-full h-full grid place-items-center text-slate-600 dark:text-slate-500 bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-900">
            <svg className="w-12 h-12 stroke-1 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
          </div>
        )}

        {/* Gradient Vignette Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent opacity-80" />

        {/* Glass Date Badge Overlay (Top Left) */}
        <div className="absolute top-3.5 left-3.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/60 dark:border-white/10 rounded-xl p-2 px-3 text-center shadow-lg">
          <span className="block text-xs font-extrabold text-slate-900 dark:text-white leading-tight">
            {dateObj.day}
          </span>
          <span className="block text-[10px] font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">
            {dateObj.month}
          </span>
        </div>

        {/* Status Badge (Top Right) */}
        <div className={`absolute top-3.5 right-3.5 px-3 py-1 rounded-full text-[11px] font-bold capitalize border backdrop-blur-md flex items-center gap-1.5 ${statusCfg.bg}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
          <span>{event.status}</span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-6 flex flex-col flex-1 justify-between space-y-4">
        <div className="space-y-2">
          {/* Location Tag */}
          {event.location && (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <svg className="w-3.5 h-3.5 text-primary-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
              <span className="line-clamp-1">{event.location}</span>
            </div>
          )}

          {/* Title */}
          <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-2 leading-snug">
            {event.title}
          </h3>

          {/* Description */}
          {event.description && (
            <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed font-normal pt-1">
              {event.description}
            </p>
          )}
        </div>

        {/* Action Link Footer */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-semibold text-primary-600 dark:text-primary-400">
          <span>View Event Details</span>
          <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </div>
      </div>
    </article>
  );
}

