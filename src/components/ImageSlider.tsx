import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';

interface Slide {
  image_url: string;
  title: string;
  subtitle?: string;
}

export default function ImageSlider({ slides, interval = 6000 }: { slides: Slide[]; interval?: number }) {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const containerRef = useRef<HTMLDivElement>(null);

  const next = useCallback(() => setCurrent((c) => (c + 1) % slides.length), [slides.length]);
  const prev = useCallback(() => setCurrent((c) => (c - 1 + slides.length) % slides.length), [slides.length]);

  useEffect(() => {
    if (isPaused || slides.length <= 1) return;
    const t = setInterval(next, interval);
    return () => clearInterval(t);
  }, [isPaused, next, interval, slides.length]);

  const [touchStart, setTouchStart] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;
    if (diff > 50) next();
    if (diff < -50) prev();
    setTouchStart(null);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || window.matchMedia('(pointer: coarse)').matches) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
    setMousePos({ x, y });
  };


  const scrollToContent = () => {
    const el = document.getElementById('about-preview') || document.getElementById('main-content');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollTo({ top: window.innerHeight * 0.8, behavior: 'smooth' });
    }
  };

  if (slides.length === 0) return null;
  const activeSlide = slides[current];

  return (
    <section
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative min-h-[90vh] flex flex-col justify-between pt-28 pb-10 overflow-hidden bg-slate-50/70 dark:bg-slate-950/90 bg-grid-mesh"
      style={
        {
          '--mouse-x': `${mousePos.x}%`,
          '--mouse-y': `${mousePos.y}%`,
        } as React.CSSProperties
      }
    >
      {/* Subtle Radial Ambient Lighting */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40 dark:opacity-25 transition-opacity duration-700"
        style={{
          background: `radial-gradient(800px circle at var(--mouse-x) var(--mouse-y), rgba(99, 102, 241, 0.16), transparent 80%)`,
        }}
      />

      {/* Decorative Blur Spheres */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[40rem] h-[20rem] rounded-full bg-primary-500/10 dark:bg-primary-500/15 blur-[140px]" />
      <div className="pointer-events-none absolute top-1/4 -right-20 w-80 h-80 rounded-full bg-violet-600/10 dark:bg-violet-600/15 blur-[120px]" />

      {/* Hero Content Container */}
      <div className="container-page relative z-10 my-auto">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          
          {/* Left Column: SaaS Headline, Badge & CTAs */}
          <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
            
            {/* Top Announcement Pill */}
            <div className="inline-flex items-center">
              <Link
                to="/recruitment"
                className="group inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full text-xs font-semibold bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:border-primary-500/40 backdrop-blur-md shadow-sm transition-all duration-200"
              >
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
                </span>
                <span className="font-semibold">Recruitment Drive 2026/2027 Open</span>
                <span className="text-primary-600 dark:text-primary-400 font-bold group-hover:translate-x-0.5 transition-transform">
                  Apply Now &rarr;
                </span>
              </Link>
            </div>

            {/* SaaS Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.08]">
              Where Passion Meets <br className="hidden sm:inline" />
              <span className="gradient-text">
                Purpose & Innovation
              </span>
            </h1>

            {/* Subtitle / Dynamic Slide Description */}
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 font-normal leading-relaxed text-balance max-w-lg mx-auto lg:mx-0">
              {activeSlide.subtitle || 'Join a community of innovators, builders, and leaders shaping the future of technology and campus impact.'}
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3.5 pt-1">
              <Link
                to="/recruitment"
                className="btn-primary group px-6 py-3.2 text-sm font-semibold shadow-lg shadow-primary-600/25 hover:shadow-primary-600/40"
              >
                <span>Join ClubSync</span>
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>

              <Link
                to="/departments"
                className="btn-outline px-5 py-3.2 text-sm font-medium"
              >
                <span>Explore Departments</span>
              </Link>
            </div>

            {/* Trust highlights */}
            <div className="pt-3 flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>500+ Active Members</span>
              </div>
              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>6 Departments</span>
              </div>
              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>120+ Events</span>
              </div>
            </div>
          </div>

          {/* Right Column: SaaS Product Mockup Showcase Window */}
          <div className="lg:col-span-6 relative">
            <div className="relative rounded-2xl p-1.5 bg-gradient-to-b from-white/90 to-white/40 dark:from-white/15 dark:to-white/5 backdrop-blur-2xl border border-slate-200/80 dark:border-white/10 shadow-2xl shadow-slate-900/10">
              
              {/* Product Window Header */}
              <div className="px-4 py-2.5 bg-slate-100/90 dark:bg-slate-900/90 backdrop-blur-md rounded-t-xl flex items-center justify-between border-b border-slate-200/60 dark:border-white/5">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                </div>
                <div className="text-[11px] font-mono text-slate-400 dark:text-slate-500 px-3 py-0.5 rounded-md bg-white/50 dark:bg-slate-950/50 border border-slate-200/50 dark:border-white/5">
                  clubsync.org/showcase
                </div>
                <div className="w-10 text-right text-[10px] font-mono text-slate-400">
                  0{current + 1}/{slides.length}
                </div>
              </div>

              {/* Slider Image Shell */}
              <div
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                className="relative h-[320px] sm:h-[380px] rounded-b-xl overflow-hidden bg-slate-950 group select-none"
              >

                {slides.map((slide, i) => (
                  <div
                    key={i}
                    className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                      i === current ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    }`}
                  >
                    <img
                      src={slide.image_url}
                      alt={slide.title}
                      className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
                  </div>
                ))}

                {/* Overlay Caption Banner */}
                <div className="absolute inset-x-0 bottom-0 p-5 z-10">
                  <div className="flex items-end justify-between gap-4">
                    <div className="max-w-md">
                      <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-primary-600 text-white shadow-sm mb-1.5">
                        Feature Spotlight
                      </span>
                      <h3 className="text-lg sm:text-xl font-display font-bold text-white leading-snug">
                        {activeSlide.title}
                      </h3>
                    </div>
                  </div>
                </div>

                {/* Navigation Controls */}
                {slides.length > 1 && (
                  <>
                    <button
                      onClick={prev}
                      aria-label="Previous slide"
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-slate-950/60 hover:bg-slate-950/90 backdrop-blur-md border border-white/10 text-white grid place-items-center opacity-0 group-hover:opacity-100 transition-all duration-200 z-20"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                      </svg>
                    </button>
                    <button
                      onClick={next}
                      aria-label="Next slide"
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-slate-950/60 hover:bg-slate-950/90 backdrop-blur-md border border-white/10 text-white grid place-items-center opacity-0 group-hover:opacity-100 transition-all duration-200 z-20"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                      </svg>
                    </button>
                  </>
                )}
              </div>

              {/* Slide Indicator Bar */}
              <div className="p-2.5 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md rounded-xl mt-1.5 flex items-center justify-between gap-2 border border-slate-200/50 dark:border-white/5">
                <div className="flex gap-2 flex-1">
                  {slides.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrent(i)}
                      className={`h-1 rounded-full transition-all duration-300 ${
                        i === current ? 'w-8 bg-primary-600 dark:bg-primary-400' : 'w-2 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400'
                      }`}
                      aria-label={`Go to slide: ${s.title}`}
                    />
                  ))}
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium hidden sm:inline">
                  Auto-rotating
                </span>
              </div>
            </div>

            {/* Floating Glass Metric Badge */}
            <div className="absolute -top-3 -right-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 p-2.5 px-3.5 rounded-xl shadow-xl hidden sm:flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 grid place-items-center font-bold text-xs">
                ✓
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-900 dark:text-white">Active Community</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">500+ Student Leaders</p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Hero Bottom Scroll Indicator */}
      <div className="relative z-10 text-center pt-4">
        <button
          onClick={scrollToContent}
          className="inline-flex flex-col items-center gap-1.5 group focus:outline-none"
          aria-label="Scroll down to main content"
        >
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
            Scroll to explore
          </span>
          <div className="w-5 h-8 rounded-full border-2 border-slate-300 dark:border-slate-700 group-hover:border-primary-500 grid place-items-center p-1 transition-colors">
            <div className="w-1 h-2 rounded-full bg-primary-600 dark:bg-primary-400 animate-bounce-soft" />
          </div>
        </button>
      </div>
    </section>
  );
}


