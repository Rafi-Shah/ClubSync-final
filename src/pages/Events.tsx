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

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message="Failed to load events." />;

  return (
    <>
      <PageHeader title="Events" subtitle="Workshops, hackathons, talks, and community gatherings." breadcrumb="Home / Events" />
      <Section>
        <div className="container-page">
          {/* Search + filter */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="search"
                placeholder="Search events..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="input pl-10"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto">
              {statuses.map(s => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-4 py-2.5 rounded-lg text-sm font-medium capitalize transition-colors whitespace-nowrap ${
                    statusFilter === s
                      ? 'bg-primary-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {filtered.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((e, i) => (
                <div key={e.id} className="animate-fade-in-up" style={{ animationDelay: `${i * 60}ms` }}>
                  <EventCard event={e} />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No events found" message={query ? `No events match "${query}".` : 'No events available right now.'} />
          )}
        </div>
      </Section>
    </>
  );
}
