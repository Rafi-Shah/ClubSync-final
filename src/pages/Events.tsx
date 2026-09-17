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
  const [selectedEvent, setSelectedEvent] = useState<ClubEvent | null>(null);

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

  const statuses = ['all', 'published', 'completed'];

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
                  <EventCard event={e} onClick={() => setSelectedEvent(e)} />
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

        {/* Event Details Modal */}
        {selectedEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-800 relative">
              <button
                onClick={() => setSelectedEvent(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors z-10"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              {selectedEvent.cover_image_url && (
                <div className="w-full h-64 sm:h-80 relative bg-slate-950">
                  <img
                    src={selectedEvent.cover_image_url}
                    alt={selectedEvent.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
                </div>
              )}
              
              <div className="p-6 sm:p-8 space-y-6">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-md border ${
                      selectedEvent.status === 'published' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' :
                      selectedEvent.status === 'completed' ? 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20' :
                      'bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-500/10 dark:text-primary-400 dark:border-primary-500/20'
                    }`}>
                      {selectedEvent.status}
                    </span>
                    {selectedEvent.location && (
                      <span className="flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-400">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {selectedEvent.location}
                      </span>
                    )}
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 dark:text-white mb-2">
                    {selectedEvent.title}
                  </h2>
                  <div className="text-sm font-medium text-primary-600 dark:text-primary-400">
                    {new Date(selectedEvent.start_at).toLocaleString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit'
                    })}
                    {selectedEvent.end_at && ` - ${new Date(selectedEvent.end_at).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit'
                    })}`}
                  </div>
                </div>

                {selectedEvent.description && (
                  <div className="prose prose-slate dark:prose-invert max-w-none">
                    <p className="whitespace-pre-wrap text-slate-600 dark:text-slate-300 leading-relaxed">
                      {selectedEvent.description}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Section>
    </>
  );
}

