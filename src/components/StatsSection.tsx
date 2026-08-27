import { useState, useEffect, useRef } from 'react';
import { useReveal } from '../hooks/useReveal';

export interface StatItem {
  value: string;
  label: string;
}

function parseStatValue(raw: string): { target: number; prefix: string; suffix: string; hasComma: boolean } {
  // Extract numbers and non-digits
  const match = raw.match(/^([^0-9]*)([0-9,]+)([^0-9]*)$/);
  if (!match) {
    return { target: 0, prefix: '', suffix: raw, hasComma: false };
  }
  const prefix = match[1];
  const numStr = match[2];
  const suffix = match[3];
  const hasComma = numStr.includes(',');
  const target = parseInt(numStr.replace(/,/g, ''), 10) || 0;
  return { target, prefix, suffix, hasComma };
}

function CounterCard({ item, index, isVisible }: { item: StatItem; index: number; isVisible: boolean }) {
  const [currentCount, setCurrentCount] = useState(0);
  const parsed = parseStatValue(item.value);

  useEffect(() => {
    if (!isVisible) return;

    let startTimestamp: number | null = null;
    const duration = 1200; // 1.2s smooth count-up

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // Ease out quad easing function
      const easeProgress = 1 - (1 - progress) * (1 - progress);
      setCurrentCount(Math.floor(easeProgress * parsed.target));

      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setCurrentCount(parsed.target);
      }
    };

    const animFrame = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(animFrame);
  }, [isVisible, parsed.target]);

  const formattedCount = parsed.hasComma
    ? currentCount.toLocaleString()
    : currentCount.toString();

  return (
    <div
      className="group relative rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 p-5 text-center shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Background Accent Gradient Glow on Hover */}
      <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-tr from-primary-500/10 via-indigo-500/5 to-transparent" />

      {/* Number Display */}
      <div className="relative z-10 space-y-1">
        <p className="font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl text-slate-900 dark:text-white tracking-tight leading-none group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
          <span>{parsed.prefix}</span>
          <span>{formattedCount}</span>
          <span>{parsed.suffix}</span>
        </p>
        <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 pt-1.5">
          {item.label}
        </p>
      </div>

      {/* Decorative Bottom Bar */}
      <div className="absolute bottom-0 inset-x-0 h-1 bg-gradient-to-r from-primary-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </div>
  );
}

export default function StatsSection({ stats }: { stats: StatItem[] }) {
  const { ref, visible } = useReveal();

  return (
    <section
      ref={ref}
      className={`reveal ${visible ? 'is-visible' : ''} py-6 relative overflow-hidden bg-slate-900 dark:bg-slate-950 text-white`}
    >
      {/* Subtle Background Mesh & Lighting */}
      <div className="pointer-events-none absolute inset-0 opacity-20 bg-grid-mesh" />
      <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[45rem] h-[15rem] bg-primary-600/20 blur-[130px] rounded-full" />

      <div className="container-page relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {stats.map((s, i) => (
            <CounterCard key={i} item={s} index={i} isVisible={visible} />
          ))}
        </div>
      </div>
    </section>
  );
}
