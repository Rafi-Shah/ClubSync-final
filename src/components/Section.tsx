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
    <section id={id} ref={ref} className={`reveal ${visible ? 'is-visible' : ''} py-16 sm:py-20 ${className}`}>
      {children}
    </section>
  );
}

export function SectionHeader({ title, subtitle, center = false }: { title: string; subtitle?: string; center?: boolean }) {
  return (
    <div className={`mb-10 ${center ? 'text-center max-w-2xl mx-auto' : ''}`}>
      <h2 className="section-title">{title}</h2>
      {subtitle && <p className="section-subtitle">{subtitle}</p>}
    </div>
  );
}
