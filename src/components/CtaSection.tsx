import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useReveal } from '../hooks/useReveal';

export default function CtaSection() {
  const { ref, visible } = useReveal();
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || window.matchMedia('(pointer: coarse)').matches) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
    setMousePos({ x, y });
  };

  return (
    <section ref={ref} className={`reveal ${visible ? 'is-visible' : ''} py-6 lg:py-10 relative overflow-hidden`}>
      <div className="container-page">
        <div
          ref={containerRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setMousePos({ x: 50, y: 50 })}
          className="relative rounded-3xl bg-gradient-to-br from-slate-950 via-indigo-950 to-primary-950 p-6 sm:p-10 lg:p-12 text-center shadow-2xl border border-white/10 overflow-hidden group"
        >

          {/* Mouse-Following Glow Layer */}
          <div
            className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-3xl"
            style={{
              background: `radial-gradient(600px circle at ${mousePos.x}% ${mousePos.y}%, rgba(99, 102, 241, 0.25), transparent 80%)`,
            }}
          />

          {/* Background Mesh Grid Pattern */}
          <div className="pointer-events-none absolute inset-0 opacity-15 bg-grid-mesh" />

          {/* Floating Subtle Ambient Badges */}
          <div className="hidden lg:flex pointer-events-none absolute top-10 left-10 items-center gap-2 px-4 py-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-white animate-float-slow shadow-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>✨ 2026/2027 Recruitment Open</span>
          </div>

          <div
            className="hidden lg:flex pointer-events-none absolute bottom-10 right-10 items-center gap-2 px-4 py-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-white animate-float-slow shadow-lg"
            style={{ animationDelay: '1.5s' }}
          >
            <span>🚀 Join 500+ Student Leaders</span>
          </div>

          {/* Core Content Box */}
          <div className="relative z-10 max-w-3xl mx-auto space-y-6">
            {/* Top Pill Tag */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold bg-white/10 text-primary-200 border border-white/15 shadow-inner">
              <span>🚀 READY TO SHAPE THE FUTURE?</span>
            </div>

            {/* Main Headline */}
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-extrabold text-white tracking-tight leading-[1.1]">
              Become Part of a Community That <br className="hidden sm:inline" />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-primary-200 to-indigo-300">
                Builds, Learns & Grows
              </span>
            </h2>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal max-w-2xl mx-auto">
              Whether you want to develop software, lead executive teams, organize campus hackathons, or expand your professional network, ClubSync is your launchpad.
            </p>

            {/* Dual SaaS Action Buttons */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/recruitment"
                className="w-full sm:w-auto btn bg-white text-slate-950 hover:bg-slate-100 shadow-2xl font-bold px-8 py-3.5 rounded-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2 group/btn"
              >
                <span>Apply Now</span>
                <svg
                  className="w-4 h-4 text-slate-950 group-hover/btn:translate-x-1 transition-transform"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>

              <Link
                to="/departments"
                className="w-full sm:w-auto btn text-white bg-white/10 hover:bg-white/15 border border-white/20 backdrop-blur-md px-8 py-3.5 rounded-xl font-semibold transition-all hover:scale-[1.02]"
              >
                Explore Departments
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
