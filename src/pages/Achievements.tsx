import { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';
import Section from '../components/Section';
import { LoadingState, ErrorState, EmptyState } from '../components/States';
import { getAchievements } from '../lib/api';
import type { Achievement } from '../types';

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export default function Achievements() {
  const [items, setItems] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    getAchievements()
      .then(setItems)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message="Failed to load achievements." />;
  if (items.length === 0) return <><PageHeader title="Achievements" breadcrumb="Home / Achievements" /><Section><EmptyState title="No achievements yet" /></Section></>;

  return (
    <>
      <PageHeader title="Our Achievements" subtitle="A track record of excellence in innovation, leadership, and community impact." breadcrumb="Home / Achievements" />
      <Section>
        <div className="container-page relative">
          {/* Timeline line */}
          <div className="absolute left-4 sm:left-1/2 top-0 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-800 sm:-translate-x-1/2" />
          <div className="space-y-12">
            {items.map((a, i) => (
              <div key={a.id} className={`relative flex ${i % 2 === 0 ? 'sm:justify-start' : 'sm:justify-end'}`}>
                {/* Dot */}
                <div className="absolute left-4 sm:left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-primary-600 ring-4 ring-white dark:ring-slate-950 z-10 mt-6" />
                <div className={`pl-12 sm:pl-0 sm:w-1/2 ${i % 2 === 0 ? 'sm:pr-12 sm:text-right' : 'sm:pl-12'}`}>
                  <div className="card p-6 animate-fade-in-up" style={{ animationDelay: `${i * 100}ms` }}>
                    {a.image_url && <img src={a.image_url} alt={a.title} loading="lazy" className="rounded-lg w-full h-40 object-cover mb-4" />}
                    <p className="text-sm font-medium text-primary-600 dark:text-primary-400 mb-1">{formatDate(a.award_date)}</p>
                    <h3 className="font-display font-semibold text-lg text-slate-900 dark:text-white mb-2">{a.title}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{a.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>
    </>
  );
}
