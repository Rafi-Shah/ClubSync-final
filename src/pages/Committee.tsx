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
  const [selectedMember, setSelectedMember] = useState<ExecutiveWithProfile | null>(null);

  useEffect(() => {
    getExecutiveCommittee()
      .then(setMembers)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selectedMember) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [selectedMember]);

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
                onClick={() => setSelectedMember(m)}
                className="glass-card p-8 group hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 text-center flex flex-col items-center border border-slate-200/70 dark:border-white/10 animate-fade-in-up relative overflow-hidden cursor-pointer"
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

      {/* Modal */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setSelectedMember(null)} />
          <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-full overflow-y-auto animate-fade-in-up border border-slate-200 dark:border-slate-800">
            {/* Modal Header/Cover */}
            <div className="relative h-32 sm:h-40 bg-gradient-to-r from-primary-600 to-violet-600">
              <button 
                onClick={() => setSelectedMember(null)}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-black/20 text-white hover:bg-black/40 transition-colors z-10"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="px-6 sm:px-10 pb-10">
              {/* Profile Picture (overlapping cover) */}
              <div className="relative -mt-16 sm:-mt-20 flex justify-center sm:justify-start mb-4">
                <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full p-1.5 bg-white dark:bg-slate-900 shadow-xl">
                  <div className="w-full h-full rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 grid place-items-center">
                    {selectedMember.member?.avatar_url ? (
                      <img src={selectedMember.member.avatar_url} alt={selectedMember.member?.full_name ?? ''} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-4xl font-display font-bold text-slate-400">{(selectedMember.member?.full_name ?? '?').charAt(0)}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Info section */}
              <div className="text-center sm:text-left mb-8">
                <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-slate-900 dark:text-white mb-2">
                  {selectedMember.member?.full_name ?? 'Executive Leader'}
                </h2>
                <div className="inline-block px-3 py-1 rounded-full text-sm font-bold bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800">
                  {selectedMember.position}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-6">
                  {selectedMember.member?.bio && (
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-2">About</h4>
                      <p className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">{selectedMember.member.bio}</p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4">
                    {selectedMember.member?.student_id && (
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                        <span className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Student ID</span>
                        <span className="font-semibold text-slate-900 dark:text-white">{selectedMember.member.student_id}</span>
                      </div>
                    )}
                    {selectedMember.member?.batch && (
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                        <span className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Batch</span>
                        <span className="font-semibold text-slate-900 dark:text-white">{selectedMember.member.batch}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  {(selectedMember.member?.facebook || selectedMember.member?.github || selectedMember.member?.linkedin || selectedMember.member?.gmail) && (
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-4">Connect</h4>
                      <div className="flex flex-col gap-3">
                        {selectedMember.member?.linkedin && (
                          <a href={selectedMember.member.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-[#0a66c2] dark:hover:text-[#0a66c2] transition-colors group">
                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 group-hover:bg-[#0a66c2]/10 grid place-items-center transition-colors">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                            </div>
                            LinkedIn
                          </a>
                        )}
                        {selectedMember.member?.github && (
                          <a href={selectedMember.member.github} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors group">
                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 group-hover:bg-slate-200 dark:group-hover:bg-slate-700 grid place-items-center transition-colors">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                            </div>
                            GitHub
                          </a>
                        )}
                        {selectedMember.member?.facebook && (
                          <a href={selectedMember.member.facebook} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-[#1877f2] dark:hover:text-[#1877f2] transition-colors group">
                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 group-hover:bg-[#1877f2]/10 grid place-items-center transition-colors">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/></svg>
                            </div>
                            Facebook
                          </a>
                        )}
                        {selectedMember.member?.gmail && (
                          <a href={`mailto:${selectedMember.member.gmail}`} className="flex items-center gap-3 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-[#ea4335] dark:hover:text-[#ea4335] transition-colors group">
                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 group-hover:bg-[#ea4335]/10 grid place-items-center transition-colors">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                            </div>
                            Email Me
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

