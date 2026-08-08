import { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';
import Section from '../components/Section';
import { LoadingState, ErrorState, EmptyState } from '../components/States';
import { getExecutiveCommittee } from '../lib/api';
import type { ExecutiveWithProfile } from '../types';

export default function Committee() {
  const [members, setMembers] = useState<ExecutiveWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    getExecutiveCommittee()
      .then(setMembers)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState message="Loading executive committee..." />;
  if (error) return <ErrorState message="Failed to load executive committee." onRetry={() => window.location.reload()} />;
  if (members.length === 0) return <><PageHeader title="Executive Committee" breadcrumb="Home / Committee" /><Section><EmptyState title="No committee members" message="The executive committee will be listed here once assigned." /></Section></>;

  return (
    <>
      <PageHeader
        title="Executive Leadership"
        subtitle="Meet the student leaders guiding ClubSync's vision, operations, and community impact."
        breadcrumb="Home / Committee"
      />
      <Section className="bg-slate-50/40 dark:bg-slate-950/40">
        <div className="container-page">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {members.map((m, i) => (
              <div
                key={m.id}
                className="glass-card p-8 group hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 text-center flex flex-col items-center border border-slate-200/70 dark:border-white/10 animate-fade-in-up relative overflow-hidden"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                {/* Background Card Ambient Shimmer */}
                <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-primary-500/5 to-transparent pointer-events-none" />

                {/* Avatar with Glowing Gradient Ring */}
                <div className="relative mb-5 z-10">
                  <div className="w-28 h-28 rounded-full p-1 bg-gradient-to-tr from-primary-600 via-indigo-500 to-violet-500 shadow-lg shadow-primary-500/20 group-hover:scale-105 group-hover:shadow-primary-500/35 transition-all duration-300">
                    <div className="w-full h-full rounded-full overflow-hidden bg-slate-900 grid place-items-center">
                      {m.member?.avatar_url ? (
                        <img
                          src={m.member.avatar_url}
                          alt={m.member?.full_name ?? 'Committee Member'}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          loading="lazy"
                        />
                      ) : (
                        <span className="text-3xl font-display font-extrabold text-white">
                          {(m.member?.full_name ?? '?').charAt(0)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="relative z-10 space-y-2 w-full">
                  {/* Position Badge */}
                  <div className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-primary-500/10 dark:bg-primary-400/10 text-primary-600 dark:text-primary-400 border border-primary-500/20">
                    {m.position}
                  </div>

                  {/* Name */}
                  <h3 className="font-display font-extrabold text-xl text-slate-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors pt-1">
                    {m.member?.full_name ?? 'Executive Leader'}
                  </h3>

                  {/* Bio */}
                  {m.member?.bio && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed font-normal pt-1">
                      {m.member.bio}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>
    </>
  );
}

