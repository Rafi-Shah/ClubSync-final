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
          
          <div className="relative bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl w-full max-w-4xl p-3 flex flex-col md:flex-row overflow-hidden animate-fade-in-up max-h-[95vh]">
            
            {/* Left Side: Image + Overlay */}
            <div className="w-full md:w-[42%] relative rounded-[1.5rem] overflow-hidden shrink-0 min-h-[350px] md:min-h-[500px]">
              {selectedMember.member?.avatar_url ? (
                <img src={selectedMember.member.avatar_url} alt={selectedMember.member?.full_name ?? ''} className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                  <span className="text-6xl font-display font-bold text-slate-400">{(selectedMember.member?.full_name ?? '?').charAt(0)}</span>
                </div>
              )}
              {/* Gradient Overlay matching reference */}
              <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/95 via-indigo-900/50 to-transparent" />
              
              <div className="absolute bottom-0 left-0 p-6 sm:p-8 w-full z-10">
                <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-white mb-3 drop-shadow-md">
                  {selectedMember.member?.full_name ?? 'Executive Leader'}
                </h2>
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold bg-white/20 backdrop-blur-md text-white shadow-lg border border-white/30">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l2.4 7.4h7.6l-6 4.6 2.3 7.4-6.3-4.8-6.3 4.8 2.3-7.4-6-4.6h7.6z"/></svg> 
                  {selectedMember.position}
                </div>
              </div>
            </div>

            {/* Right Side: Info */}
            <div className="w-full md:w-[58%] p-6 sm:p-8 md:pl-10 relative overflow-y-auto">
              <button onClick={() => setSelectedMember(null)} className="absolute top-2 right-2 sm:top-4 sm:right-4 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors z-10">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
              
              <div className="space-y-8 mt-4 sm:mt-0">
                {/* ABOUT section */}
                <div>
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 mb-4">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    <h4 className="text-sm font-bold uppercase tracking-widest">About</h4>
                  </div>
                  
                  {selectedMember.member?.bio && (
                    <div className="bg-indigo-50/50 dark:bg-indigo-900/10 rounded-2xl p-5 mb-4 border border-indigo-100 dark:border-indigo-800/30">
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                        {selectedMember.member.bio}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {selectedMember.member?.student_id && (
                      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                           <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422A12.083 12.083 0 0112 21.5a12.083 12.083 0 01-6.16-10.922L12 14z" /></svg>
                        </div>
                        <div className="min-w-0">
                          <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">Student ID</span>
                          <span className="block font-bold text-slate-900 dark:text-white truncate">{selectedMember.member.student_id}</span>
                        </div>
                      </div>
                    )}
                    {selectedMember.member?.batch && (
                      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                           <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        </div>
                        <div className="min-w-0">
                          <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">Batch</span>
                          <span className="block font-bold text-slate-900 dark:text-white truncate">{selectedMember.member.batch}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* CONNECT section */}
                {(selectedMember.member?.facebook || selectedMember.member?.github || selectedMember.member?.linkedin || selectedMember.member?.gmail) && (
                  <div>
                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 mb-4">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                      <h4 className="text-sm font-bold uppercase tracking-widest">Connect</h4>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {selectedMember.member?.linkedin && (
                        <a href={selectedMember.member.linkedin} target="_blank" rel="noopener noreferrer" className="bg-white dark:bg-slate-800 p-3 px-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-between hover:border-[#0a66c2]/30 hover:shadow-md transition-all group">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#0a66c2] flex items-center justify-center text-white shrink-0">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                            </div>
                            <span className="font-semibold text-sm text-slate-700 dark:text-slate-300 group-hover:text-[#0a66c2] transition-colors">LinkedIn</span>
                          </div>
                          <svg className="w-4 h-4 text-slate-400 group-hover:text-[#0a66c2] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                        </a>
                      )}
                      {selectedMember.member?.github && (
                        <a href={selectedMember.member.github} target="_blank" rel="noopener noreferrer" className="bg-white dark:bg-slate-800 p-3 px-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-between hover:border-slate-900 dark:hover:border-slate-600 hover:shadow-md transition-all group">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-900 dark:bg-slate-700 flex items-center justify-center text-white shrink-0">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                            </div>
                            <span className="font-semibold text-sm text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">GitHub</span>
                          </div>
                          <svg className="w-4 h-4 text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                        </a>
                      )}
                      {selectedMember.member?.facebook && (
                        <a href={selectedMember.member.facebook} target="_blank" rel="noopener noreferrer" className="bg-white dark:bg-slate-800 p-3 px-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-between hover:border-[#1877f2]/30 hover:shadow-md transition-all group">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#1877f2] flex items-center justify-center text-white shrink-0">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/></svg>
                            </div>
                            <span className="font-semibold text-sm text-slate-700 dark:text-slate-300 group-hover:text-[#1877f2] transition-colors">Facebook</span>
                          </div>
                          <svg className="w-4 h-4 text-slate-400 group-hover:text-[#1877f2] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                        </a>
                      )}
                      {selectedMember.member?.gmail && (
                        <a href={`mailto:${selectedMember.member.gmail}`} className="bg-white dark:bg-slate-800 p-3 px-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-between hover:border-[#ea4335]/30 hover:shadow-md transition-all group">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#ea4335] flex items-center justify-center text-white shrink-0">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                            </div>
                            <span className="font-semibold text-sm text-slate-700 dark:text-slate-300 group-hover:text-[#ea4335] transition-colors">Email Me</span>
                          </div>
                          <svg className="w-4 h-4 text-slate-400 group-hover:text-[#ea4335] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

