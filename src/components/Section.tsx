import { ReactNode } from 'react';
import { useReveal } from '../hooks/useReveal';

interface SectionProps {
  children: ReactNode;
  className?: string;
  id?: string;
}

export default function Section({ children, className = '', id }: SectionProps) {
  const { ref, visible } = useReveal();
  return (
    <section id={id} ref={ref} className={`reveal ${visible ? 'is-visible' : ''} py-6 lg:py-10 ${className}`}>
      {children}
    </section>
  );
}

export function SectionHeader({
  title,
  subtitle,
  badge,
  center = false,
}: {
  title: string;
  subtitle?: string;
  badge?: string;
  center?: boolean;
}) {
  return (
    <div className={`mb-8 ${center ? 'text-center max-w-2xl mx-auto' : 'max-w-2xl'}`}>
      {badge && (
        <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400 mb-2 px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/20">
          {badge}
        </span>
      )}
      <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight mb-2">
        {title}
      </h2>
      {subtitle && (
        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 font-normal leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
}

