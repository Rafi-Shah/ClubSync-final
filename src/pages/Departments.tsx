import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import Section from '../components/Section';
import { LoadingState, ErrorState, EmptyState } from '../components/States';
import { getDepartments } from '../lib/api';
import type { Department } from '../types';

const deptIcons: Record<string, { path: string; gradient: string }> = {
  technology: {
    path: 'M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5',
    gradient: 'from-blue-600 to-indigo-600',
  },
  marketing: {
    path: 'M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.733.935 1.325.99 1.13.104 2.27.104 3.4 0 .592-.055 1.078-.44 1.325-.99.401-.891.732-1.821.985-2.783m-8.02 0c.346.03.694.045 1.042.045h5.936c.348 0 .696-.015 1.042-.045m-8.02 0a12.008 12.008 0 010-9.18m8.02 9.18a12.008 12.008 0 000-9.18m-8.02 0c.253-.962.584-1.892.985-2.783.247-.55.733-.935 1.325-.99 1.13-.104 2.27-.104 3.4 0 .592.055 1.078.44 1.325.99.401.891.732 1.821.985 2.783',
    gradient: 'from-violet-600 to-purple-600',
  },
  events: {
    path: 'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5',
    gradient: 'from-rose-600 to-pink-600',
  },
  design: {
    path: 'M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.01 2.748l-.001-.001A8.983 8.983 0 019 12c0-.528.046-1.045.134-1.549A11.96 11.96 0 009 9.75c-3.155 0-6.002.973-8.318 2.628L1 12.75',
    gradient: 'from-indigo-600 to-cyan-600',
  },
  finance: {
    path: 'M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    gradient: 'from-amber-500 to-orange-600',
  },
  community: {
    path: 'M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z',
    gradient: 'from-emerald-600 to-teal-600',
  },
};

function getDeptConfig(name: string) {
  const key = name.toLowerCase().split(' ')[0];
  return deptIcons[key] ?? {
    path: 'M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25z',
    gradient: 'from-primary-600 to-indigo-600',
  };
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

  if (loading) return <LoadingState message="Loading departments..." />;
  if (error) return <ErrorState message="Failed to load departments." onRetry={() => window.location.reload()} />;
  if (departments.length === 0) return <><PageHeader title="Departments" breadcrumb="Home / Departments" /><Section><EmptyState title="No active departments" /></Section></>;

  return (
    <>
      <PageHeader
        title="Club Departments"
        subtitle="Six specialized divisions leading innovation, events, tech, and community growth."
        breadcrumb="Home / Departments"
      />
      <Section className="bg-slate-50/40 dark:bg-slate-950/40">
        <div className="container-page">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {departments.map((d, i) => {
              const cfg = getDeptConfig(d.name);
              return (
                <div
                  key={d.id}
                  className="glass-card p-8 group hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 flex flex-col justify-between border border-slate-200/70 dark:border-white/10 animate-fade-in-up"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div className="space-y-5">
                    {/* Icon Container */}
                    <div className="flex items-center justify-between">
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${cfg.gradient} grid place-items-center shadow-lg shadow-slate-900/10 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
                        <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d={cfg.path} />
                        </svg>
                      </div>
                      <span className="text-[11px] font-mono font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
                        Dept 0{i + 1}
                      </span>
                    </div>

                    {/* Department Title & Description */}
                    <div>
                      <h3 className="font-display font-extrabold text-2xl text-slate-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors mb-2">
                        {d.name}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                        {d.description ?? 'Dedicated team focusing on driving excellence and student collaboration.'}
                      </p>
                    </div>
                  </div>

                  {/* Footer Action Link */}
                  <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800/80">
                    <Link
                      to="/recruitment"
                      className="inline-flex items-center gap-2 text-xs font-semibold text-primary-600 dark:text-primary-400 group-hover:translate-x-1 transition-transform"
                    >
                      <span>Apply for this Department</span>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Section>
    </>
  );
}

