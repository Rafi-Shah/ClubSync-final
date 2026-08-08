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

  if (loading) return <LoadingState message="Loading club achievements..." />;
  if (error) return <ErrorState message="Failed to load achievements." onRetry={() => window.location.reload()} />;
  if (items.length === 0) return <><PageHeader title="Achievements" breadcrumb="Home / Achievements" /><Section><EmptyState title="No achievements yet" /></Section></>;

  return (
    <>
      <PageHeader
        title="Our Achievements"
        subtitle="A proud track record of innovation awards, hackathon victories, and community impact."
        breadcrumb="Home / Achievements"
      />
      <Section className="bg-slate-50/40 dark:bg-slate-950/40">
        <div className="container-page relative">
          {/* Timeline Center Line */}
          <div className="absolute left-4 sm:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary-500/50 via-indigo-500/30 to-transparent sm:-translate-x-1/2" />

          <div className="space-y-12">
            {items.map((a, i) => (
              <div key={a.id} className={`relative flex ${i % 2 === 0 ? 'sm:justify-start' : 'sm:justify-end'}`}>
                {/* Glowing Node Dot */}
                <div className="absolute left-4 sm:left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 shadow-md shadow-amber-500/40 ring-4 ring-white dark:ring-slate-950 z-10 mt-7" />

                {/* Card Container */}
                <div className={`pl-12 sm:pl-0 sm:w-1/2 ${i % 2 === 0 ? 'sm:pr-12 sm:text-right' : 'sm:pl-12'}`}>
                  <div
                    className="glass-card p-7 sm:p-8 hover:-translate-y-1.5 hover:shadow-2xl transition-all duration-300 border border-slate-200/80 dark:border-white/10 group animate-fade-in-up"
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    {/* Cover Image */}
                    {a.image_url && (
                      <div className="relative rounded-xl overflow-hidden mb-5 bg-slate-900 h-44">
                        <img
                          src={a.image_url}
                          alt={a.title}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                    )}

                    {/* Date Pill Tag */}
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 mb-2">
                      <span>🏆 {formatDate(a.award_date)}</span>
                    </div>

                    {/* Title */}
                    <h3 className="font-display font-extrabold text-xl text-slate-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors mb-2">
                      {a.title}
                    </h3>

                    {/* Description */}
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                      {a.description}
                    </p>
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

