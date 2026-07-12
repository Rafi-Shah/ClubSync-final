import { useEffect, useState } from 'react';
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
} from '../../components/admin/AdminUI';
import { LoadingState, ErrorState, EmptyState } from '../../components/States';
import {
  getReports,
  createReport,
  deleteReport,
} from '../../lib/adminApi';

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

export default function Reports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
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
    setModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: Record<string, any> = {
        title: form.title,
        type: form.type,
        description: form.description || null,
        period_start: form.period_start || null,
        period_end: form.period_end || null,
        file_url: null,
      };
      await createReport(payload);
      setModalOpen(false);
      await refresh();
    } catch (e: any) {
      setError(e.message ?? 'Failed to generate report');
    } finally {
      setSaving(false);
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

      {loading ? (
        <LoadingState message="Loading reports..." />
      ) : error ? (
        <ErrorState message={error} onRetry={refresh} />
      ) : reports.length === 0 ? (
        <EmptyState title="No reports" message="Generate a report to get started." />
      ) : (
        <Table headers={['Title', 'Type', 'Description', 'Period Start', 'Period End', 'File', 'Created', 'Actions']}>
          {reports.map((r) => (
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
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Generate Report">
        <div className="space-y-4">
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
          <div className="flex gap-3 justify-end pt-2">
            <button onClick={() => setModalOpen(false)} className="btn-outline">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn btn-primary">{saving ? 'Generating...' : 'Generate'}</button>
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
