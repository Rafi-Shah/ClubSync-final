import { useEffect, useState, useMemo } from 'react';
import PageHeader from '../components/PageHeader';
import Section from '../components/Section';
import { LoadingState, ErrorState, EmptyState } from '../components/States';
import { getFaqs } from '../lib/api';
import type { Faq } from '../types';

export default function Faq() {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    getFaqs()
      .then(setFaqs)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => {
    const set = new Set(faqs.map(f => f.category));
    return Array.from(set);
  }, [faqs]);

  const [activeCategory, setActiveCategory] = useState('all');

  const filtered = useMemo(() => {
    return faqs.filter(f => {
      const matchesCat = activeCategory === 'all' || f.category === activeCategory;
      const matchesQuery = !query || f.question.toLowerCase().includes(query.toLowerCase()) || f.answer.toLowerCase().includes(query.toLowerCase());
      return matchesCat && matchesQuery;
    });
  }, [faqs, activeCategory, query]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message="Failed to load FAQs." />;
  if (faqs.length === 0) return <><PageHeader title="FAQ" breadcrumb="Home / FAQ" /><Section><EmptyState title="No FAQs" /></Section></>;

  return (
    <>
      <PageHeader title="Frequently Asked Questions" subtitle="Find answers to common questions about ClubSync." breadcrumb="Home / FAQ" />
      <Section>
        <div className="container-page max-w-3xl">
          {/* Search */}
          <div className="relative mb-6">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input type="search" placeholder="Search questions..." value={query} onChange={(e) => setQuery(e.target.value)} className="input pl-10" />
          </div>

          {/* Category filter */}
          {categories.length > 1 && (
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              <button onClick={() => setActiveCategory('all')} className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors whitespace-nowrap ${activeCategory === 'all' ? 'bg-primary-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>All</button>
              {categories.map(c => (
                <button key={c} onClick={() => setActiveCategory(c)} className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors whitespace-nowrap ${activeCategory === c ? 'bg-primary-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>{c}</button>
              ))}
            </div>
          )}

          {/* Accordion */}
          <div className="space-y-3">
            {filtered.map((f, i) => {
              const isOpen = openId === f.id;
              return (
                <div key={f.id} className="card overflow-hidden animate-fade-in-up" style={{ animationDelay: `${i * 50}ms` }}>
                  <button
                    onClick={() => setOpenId(isOpen ? null : f.id)}
                    className="w-full flex items-center justify-between gap-4 p-5 text-left"
                  >
                    <span className="font-medium text-slate-900 dark:text-white">{f.question}</span>
                    <svg className={`w-5 h-5 text-slate-400 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <div className={`grid transition-all duration-300 ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                    <div className="overflow-hidden">
                      <p className="px-5 pb-5 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{f.answer}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filtered.length === 0 && <EmptyState title="No matching questions" message="Try a different search term." />}
        </div>
      </Section>
    </>
  );
}
