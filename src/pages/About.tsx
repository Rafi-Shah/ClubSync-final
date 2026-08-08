import { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';
import Section from '../components/Section';
import { LoadingState, ErrorState } from '../components/States';
import { getAboutBlocks, getSiteSettings } from '../lib/api';
import type { AboutBlock, SiteSettings } from '../types';

export default function About() {
  const [blocks, setBlocks] = useState<AboutBlock[]>([]);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    Promise.all([getAboutBlocks(), getSiteSettings()])
      .then(([b, s]) => { setBlocks(b); setSettings(s); })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState message="Loading club story..." />;
  if (error) return <ErrorState message="Failed to load about content." onRetry={() => window.location.reload()} />;

  return (
    <>
      <PageHeader
        title="About ClubSync"
        subtitle={settings?.tagline ?? 'Where Passion Meets Purpose — Driving Campus Innovation & Excellence.'}
        breadcrumb="Home / About"
      />

      <Section className="bg-slate-50/40 dark:bg-slate-950/40">
        <div className="container-page space-y-12 lg:space-y-16">
          {blocks.map((block, i) => (
            <div
              key={block.id}
              className={`glass-card p-8 sm:p-12 rounded-3xl border border-slate-200/80 dark:border-white/10 grid md:grid-cols-2 gap-10 items-center hover:shadow-2xl transition-all duration-300 relative overflow-hidden group ${
                i % 2 === 1 ? 'md:[&>*:first-child]:order-2' : ''
              }`}
            >
              {/* Content */}
              <div className="space-y-4 relative z-10">
                <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400 px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/20">
                  Chapter 0{i + 1}
                </span>
                <h2 className="text-2xl sm:text-4xl font-display font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {block.title}
                </h2>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-normal whitespace-pre-line text-base">
                  {block.body}
                </p>
              </div>

              {/* Image Showcase Box */}
              {block.image_url && (
                <div className="relative rounded-2xl overflow-hidden shadow-xl bg-slate-900 h-80 group/img">
                  <img
                    src={block.image_url}
                    alt={block.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-700 ease-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent opacity-60 pointer-events-none" />
                </div>
              )}
            </div>
          ))}

          {/* Core Pillars Grid */}
          <div className="pt-12 grid sm:grid-cols-3 gap-6">
            {[
              { title: 'Relentless Innovation', desc: 'Pushing technological boundaries with software projects and hardware hacks.', icon: '💡' },
              { title: 'Inclusive Leadership', desc: 'Fostering a welcoming culture for student leaders across six departments.', icon: '🤝' },
              { title: 'Campus Impact', desc: 'Organizing workshops and volunteer initiatives that make a tangible difference.', icon: '⚡' },
            ].map((p, idx) => (
              <div key={idx} className="glass-card p-6 text-center space-y-2 border border-slate-200/60 dark:border-white/5">
                <div className="text-3xl mb-2">{p.icon}</div>
                <h3 className="font-display font-bold text-slate-900 dark:text-white text-lg">{p.title}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 font-normal leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>
    </>
  );
}

