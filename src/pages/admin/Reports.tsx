// MODIFIED FILE — replace the full content of: src/pages/admin/Reports.tsx
import { useEffect, useState } from 'react';
import jsPDF from 'jspdf';
import {
  PageTitle,
  StatCard,
  Badge,
  Modal,
  ConfirmDelete,
  Table,
  TableRow,
  TableCell,
  Select,
  TextArea,
  Input,
  formatDate,
  usePagination,
  Pagination,
} from '../../components/admin/AdminUI';
import { LoadingState, ErrorState, EmptyState } from '../../components/States';
import {
  getReports,
  createReport,
  deleteReport,
  getBudgets,
  getAllAttendance,
  getAllMembers,
  getEvents,
  getActivityLogs,
} from '../../lib/adminApi';
import { uploadFile, FileValidationError } from '../../lib/storage';

interface Report {
  id: string;
  title: string;
  type: string;
  description: string | null;
  period_start: string | null;
  period_end: string | null;
  file_url: string | null;
  created_at: string | null;
}

const emptyForm = {
  title: '',
  type: 'financial',
  description: '',
  period_start: '',
  period_end: '',
};

// ---- PDF layout helpers (text-based table, not a screenshot — reports are
// data-heavy and can run to many rows, so we draw text directly rather than
// rendering a hidden DOM template like CertificateGenerator does) ----
const PAGE_HEIGHT = 842; // A4 in pt
const PAGE_WIDTH = 595;
const MARGIN = 40;
const LINE_HEIGHT = 18;

function newPdf() {
  return new jsPDF({ unit: 'pt', format: 'a4' });
}

function ensureSpace(pdf: jsPDF, y: number, needed = LINE_HEIGHT) {
  if (y + needed > PAGE_HEIGHT - MARGIN) {
    pdf.addPage();
    return MARGIN;
  }
  return y;
}

function drawHeader(pdf: jsPDF, title: string, subtitleLines: string[]) {
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.text(title, MARGIN, MARGIN);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  let y = MARGIN + 20;
  subtitleLines.forEach((line) => {
    pdf.text(line, MARGIN, y);
    y += 14;
  });
  pdf.setDrawColor(200);
  pdf.line(MARGIN, y + 4, PAGE_WIDTH - MARGIN, y + 4);
  return y + 24;
}

function drawTableRow(pdf: jsPDF, x: number, y: number, colWidths: number[], cells: string[], bold = false) {
  pdf.setFont('helvetica', bold ? 'bold' : 'normal');
  pdf.setFontSize(9);
  let cx = x;
  cells.forEach((cell, i) => {
    pdf.text(String(cell ?? ''), cx, y, { maxWidth: colWidths[i] - 6 });
    cx += colWidths[i];
  });
  return y + LINE_HEIGHT;
}

function drawTable(pdf: jsPDF, y: number, headers: string[], colWidths: number[], rows: string[][]) {
  y = ensureSpace(pdf, y);
  y = drawTableRow(pdf, MARGIN, y, colWidths, headers, true);
  pdf.setDrawColor(220);
  pdf.line(MARGIN, y - 12, PAGE_WIDTH - MARGIN, y - 12);
  if (rows.length === 0) {
    y = ensureSpace(pdf, y);
    pdf.setFont('helvetica', 'italic');
    pdf.setFontSize(9);
    pdf.text('No records found for the selected period.', MARGIN, y);
    return y + LINE_HEIGHT;
  }
  for (const row of rows) {
    y = ensureSpace(pdf, y);
    y = drawTableRow(pdf, MARGIN, y, colWidths, row);
  }
  return y;
}

// Filters an array by a date field against optional period_start/period_end
// (inclusive). Rows with no usable date are excluded once a period filter
// is active.
function filterByPeriod<T>(rows: T[], dateField: (r: T) => string | null | undefined, start: string, end: string): T[] {
  if (!start && !end) return rows;
  return rows.filter((r) => {
    const raw = dateField(r);
    if (!raw) return false;
    const d = new Date(raw);
    if (start && d < new Date(start)) return false;
    if (end) {
      const endOfDay = new Date(end);
      endOfDay.setHours(23, 59, 59, 999);
      if (d > endOfDay) return false;
    }
    return true;
  });
}

async function generateReportPdf(type: string, title: string, periodStart: string, periodEnd: string): Promise<Blob> {
  const pdf = newPdf();
  const generatedAt = new Date().toLocaleString();
  const periodLabel = periodStart || periodEnd
    ? `Period: ${periodStart ? formatDate(periodStart) : '—'} to ${periodEnd ? formatDate(periodEnd) : '—'}`
    : 'Period: All time';

  if (type === 'financial') {
    const all = await getBudgets();
    const rows = filterByPeriod(all as any[], (r) => r.transaction_date, periodStart, periodEnd);
    let y = drawHeader(pdf, title, [periodLabel, `Generated: ${generatedAt}`]);
    const colWidths = [80, 200, 80, 100];
    y = drawTable(pdf, y, ['Date', 'Description', 'Type', 'Amount'], colWidths,
      rows.map((r: any) => [
        formatDate(r.transaction_date),
        r.description ?? r.category ?? '—',
        r.type === 'income' ? 'Income' : 'Expense',
        (r.type === 'income' ? '+' : '-') + Number(r.amount ?? 0).toFixed(2),
      ])
    );
    const totalIncome = rows.reduce((s: number, r: any) => s + (r.type === 'income' ? Number(r.amount ?? 0) : 0), 0);
    const totalExpense = rows.reduce((s: number, r: any) => s + (r.type === 'expense' ? Number(r.amount ?? 0) : 0), 0);
    y = ensureSpace(pdf, y, LINE_HEIGHT * 3);
    y += 10;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.text(`Total Income: ${totalIncome.toFixed(2)}`, MARGIN, y); y += LINE_HEIGHT;
    pdf.text(`Total Expense: ${totalExpense.toFixed(2)}`, MARGIN, y); y += LINE_HEIGHT;
    pdf.text(`Net Balance: ${(totalIncome - totalExpense).toFixed(2)}`, MARGIN, y);
  }

  else if (type === 'attendance') {
    const all = await getAllAttendance();
    const rows = filterByPeriod(all as any[], (r) => r.recorded_at, periodStart, periodEnd);
    let y = drawHeader(pdf, title, [periodLabel, `Generated: ${generatedAt}`]);
    const colWidths = [130, 160, 90, 90];
    y = drawTable(pdf, y, ['Member', 'Event / Meeting', 'Status', 'Date'], colWidths,
      rows.map((r: any) => [
        r.member?.full_name ?? '—',
        r.event?.title ?? r.meeting?.title ?? '—',
        r.status ?? '—',
        formatDate(r.recorded_at),
      ])
    );
    y = ensureSpace(pdf, y, LINE_HEIGHT * 2);
    y += 10;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.text(`Total Records: ${rows.length}`, MARGIN, y);
  }

  else if (type === 'membership') {
    const all = await getAllMembers();
    const rows = filterByPeriod(all as any[], (r) => r.joined_at, periodStart, periodEnd);
    let y = drawHeader(pdf, title, [periodLabel, `Generated: ${generatedAt}`]);
    const colWidths = [130, 170, 80, 90];
    y = drawTable(pdf, y, ['Name', 'Email', 'Status', 'Joined'], colWidths,
      rows.map((r: any) => [r.full_name, r.email, r.status ?? '—', formatDate(r.joined_at)])
    );
    const activeCount = rows.filter((r: any) => r.status === 'active').length;
    const suspendedCount = rows.filter((r: any) => r.status === 'suspended').length;
    y = ensureSpace(pdf, y, LINE_HEIGHT * 3);
    y += 10;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.text(`Total Members: ${rows.length}`, MARGIN, y); y += LINE_HEIGHT;
    pdf.text(`Active: ${activeCount}    Suspended: ${suspendedCount}`, MARGIN, y);
  }

  else if (type === 'event') {
    const all = await getEvents();
    const rows = filterByPeriod(all as any[], (r) => r.start_at, periodStart, periodEnd);
    let y = drawHeader(pdf, title, [periodLabel, `Generated: ${generatedAt}`]);
    const colWidths = [190, 90, 90, 105];
    y = drawTable(pdf, y, ['Title', 'Start', 'Status', 'Organizer'], colWidths,
      rows.map((r: any) => [r.title, formatDate(r.start_at), r.status ?? '—', r.organizer?.full_name ?? '—'])
    );
    y = ensureSpace(pdf, y, LINE_HEIGHT * 2);
    y += 10;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.text(`Total Events: ${rows.length}`, MARGIN, y);
  }

  else if (type === 'activity') {
    const all = await getActivityLogs();
    const rows = filterByPeriod(all as any[], (r) => r.created_at, periodStart, periodEnd);
    let y = drawHeader(pdf, title, [periodLabel, `Generated: ${generatedAt}`]);
    const colWidths = [100, 355];
    y = drawTable(pdf, y, ['Date', 'Details'], colWidths,
      rows.map((r: any) => [
        formatDate(r.created_at),
        r.description ?? r.action ?? r.event_type ?? JSON.stringify(r).slice(0, 120),
      ])
    );
    y = ensureSpace(pdf, y, LINE_HEIGHT * 2);
    y += 10;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.text(`Total Entries: ${rows.length}`, MARGIN, y);
  }

  return pdf.output('blob');
}

export default function Reports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [savingStage, setSavingStage] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Report | null>(null);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getReports();
      setReports(data as Report[]);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      await refresh();
    })();
  }, []);

  const openAdd = () => {
    setForm({ ...emptyForm });
    setFormError(null);
    setModalOpen(true);
  };

  const handleSave = async () => {
    setFormError(null);
    if (!form.title.trim()) {
      setFormError('Please enter a title.');
      return;
    }
    setSaving(true);
    try {
      setSavingStage('Gathering data...');
      const pdfBlob = await generateReportPdf(form.type, form.title, form.period_start, form.period_end);
      const pdfFile = new File([pdfBlob], `${form.type}-report-${Date.now()}.pdf`, { type: 'application/pdf' });

      setSavingStage('Uploading...');
      const fileUrl = await uploadFile('reports', form.type, pdfFile, {
        maxSizeMB: 10,
        allowedTypes: ['application/pdf'],
      });

      setSavingStage('Saving...');
      const payload: Record<string, any> = {
        title: form.title,
        type: form.type,
        description: form.description || null,
        period_start: form.period_start || null,
        period_end: form.period_end || null,
        file_url: fileUrl,
      };
      await createReport(payload);
      setModalOpen(false);
      await refresh();
    } catch (e: any) {
      const message = e instanceof FileValidationError ? e.message : (e.message ?? 'Failed to generate report');
      setFormError(message);
    } finally {
      setSaving(false);
      setSavingStage('');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteReport(deleteTarget.id);
      setDeleteTarget(null);
      await refresh();
    } catch (e: any) {
      setError(e.message ?? 'Failed to delete report');
    }
  };

  const filtered = reports.filter((r) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return r.title?.toLowerCase().includes(q) || (r.description ?? '').toLowerCase().includes(q);
  });
  const { page, setPage, totalPages, paged, pageSize, totalItems } = usePagination(filtered, 10);

  return (
    <div>
      <PageTitle
        title="Reports"
        subtitle="Generate and manage club reports"
        action={
          <button onClick={openAdd} className="btn btn-primary">
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Generate Report
            </span>
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard label="Total Reports" value={reports.length} icon="M9 17v-2m3 2V9m3 8V5M5 21h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z" color="primary" />
        <StatCard label="Financial" value={reports.filter((r) => r.type === 'financial').length} icon="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" color="green" />
        <StatCard label="Attendance" value={reports.filter((r) => r.type === 'attendance').length} icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" color="blue" />
      </div>

      <div className="mb-4 w-full sm:w-64">
        <Input label="Search" placeholder="Search by title or description..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <LoadingState message="Loading reports..." />
      ) : error ? (
        <ErrorState message={error} onRetry={refresh} />
      ) : filtered.length === 0 ? (
        <EmptyState title="No reports" message="Generate a report to get started." />
      ) : (
        <>
        <Table headers={['Title', 'Type', 'Description', 'Period Start', 'Period End', 'File', 'Created', 'Actions']}>
          {paged.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="font-medium text-slate-900 dark:text-white">{r.title}</TableCell>
              <TableCell><Badge status={r.type} /></TableCell>
              <TableCell className="max-w-xs truncate">{r.description ?? '—'}</TableCell>
              <TableCell>{formatDate(r.period_start)}</TableCell>
              <TableCell>{formatDate(r.period_end)}</TableCell>
              <TableCell>
                {r.file_url ? (
                  <a href={r.file_url} target="_blank" rel="noreferrer" className="text-primary-600 hover:text-primary-700 text-sm font-medium">View</a>
                ) : (
                  <span className="text-sm text-slate-400">No file</span>
                )}
              </TableCell>
              <TableCell>{formatDate(r.created_at)}</TableCell>
              <TableCell>
                <button onClick={() => setDeleteTarget(r)} className="text-red-600 hover:text-red-700 text-sm font-medium">Delete</button>
              </TableCell>
            </TableRow>
          ))}
        </Table>
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} totalItems={totalItems} pageSize={pageSize} />
        </>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Generate Report">
        <div className="space-y-4">
          {formError && (
            <p className="text-sm text-red-600 dark:text-red-400">{formError}</p>
          )}
          <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Report title" />
          <Select label="Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option value="financial">Financial</option>
            <option value="attendance">Attendance</option>
            <option value="membership">Membership</option>
            <option value="event">Event</option>
            <option value="activity">Activity</option>
          </Select>
          <TextArea label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Optional description" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Period Start" type="date" value={form.period_start} onChange={(e) => setForm({ ...form, period_start: e.target.value })} />
            <Input label="Period End" type="date" value={form.period_end} onChange={(e) => setForm({ ...form, period_end: e.target.value })} />
          </div>
          <p className="text-xs text-slate-400">Leave both period fields empty to include all records of this type.</p>
          <div className="flex gap-3 justify-end pt-2">
            <button onClick={() => setModalOpen(false)} className="btn-outline">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn btn-primary">{saving ? (savingStage || 'Generating...') : 'Generate'}</button>
          </div>
        </div>
      </Modal>

      <ConfirmDelete
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        itemName={deleteTarget?.title ?? 'this report'}
      />
    </div>
  );
}