import { useEffect, useState, useMemo } from 'react';
import PageHeader from '../components/PageHeader';
import Section from '../components/Section';
import EventCard from '../components/EventCard';
import { LoadingState, ErrorState, EmptyState } from '../components/States';
import { getPublicEvents } from '../lib/api';
import type { ClubEvent } from '../types';

export default function Events() {
  const [events, setEvents] = useState<ClubEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    getPublicEvents()
      .then(setEvents)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return events.filter(e => {
      const matchesQuery = !query ||
        e.title.toLowerCase().includes(query.toLowerCase()) ||
        (e.description ?? '').toLowerCase().includes(query.toLowerCase()) ||
        (e.location ?? '').toLowerCase().includes(query.toLowerCase());
      const matchesStatus = statusFilter === 'all' || e.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [events, query, statusFilter]);

  const statuses = ['all', 'published', 'ongoing', 'completed'];

  if (loading) return <LoadingState message="Loading events schedule..." />;
  if (error) return <ErrorState message="Failed to load events." onRetry={() => window.location.reload()} />;

  return (
    <>
      <PageHeader
        title="Events & Workshops"
        subtitle="Explore upcoming hackathons, tech talks, workshops, and community gatherings."
        breadcrumb="Home / Events"
      />
      <Section className="bg-slate-50/50 dark:bg-slate-950/50">
        <div className="container-page">
          {/* Glass Search & Filter Control Panel */}
          <div className="glass-card p-4 sm:p-6 mb-10 space-y-4">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              {/* Search Bar */}
              <div className="relative w-full md:w-96">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="search"
                  placeholder="Search events by title or location..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="input pl-10 pr-9 text-sm"
                />
                {query && (
                  <button
                    onClick={() => setQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    aria-label="Clear search"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Status Filter Buttons Bar */}
              <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-1 hidden lg:inline">
                  Status:
                </span>
                {statuses.map(s => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold capitalize transition-all duration-200 whitespace-nowrap ${
                      statusFilter === s
                        ? 'bg-gradient-to-r from-primary-600 to-indigo-600 text-white shadow-md shadow-primary-600/25 scale-[1.02]'
                        : 'bg-white/60 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/50 dark:border-white/5'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Results Count Strip */}
            <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
              <span>
                Showing <strong className="text-slate-900 dark:text-white font-bold">{filtered.length}</strong> {filtered.length === 1 ? 'event' : 'events'}
                {query && ` matching "${query}"`}
              </span>
              {(query || statusFilter !== 'all') && (
                <button
                  onClick={() => { setQuery(''); setStatusFilter('all'); }}
                  className="text-primary-600 dark:text-primary-400 hover:underline font-semibold"
                >
                  Reset filters
                </button>
              )}
            </div>
          </div>

          {/* Events Card Grid */}
          {filtered.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {filtered.map((e, i) => (
                <div key={e.id} className="animate-fade-in-up" style={{ animationDelay: `${i * 80}ms` }}>
                  <EventCard event={e} />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No events found"
              message={query ? `No events match "${query}". Try adjusting your search or filters.` : 'No public events available at this time.'}
            />
          )}
        </div>
      </Section>
    </>
  );
}

