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

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message="Failed to load gallery." />;

  return (
    <>
      <PageHeader title="Gallery" subtitle="Moments from our events, workshops, and community activities." breadcrumb="Home / Gallery" />
      <Section>
        <div className="container-page">
          {items.length > 0 && (
            <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
              {categories.map(c => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors whitespace-nowrap ${
                    category === c
                      ? 'bg-primary-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          )}

          {filtered.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {filtered.map((item, i) => (
                <button
                  key={item.id}
                  onClick={() => setLightboxIndex(i)}
                  className="group relative aspect-square rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 animate-fade-in-up"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <img src={item.image_url} alt={item.title ?? ''} loading="lazy" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                    <div className="text-left">
                      {item.title && <p className="text-white text-sm font-medium">{item.title}</p>}
                      <p className="text-slate-300 text-xs capitalize">{item.category}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <EmptyState title="No images" message="Gallery photos will appear here." />
          )}
        </div>
      </Section>

      <Lightbox items={filtered} index={lightboxIndex} onClose={() => setLightboxIndex(null)} onNavigate={navigate} />
    </>
  );
}
