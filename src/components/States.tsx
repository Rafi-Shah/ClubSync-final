export function LoadingState({ message = 'Loading content...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full border-4 border-primary-500/20 animate-pulse" />
        <div className="w-12 h-12 border-4 border-transparent border-t-primary-600 border-r-indigo-600 rounded-full animate-spin" />
      </div>
      <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 tracking-wide">
        {message}
      </p>
    </div>
  );
}

export function ErrorState({
  message = 'Something went wrong while loading content.',
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="glass-card max-w-md mx-auto my-12 p-8 flex flex-col items-center justify-center text-center gap-4 border border-rose-500/20">
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-600 to-pink-600 grid place-items-center shadow-lg shadow-rose-500/20 text-white">
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
      </div>
      <div className="space-y-1">
        <h3 className="font-display font-bold text-slate-900 dark:text-white text-lg">Unable to Load Data</h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="btn bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:scale-[1.02] transition-transform text-xs font-bold px-6 py-2.5 rounded-xl mt-2"
        >
          Try Again
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title, message }: { title: string; message?: string }) {
  return (
    <div className="glass-card max-w-md mx-auto my-12 p-10 flex flex-col items-center justify-center text-center gap-3">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/50 dark:border-white/10 grid place-items-center text-slate-400 dark:text-slate-500 mb-1">
        <svg className="w-8 h-8 stroke-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      </div>
      <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white">{title}</h3>
      {message && <p className="text-sm text-slate-600 dark:text-slate-400 max-w-sm leading-relaxed">{message}</p>}
    </div>
  );
}

