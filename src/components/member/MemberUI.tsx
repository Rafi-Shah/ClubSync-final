interface PageTitleProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function PageTitle({ title, subtitle, action }: PageTitleProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon: string;
  color?: string;
}

export function StatCard({ label, value, icon, color = 'primary' }: StatCardProps) {
  const colorMap: Record<string, string> = {
    primary: 'bg-primary-50 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400',
    green: 'bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400',
    amber: 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400',
    blue: 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400',
    red: 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400',
  };
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
          <p className="text-2xl font-display font-bold text-slate-900 dark:text-white mt-1">{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-lg grid place-items-center ${colorMap[color]}`}>
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
          </svg>
        </div>
      </div>
    </div>
  );
}

export function Badge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300',
    'in_progress': 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300',
    review: 'bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300',
    completed: 'bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300',
    cancelled: 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300',
    approved: 'bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300',
    rejected: 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300',
    submitted: 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300',
    'under_review': 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300',
    implemented: 'bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300',
    present: 'bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300',
    absent: 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300',
    late: 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300',
    excused: 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300',
    active: 'bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300',
    suspended: 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300',
  };
  return <span className={`badge ${(map as Record<string, string>)[status] ?? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>{status.replace(/_/g, ' ')}</span>;
}
