import type { ClubEvent } from '../types';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function statusBadge(status: string) {
  const map = {
    draft: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
    published: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
    ongoing: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
    completed: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300',
    cancelled: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
  };
  return (map as Record<string, string>)[status] ?? map.draft;
}

export default function EventCard({ event }: { event: ClubEvent }) {
  return (
    <article className="card overflow-hidden group flex flex-col">
      <div className="relative h-48 overflow-hidden bg-slate-100 dark:bg-slate-800">
        {event.cover_image_url ? (
          <img
            src={event.cover_image_url}
            alt={event.title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full grid place-items-center text-slate-400">
            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        <span className={`badge absolute top-3 right-3 ${statusBadge(event.status)}`}>{event.status}</span>
      </div>
      <div className="p-5 flex flex-col flex-1">
        <p className="text-xs font-medium text-primary-600 dark:text-primary-400 mb-1">{formatDate(event.start_at)}</p>
        <h3 className="font-display font-semibold text-lg text-slate-900 dark:text-white mb-2 line-clamp-2">{event.title}</h3>
        {event.location && (
          <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-2">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="line-clamp-1">{event.location}</span>
          </p>
        )}
        {event.description && <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3 flex-1">{event.description}</p>}
      </div>
    </article>
  );
}
