import { useEffect, useState, useMemo } from 'react';
import PageHeader from '../components/PageHeader';
import Section from '../components/Section';
import { LoadingState, ErrorState, EmptyState } from '../components/States';
import { getFaqs } from '../lib/api';
import type { Faq } from '../types';

export default function FaqPage() {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    getFaqs()
      .then(d => { setFaqs(d); if (d.length > 0) setOpenId(d[0].id); })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => {
    const set = new Set(faqs.map(f => f.category));
    return Array.from(set);
  }, [faqs]);

  const filtered = useMemo(() => {
    return faqs.filter(f => {
      const matchesCat = activeCategory === 'all' || f.category === activeCategory;
      const matchesQuery = !query || f.question.toLowerCase().includes(query.toLowerCase()) || f.answer.toLowerCase().includes(query.toLowerCase());
      return matchesCat && matchesQuery;
    });
  }, [faqs, activeCategory, query]);

  if (loading) return <LoadingState message="Loading questions..." />;
  if (error) return <ErrorState message="Failed to load FAQs." onRetry={() => window.location.reload()} />;
  if (faqs.length === 0) return <><PageHeader title="FAQ" breadcrumb="Home / FAQ" /><Section><EmptyState title="No FAQs available" /></Section></>;

  return (
    <>
      <PageHeader
        title="Frequently Asked Questions"
        subtitle="Quick answers to everything you need to know about joining ClubSync, departments, and events."
        breadcrumb="Home / FAQ"
      />
      <Section className="bg-slate-50/40 dark:bg-slate-950/40">
        <div className="container-page max-w-3xl">
          {/* Glass Search & Category Filter Bar */}
          <div className="glass-card p-4 sm:p-6 mb-8 space-y-4">
            <div className="relative">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="search"
                placeholder="Search questions or keywords..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="input pl-10 text-sm"
              />
            </div>

            {categories.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                <button
                  onClick={() => setActiveCategory('all')}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold capitalize transition-all duration-200 whitespace-nowrap ${
                    activeCategory === 'all'
                      ? 'bg-gradient-to-r from-primary-600 to-indigo-600 text-white shadow-md shadow-primary-600/25 scale-[1.02]'
                      : 'bg-white/60 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/50 dark:border-white/5'
                  }`}
                >
                  All Questions
                </button>
                {categories.map(c => (
                  <button
                    key={c}
                    onClick={() => setActiveCategory(c)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold capitalize transition-all duration-200 whitespace-nowrap ${
                      activeCategory === c
                        ? 'bg-gradient-to-r from-primary-600 to-indigo-600 text-white shadow-md shadow-primary-600/25 scale-[1.02]'
                        : 'bg-white/60 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/50 dark:border-white/5'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Accordion Questions Grid */}
          <div className="space-y-4">
            {filtered.map((f, i) => {
              const isOpen = openId === f.id;
              return (
                <div
                  key={f.id}
                  className="glass-card border border-slate-200/80 dark:border-white/10 overflow-hidden hover:border-primary-500/40 transition-all duration-200 animate-fade-in-up"
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <button
                    onClick={() => setOpenId(isOpen ? null : f.id)}
                    className="w-full flex items-center justify-between gap-4 p-6 text-left"
                  >
                    <span className="font-display font-bold text-slate-900 dark:text-white text-base sm:text-lg">
                      {f.question}
                    </span>
                    <span className={`w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 grid place-items-center shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180 bg-primary-500/10 text-primary-600 dark:text-primary-400' : 'text-slate-400'}`}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </span>
                  </button>
                  <div className={`grid transition-all duration-300 ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                    <div className="overflow-hidden">
                      <p className="px-6 pb-6 text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal border-t border-slate-100 dark:border-slate-800/80 pt-4">
                        {f.answer}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filtered.length === 0 && <EmptyState title="No matching questions" message="Try searching for a different keyword or topic." />}
        </div>
      </Section>
    </>
  );
}

