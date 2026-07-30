import { useEffect, useId, useRef, useState } from 'react';
import type { GalleryItem } from '../types';

interface LightboxProps {
  items: GalleryItem[];
  index: number | null;
  onClose: () => void;
  onNavigate: (dir: 1 | -1) => void;
}

export default function Lightbox({ items, index, onClose, onNavigate }: LightboxProps) {
  const [mounted, setMounted] = useState(index !== null);
  const [visible, setVisible] = useState(index !== null);
  const closeTimerRef = useRef<number | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (index !== null) {
      setMounted(true);
      requestAnimationFrame(() => setVisible(true));
      return;
    }
    setVisible(false);
    closeTimerRef.current = window.setTimeout(() => setMounted(false), 220);
    return () => {
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current);
      }
    };
  }, [index]);

  useEffect(() => {
    if (!mounted) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onNavigate(1);
      if (e.key === 'ArrowLeft') onNavigate(-1);
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [mounted, onClose, onNavigate]);

  useEffect(() => {
    if (!mounted || !visible) return;
    const timer = window.setTimeout(() => panelRef.current?.focus(), 10);
    return () => window.clearTimeout(timer);
  }, [mounted, visible]);

  if (!mounted || index === null) return null;
  const item = items[index];

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      tabIndex={-1}
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-opacity duration-200 ${visible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      onClick={onClose}
    >
      <div className={`absolute inset-0 bg-slate-950/95 backdrop-blur-sm transition-opacity duration-200 ${visible ? 'opacity-100' : 'opacity-0'}`} />
      <button className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white grid place-items-center transition-colors z-10" onClick={onClose} aria-label="Close">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
      </button>
      <button className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white grid place-items-center transition-colors z-10" onClick={(e) => { e.stopPropagation(); onNavigate(-1); }} aria-label="Previous">
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
      </button>
      <figure className={`relative z-10 max-w-5xl max-h-[85vh] flex flex-col items-center transition-all duration-200 ease-out ${visible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-1'}`} onClick={(e) => e.stopPropagation()}>
        <img src={item.image_url} alt={item.title ?? ''} className="max-w-full max-h-[75vh] object-contain rounded-lg" />
        {item.title && <figcaption id={titleId} className="mt-4 text-white text-center"><p className="font-medium text-lg">{item.title}</p>{item.description && <p className="text-slate-400 text-sm mt-1">{item.description}</p>}</figcaption>}
      </figure>
      <button className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white grid place-items-center transition-colors z-10" onClick={(e) => { e.stopPropagation(); onNavigate(1); }} aria-label="Next">
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
      </button>
    </div>
  );
}
