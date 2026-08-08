interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumb?: string;
}

export default function PageHeader({ title, subtitle, breadcrumb }: PageHeaderProps) {
  return (
    <div className="relative overflow-hidden bg-slate-950 text-white border-b border-slate-800/80 pt-28 pb-14 sm:pt-32 sm:pb-16">
      {/* Background Mesh Grid & Ambient Glow Orbs */}
      <div className="pointer-events-none absolute inset-0 opacity-20 bg-grid-mesh" />
      <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[45rem] h-[15rem] bg-indigo-600/20 blur-[140px] rounded-full" />
      <div className="pointer-events-none absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary-500/50 to-transparent" />

      <div className="container-page relative z-10">
        {/* Breadcrumb Capsule Pill */}
        {breadcrumb && (
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold bg-white/10 text-primary-200 border border-white/15 backdrop-blur-md mb-4 animate-fade-in">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-400" />
            <span>{breadcrumb}</span>
          </div>
        )}

        {/* Page Title */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-extrabold text-white tracking-tight leading-tight animate-fade-in-up">
          {title}
        </h1>

        {/* Page Subtitle */}
        {subtitle && (
          <p className="mt-3 text-base sm:text-lg text-slate-300 max-w-2xl font-normal leading-relaxed animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

