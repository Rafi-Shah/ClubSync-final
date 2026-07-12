import { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';
import Section from '../components/Section';
import { LoadingState, ErrorState, EmptyState } from '../components/States';
import { getDepartments } from '../lib/api';
import type { Department } from '../types';

const deptIcons = {
  technology: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  marketing: 'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.864a4 4 0 013.5 2.064l2.5 4.5a4 4 0 011.136 2.836V14a3 3 0 01-3 3h-1.864a4 4 0 01-3.5-2.064z',
  events: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  design: 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h8a2 2 0 002-2v-4a2 2 0 00-2-2h-8m0 0V5a2 2 0 012-2h8a2 2 0 012 2v4M7 21l5-5m0 0l5 5',
  finance: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  community: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
};

function getIcon(name: string): string {
  const key = name.toLowerCase().split(' ')[0];
  return (deptIcons as Record<string, string>)[key] ?? 'M4 6h16M4 10h16M4 14h16M4 18h16';
}

export default function Departments() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    getDepartments()
      .then(setDepartments)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message="Failed to load departments." />;
  if (departments.length === 0) return <><PageHeader title="Departments" breadcrumb="Home / Departments" /><Section><EmptyState title="No departments" /></Section></>;

  return (
    <>
      <PageHeader title="Our Departments" subtitle="Six specialized teams driving our club's mission forward." breadcrumb="Home / Departments" />
      <Section>
        <div className="container-page grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {departments.map((d, i) => (
            <div key={d.id} className="card p-6 group hover:-translate-y-1 transition-all duration-300 animate-fade-in-up" style={{ animationDelay: `${i * 80}ms` }}>
              <div className="w-12 h-12 rounded-lg bg-primary-100 dark:bg-primary-950/50 grid place-items-center mb-4 group-hover:bg-primary-600 transition-colors">
                <svg className="w-6 h-6 text-primary-600 dark:text-primary-400 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={getIcon(d.name)} />
                </svg>
              </div>
              <h3 className="font-display font-semibold text-lg text-slate-900 dark:text-white mb-2">{d.name}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">{d.description ?? 'No description available.'}</p>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}
