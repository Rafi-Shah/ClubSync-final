import { Children, cloneElement, isValidElement, useEffect, useId, useMemo, useRef, useState } from 'react';

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
    in_progress: 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300',
    review: 'bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300',
    completed: 'bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300',
    cancelled: 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300',
    approved: 'bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300',
    rejected: 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300',
    submitted: 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300',
    under_review: 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300',
    implemented: 'bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300',
    present: 'bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300',
    absent: 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300',
    late: 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300',
    excused: 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300',
    active: 'bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300',
    suspended: 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300',
    open: 'bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300',
    closed: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
    income: 'bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300',
    expense: 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300',
    draft: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
    published: 'bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300',
    scheduled: 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300',
    direct: 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300',
    group: 'bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300',
    broadcast: 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300',
  };
  return <span className={`badge ${(map as Record<string, string>)[status] ?? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>{status.replace(/_/g, ' ')}</span>;
}

export function Modal({ open, onClose, title, children }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(open);
  const closeTimerRef = useRef<number | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (open) {
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
  }, [open]);

  useEffect(() => {
    if (!mounted) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key !== 'Tab') return;

      const panel = panelRef.current;
      if (!panel) return;
      const focusable = panel.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mounted, onClose]);

  useEffect(() => {
    if (!mounted || !visible) return;
    const timer = window.setTimeout(() => {
      panelRef.current?.focus();
    }, 10);
    return () => window.clearTimeout(timer);
  }, [mounted, visible]);

  if (!mounted) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-200 ${visible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <div className={`absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity duration-200 ${visible ? 'opacity-100' : 'opacity-0'}`} onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`relative bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto transition-all duration-200 ease-out ${visible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-1'}`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900">
          <h2 id={titleId} className="text-lg font-display font-bold text-slate-900 dark:text-white">{title}</h2>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export function ConfirmDelete({ open, onClose, onConfirm, itemName }: {
  open: boolean; onClose: () => void; onConfirm: () => void; itemName: string;
}) {
  return (
    <Modal open={open} onClose={onClose} title="Confirm Delete">
      <p className="text-slate-600 dark:text-slate-400 mb-6">
        Are you sure you want to delete <span className="font-semibold text-slate-900 dark:text-white">{itemName}</span>? This action cannot be undone.
      </p>
      <div className="flex gap-3 justify-end">
        <button onClick={onClose} className="btn-outline">Cancel</button>
        <button onClick={onConfirm} className="btn bg-red-600 hover:bg-red-700 text-white">Delete</button>
      </div>
    </Modal>
  );
}

export function Table({ headers, children }: { headers: string[]; children: React.ReactNode }) {
  const animatedChildren = Children.map(children, (child, index) => {
    if (isValidElement(child) && child.type === TableRow) {
      return cloneElement(child, { rowIndex: index } as { rowIndex: number });
    }
    return child;
  });

  return (
    <div className="card overflow-hidden animate-fade-in">
      <div className="overflow-x-auto">
        <table className="w-full table-animated">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800">
              {headers.map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">{animatedChildren}</tbody>
        </table>
      </div>
    </div>
  );
}

export function TableSkeleton({ columns, rows = 5 }: { columns: number; rows?: number }) {
  return (
    <Table headers={Array.from({ length: columns }, (_, index) => `col-${index + 1}`)}>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <TableRow key={`skeleton-${rowIndex}`}>
          {Array.from({ length: columns }).map((__, colIndex) => (
            <TableCell key={`skeleton-cell-${rowIndex}-${colIndex}`}>
              <div className="skeleton h-4 w-full max-w-[180px]" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </Table>
  );
}

export function TableEmptyState({
  message,
  colSpan,
}: {
  message: string;
  colSpan: number;
}) {
  return (
    <TableRow>
      <TableCell className="py-10" colSpan={colSpan}>
        <div className="table-empty-state">
          <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 grid place-items-center">
            <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">{message}</p>
        </div>
      </TableCell>
    </TableRow>
  );
}

export function TableRow({ children, rowIndex = 0 }: { children: React.ReactNode; rowIndex?: number }) {
  return (
    <tr
      className="table-row-animated hover:bg-primary-50/50 dark:hover:bg-primary-950/20 transition-colors duration-300"
      style={{ animationDelay: `${Math.min(rowIndex, 12) * 45}ms` }}
    >
      {children}
    </tr>
  );
}

export function TableCell({ children, className = '', colSpan }: { children: React.ReactNode; className?: string; colSpan?: number }) {
  return <td colSpan={colSpan} className={`px-4 py-3 text-sm text-slate-700 dark:text-slate-300 ${className}`}>{children}</td>;
}

export function Input({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{label}</label>
      <input {...props} className={`w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all ${props.className ?? ''}`} />
    </div>
  );
}

export function Select({ label, children, ...props }: { label: string; children: React.ReactNode } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{label}</label>
      <select {...props} className={`w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all ${props.className ?? ''}`}>
        {children}
      </select>
    </div>
  );
}

export function TextArea({ label, ...props }: { label: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{label}</label>
      <textarea {...props} className={`w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all ${props.className ?? ''}`} />
    </div>
  );
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatDateTime(date: string | null | undefined): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// Shared client-side pagination: every table's data already comes from the
// database (Load) and is already narrowed by search/filter before reaching
// here — this hook just slices that already-DB-sourced array into pages so
// large tables don't render hundreds of rows at once.
export function usePagination<T>(items: T[], pageSize = 10) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

  // If a new search/filter shrinks the result set below the page we were
  // on, snap back to page 1 instead of showing an empty page.
  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [totalPages]);

  const paged = useMemo(
    () => items.slice((page - 1) * pageSize, page * pageSize),
    [items, page, pageSize]
  );

  return { page, setPage, totalPages, paged, pageSize, totalItems: items.length };
}

export function Pagination({
  page,
  totalPages,
  onPageChange,
  totalItems,
  pageSize,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  pageSize?: number;
}) {
  if (totalPages <= 1) return null;
  const start = totalItems != null && pageSize ? (page - 1) * pageSize + 1 : null;
  const end = totalItems != null && pageSize ? Math.min(page * pageSize, totalItems) : null;

  return (
    <div className="flex items-center justify-between mt-4 text-sm flex-wrap gap-3 table-pagination-shell">
      <div key={page} className="flex items-center justify-between w-full sm:w-auto gap-3 animate-fade-in">
        <span className="text-slate-500 dark:text-slate-400">
          {start != null && end != null
            ? `Showing ${start}–${end} of ${totalItems}`
            : `Page ${page} of ${totalPages}`}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="btn-outline px-3 py-1 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300"
          >
            Previous
          </button>
          <span className="text-slate-600 dark:text-slate-300">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="btn-outline px-3 py-1 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}