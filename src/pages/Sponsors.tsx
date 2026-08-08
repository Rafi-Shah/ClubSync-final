import { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';
import Section from '../components/Section';
import { LoadingState, ErrorState, EmptyState } from '../components/States';
import { getSponsors } from '../lib/api';
import type { Sponsor } from '../types';

const tierConfig: Record<string, { label: string; badgeBg: string; text: string }> = {
  platinum: { label: 'Platinum Sponsor', badgeBg: 'bg-indigo-500/10 border-indigo-500/30', text: 'text-indigo-600 dark:text-indigo-400' },
  gold: { label: 'Gold Sponsor', badgeBg: 'bg-amber-500/10 border-amber-500/30', text: 'text-amber-600 dark:text-amber-400' },
  silver: { label: 'Silver Sponsor', badgeBg: 'bg-slate-500/10 border-slate-500/30', text: 'text-slate-600 dark:text-slate-400' },
  bronze: { label: 'Bronze Sponsor', badgeBg: 'bg-orange-500/10 border-orange-500/30', text: 'text-orange-600 dark:text-orange-400' },
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

  if (loading) return <LoadingState message="Loading sponsors..." />;
  if (error) return <ErrorState message="Failed to load sponsors." onRetry={() => window.location.reload()} />;

  const tiers = ['platinum', 'gold', 'silver', 'bronze'] as const;

  return (
    <>
      <PageHeader
        title="Our Sponsors & Partners"
        subtitle="Empowering student technology leaders through direct sponsorship, mentorship, and industry partnerships."
        breadcrumb="Home / Sponsors"
      />
      <Section className="bg-slate-50/40 dark:bg-slate-950/40">
        <div className="container-page">
          {sponsors.length === 0 ? (
            <EmptyState title="No sponsors available" message="Sponsors and industry partners will appear here." />
          ) : (
            <div className="space-y-16">
              {tiers.map(tier => {
                const tierSponsors = sponsors.filter(s => s.tier === tier);
                if (tierSponsors.length === 0) return null;
                const cfg = tierConfig[tier];
                return (
                  <div key={tier} className="space-y-6">
                    {/* Tier Divider Header */}
                    <div className="flex items-center gap-4">
                      <span className={`px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${cfg.badgeBg} ${cfg.text}`}>
                        {cfg.label}
                      </span>
                      <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
                    </div>

                    {/* Sponsor Cards Grid */}
                    <div className={`grid gap-6 ${tier === 'platinum' ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3'}`}>
                      {tierSponsors.map((s, i) => (
                        <a
                          key={s.id}
                          href={s.website_url ?? '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="glass-card p-8 flex flex-col items-center text-center group hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 border border-slate-200/70 dark:border-white/10 animate-fade-in-up"
                          style={{ animationDelay: `${i * 80}ms` }}
                        >
                          {/* Logo Container */}
                          <div className="h-24 w-full flex items-center justify-center mb-4">
                            {s.logo_url ? (
                              <img
                                src={s.logo_url}
                                alt={s.name}
                                loading="lazy"
                                className="max-h-20 max-w-full object-contain filter group-hover:scale-110 transition-transform duration-300"
                              />
                            ) : (
                              <span className="font-display font-bold text-2xl text-slate-400 group-hover:text-primary-500 transition-colors">
                                {s.name}
                              </span>
                            )}
                          </div>

                          {/* Sponsor Info */}
                          <h4 className="font-display font-bold text-lg text-slate-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                            {s.name}
                          </h4>
                          {s.description && (
                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 font-normal leading-relaxed line-clamp-2">
                              {s.description}
                            </p>
                          )}
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

