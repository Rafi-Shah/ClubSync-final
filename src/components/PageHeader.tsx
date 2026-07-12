interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumb?: string;
}

export default function PageHeader({ title, subtitle, breadcrumb }: PageHeaderProps) {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-primary-600 to-primary-800 text-white">
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
      <div className="container-page relative py-16 sm:py-20">
        {breadcrumb && (
          <p className="text-primary-100 text-sm font-medium mb-2 animate-fade-in">{breadcrumb}</p>
        )}
        <h1 className="text-4xl sm:text-5xl font-display font-bold text-white animate-fade-in-up">{title}</h1>
        {subtitle && <p className="mt-4 text-lg text-primary-100 max-w-2xl animate-fade-in-up">{subtitle}</p>}
      </div>
    </div>
  );
}
