import { useState, useRef } from 'react';
import { useReveal } from '../hooks/useReveal';

interface FeatureItem {
  id: string;
  number: string;
  tag: string;
  title: string;
  description: string;
  gradient: string;
  iconSvg: React.ReactNode;
}

const features: FeatureItem[] = [
  {
    id: 'tech-lab',
    number: '01',
    tag: 'Building & Engineering',
    title: 'Innovation & Tech Lab',
    description: 'Hands-on software development, open-source projects, hardware hackathons, and real-world engineering experience.',
    gradient: 'from-blue-600 to-indigo-600',
    iconSvg: (
      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
      </svg>
    ),
  },
  {
    id: 'leadership',
    number: '02',
    tag: 'Leadership & Ops',
    title: 'Executive Growth',
    description: 'Direct mentorship, event organization, budget management, and executive team leadership across campus initiatives.',
    gradient: 'from-violet-600 to-purple-600',
    iconSvg: (
      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    ),
  },
  {
    id: 'workshops',
    number: '03',
    tag: 'Continuous Learning',
    title: 'Skill Accelerators',
    description: 'Industry guest speakers, peer-led workshops, coding bootcamps, and technical certification pathways.',
    gradient: 'from-indigo-600 to-cyan-600',
    iconSvg: (
      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
      </svg>
    ),
  },
  {
    id: 'networking',
    number: '04',
    tag: 'Global Network',
    title: 'Thriving Community',
    description: 'Connect with an active ecosystem of 500+ student innovators, alumni mentors, and industry partners.',
    gradient: 'from-amber-500 to-orange-600',
    iconSvg: (
      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m-17.432-6.506A8.96 8.96 0 003 12c0 .778.099 1.533.284 2.253" />
      </svg>
    ),
  },
  {
    id: 'events',
    number: '05',
    tag: 'Campus Culture',
    title: 'High-Impact Events',
    description: 'Plan and execute campus-wide hackathons, design sprints, technical showcases, and annual galas.',
    gradient: 'from-rose-600 to-pink-600',
    iconSvg: (
      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
      </svg>
    ),
  },
  {
    id: 'career',
    number: '06',
    tag: 'Career Launchpad',
    title: 'Industry Pipeline',
    description: 'Direct exposure to partner recruiting events, resume reviews, sponsor referral channels, and tech site visits.',
    gradient: 'from-emerald-600 to-teal-600',
    iconSvg: (
      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
      </svg>
    ),
  },
];

function FeatureCard({ feature, index }: { feature: FeatureItem; index: number }) {
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || window.matchMedia('(pointer: coarse)').matches) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
    
    // Subtle professional 3D tilt (max +/- 3 degrees)
    const rx = -((y - 50) / 50) * 3;
    const ry = ((x - 50) / 50) * 3;

    setMousePos({ x, y });
    setTilt({ rx, ry });
  };


  const handleMouseLeave = () => {
    setMousePos({ x: 50, y: 50 });
    setTilt({ rx: 0, ry: 0 });
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="group relative rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 p-7 shadow-sm hover:shadow-xl transition-all duration-300 ease-out"
      style={{
        transform: `perspective(1000px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
        animationDelay: `${index * 80}ms`,
      }}
    >
      {/* Interactive Mouse-Following Card Glow Overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"
        style={{
          background: `radial-gradient(350px circle at ${mousePos.x}% ${mousePos.y}%, rgba(99, 102, 241, 0.12), transparent 80%)`,
        }}
      />

      {/* Card Header Row: Icon + Number */}
      <div className="flex items-center justify-between mb-5 relative z-10">
        <div
          className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${feature.gradient} grid place-items-center shadow-md shadow-slate-900/10 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}
        >
          {feature.iconSvg}
        </div>
        <span className="font-mono text-xs font-bold text-slate-400 dark:text-slate-500 tracking-wider">
          {feature.number}
        </span>
      </div>

      {/* Feature Content */}
      <div className="relative z-10 space-y-2">
        <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">
          {feature.tag}
        </span>
        <h3 className="text-xl font-display font-bold text-slate-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
          {feature.title}
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
          {feature.description}
        </p>
      </div>

      {/* Card Corner Subtle Accent Shift */}
      <div className="absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-tl from-primary-500/5 to-transparent rounded-br-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </div>
  );
}

export default function FeaturesSection() {
  const { ref, visible } = useReveal();

  return (
    <section
      ref={ref}
      className={`reveal ${visible ? 'is-visible' : ''} py-20 lg:py-28 relative overflow-hidden bg-slate-50/40 dark:bg-slate-950/40 border-y border-slate-200/50 dark:border-white/5`}
    >
      {/* Background Subtle Accent Glow */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[50rem] h-[25rem] bg-indigo-500/5 blur-[160px] rounded-full" />

      <div className="container-page relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold bg-primary-500/10 dark:bg-primary-400/10 border border-primary-500/20 text-primary-600 dark:text-primary-400">
            <span>✨ WHY CLUBSYNC</span>
          </div>
          <h2 className="section-title">
            Empowering Students to <br className="hidden sm:inline" />
            <span className="gradient-text">Excel, Connect & Lead</span>
          </h2>
          <p className="section-subtitle mx-auto">
            Discover how ClubSync bridges the gap between academic learning and real-world technology leadership through our six core pillars.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feature, i) => (
            <FeatureCard key={feature.id} feature={feature} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
