import { useEffect, useState, useMemo } from 'react';
import PageHeader from '../components/PageHeader';
import Section from '../components/Section';
import Lightbox from '../components/Lightbox';
import { LoadingState, ErrorState, EmptyState } from '../components/States';
import { getGalleryItems } from '../lib/api';
import type { GalleryItem } from '../types';

export default function Gallery() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [category, setCategory] = useState('all');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    getGalleryItems()
      .then(setItems)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => {
    const set = new Set(items.map(i => i.category));
    return ['all', ...Array.from(set)];
  }, [items]);

  const filtered = useMemo(() => {
    return category === 'all' ? items : items.filter(i => i.category === category);
  }, [items, category]);

  const navigate = (dir: 1 | -1) => {
    setLightboxIndex(prev => {
      if (prev === null) return prev;
      const next = (prev + dir + filtered.length) % filtered.length;
      return next;
    });
  };

  if (loading) return <LoadingState message="Loading gallery photos..." />;
  if (error) return <ErrorState message="Failed to load gallery." onRetry={() => window.location.reload()} />;

  return (
    <>
      <PageHeader
        title="Media Gallery"
        subtitle="Highlights from our hackathons, technical workshops, campus outreach, and community events."
        breadcrumb="Home / Gallery"
      />
      <Section className="bg-slate-50/40 dark:bg-slate-950/40">
        <div className="container-page">
          {/* Category Filter Pills */}
          {items.length > 0 && (
            <div className="glass-card p-3 mb-10 inline-flex items-center gap-2 overflow-x-auto max-w-full">
              {categories.map(c => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold capitalize transition-all duration-200 whitespace-nowrap ${
                    category === c
                      ? 'bg-gradient-to-r from-primary-600 to-indigo-600 text-white shadow-md shadow-primary-600/25 scale-[1.02]'
                      : 'bg-white/60 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/50 dark:border-white/5'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          )}

          {/* Photo Grid */}
          {filtered.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {filtered.map((item, i) => (
                <button
                  key={item.id}
                  onClick={() => setLightboxIndex(i)}
                  className="group relative aspect-square rounded-2xl overflow-hidden bg-slate-900 border border-slate-200/60 dark:border-white/10 hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 text-left animate-fade-in-up"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <img
                    src={item.image_url}
                    alt={item.title ?? ''}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                  />

                  {/* Gradient Overlay + Zoom Icon + Title */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-4">
                    <div className="flex justify-end">
                      <span className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md grid place-items-center text-white">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" />
                        </svg>
                      </span>
                    </div>
                    <div>
                      {item.title && <p className="text-white text-sm font-bold line-clamp-1">{item.title}</p>}
                      <p className="text-primary-300 text-xs font-medium capitalize mt-0.5">{item.category}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <EmptyState title="No images available" message="Photos in this category will appear here soon." />
          )}
        </div>
      </Section>

      <Lightbox items={filtered} index={lightboxIndex} onClose={() => setLightboxIndex(null)} onNavigate={navigate} />
    </>
  );
}

