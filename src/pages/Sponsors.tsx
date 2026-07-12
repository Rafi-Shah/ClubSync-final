import { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';
import Section, { SectionHeader } from '../components/Section';
import { LoadingState, ErrorState, EmptyState } from '../components/States';
import { getSponsors } from '../lib/api';
import type { Sponsor } from '../types';

const tierConfig: Record<string, { label: string; color: string; ring: string }> = {
  platinum: { label: 'Platinum', color: 'text-slate-400', ring: 'ring-slate-300 dark:ring-slate-600' },
  gold: { label: 'Gold', color: 'text-amber-500', ring: 'ring-amber-300 dark:ring-amber-600' },
  silver: { label: 'Silver', color: 'text-slate-500', ring: 'ring-slate-200 dark:ring-slate-700' },
  bronze: { label: 'Bronze', color: 'text-orange-600', ring: 'ring-orange-300 dark:ring-orange-700' },
};

export default function Sponsors() {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    getSponsors()
      .then(setSponsors)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message="Failed to load sponsors." />;

  const tiers = ['platinum', 'gold', 'silver', 'bronze'] as const;

  return (
    <>
      <PageHeader title="Our Sponsors" subtitle="We thank the partners who make our mission possible." breadcrumb="Home / Sponsors" />
      <Section>
        <div className="container-page">
          {sponsors.length === 0 ? (
            <EmptyState title="No sponsors" message="Sponsor information will appear here." />
          ) : (
            <div className="space-y-12">
              {tiers.map(tier => {
                const tierSponsors = sponsors.filter(s => s.tier === tier);
                if (tierSponsors.length === 0) return null;
                const cfg = tierConfig[tier];
                return (
                  <div key={tier}>
                    <div className="flex items-center gap-3 mb-6">
                      <h3 className={`text-sm font-bold uppercase tracking-wider ${cfg.color}`}>{cfg.label} Sponsors</h3>
                      <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
                    </div>
                    <div className={`grid gap-6 ${tier === 'platinum' ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3'}`}>
                      {tierSponsors.map((s, i) => (
                        <a
                          key={s.id}
                          href={s.website_url ?? '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`card p-8 flex flex-col items-center text-center group hover:-translate-y-1 transition-all duration-300 ring-1 ${cfg.ring} animate-fade-in-up`}
                          style={{ animationDelay: `${i * 80}ms` }}
                        >
                          {s.logo_url ? (
                            <img src={s.logo_url} alt={s.name} loading="lazy" className="h-20 w-auto object-contain mb-4 grayscale group-hover:grayscale-0 transition-all" />
                          ) : (
                            <div className="h-20 grid place-items-center mb-4 font-display font-bold text-2xl text-slate-300 dark:text-slate-600">{s.name}</div>
                          )}
                          <h4 className="font-display font-semibold text-slate-900 dark:text-white">{s.name}</h4>
                          {s.description && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{s.description}</p>}
                        </a>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Section>
    </>
  );
}
