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

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message="Failed to load committee." />;
  if (members.length === 0) return <><PageHeader title="Executive Committee" breadcrumb="Home / Committee" /><Section><EmptyState title="No committee members" message="The executive committee will be listed here once assigned." /></Section></>;

  return (
    <>
      <PageHeader title="Executive Committee" subtitle="The leaders who guide our club's vision and direction." breadcrumb="Home / Committee" />
      <Section>
        <div className="container-page grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {members.map((m, i) => (
            <div key={m.id} className="card p-6 text-center group animate-fade-in-up" style={{ animationDelay: `${i * 80}ms` }}>
              <div className="w-24 h-24 rounded-full mx-auto mb-4 overflow-hidden bg-slate-100 dark:bg-slate-800 ring-4 ring-primary-50 dark:ring-primary-950 group-hover:ring-primary-200 dark:group-hover:ring-primary-800 transition-all">
                {m.member?.avatar_url ? (
                  <img src={m.member.avatar_url} alt={m.member?.full_name ?? ''} className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <div className="w-full h-full grid place-items-center text-2xl font-bold text-slate-400">
                    {(m.member?.full_name ?? '?').charAt(0)}
                  </div>
                )}
              </div>
              <h3 className="font-display font-semibold text-lg text-slate-900 dark:text-white">{m.member?.full_name ?? 'Unknown'}</h3>
              <p className="text-sm text-primary-600 dark:text-primary-400 font-medium mt-1">{m.position}</p>
              {m.member?.bio && <p className="text-sm text-slate-500 dark:text-slate-400 mt-3 line-clamp-3">{m.member.bio}</p>}
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}
