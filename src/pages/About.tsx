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

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message="Failed to load about content." />;

  return (
    <>
      <PageHeader title="About Our Club" subtitle={settings?.tagline ?? 'Where Passion Meets Purpose'} breadcrumb="Home / About" />
      <Section>
        <div className="container-page space-y-16">
          {blocks.map((block, i) => (
            <div key={block.id} className={`grid md:grid-cols-2 gap-10 items-center ${i % 2 === 1 ? 'md:[&>*:first-child]:order-2' : ''}`}>
              <div>
                <h2 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 dark:text-white mb-4">{block.title}</h2>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line">{block.body}</p>
              </div>
              {block.image_url && (
                <img src={block.image_url} alt={block.title} loading="lazy" className="rounded-xl shadow-lg w-full h-72 object-cover" />
              )}
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}
