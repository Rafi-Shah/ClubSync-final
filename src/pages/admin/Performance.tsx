import { useEffect, useState } from 'react';
import {
  PageTitle,
  StatCard,
  Modal,
  Table,
  TableRow,
  TableCell,
  Select,
  Input,
  TextArea,
  formatDate,
  usePagination,
  Pagination,
} from '../../components/admin/AdminUI';
import { LoadingState, ErrorState, EmptyState } from '../../components/States';
import { getAllPerformance, createPerformance, getAllMembers } from '../../lib/adminApi';

interface PerformanceRecord {
  id: string;
  member_id: string;
  period_start: string;
  period_end: string;
  attendance_rate: number | null;
  tasks_completed: number | null;
  tasks_assigned: number | null;
  volunteer_hours: number | null;
  events_attended: number | null;
  overall_score: number | null;
  notes: string | null;
  member: { id: string; full_name: string } | null;
}

interface Member {
  id: string;
  full_name: string;
}

const emptyForm = {
  member_id: '',
  period_start: '',
  period_end: '',
  attendance_rate: '',
  tasks_completed: '0',
  tasks_assigned: '0',
  volunteer_hours: '0',
  events_attended: '0',
  overall_score: '',
  notes: '',
};

export default function Performance() {
  const [records, setRecords] = useState<PerformanceRecord[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const [data, mem] = await Promise.all([getAllPerformance(), getAllMembers()]);
      setRecords(data as PerformanceRecord[]);
      setMembers(mem as Member[]);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load performance records');
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
    if (!form.member_id) {
      setFormError('Please select a member.');
      return;
    }
    if (!form.period_start || !form.period_end) {
      setFormError('Please set both a period start and end date.');
      return;
    }
    if (form.period_end < form.period_start) {
      setFormError('Period end cannot be before the period start.');
      return;
    }
    const attendanceRate = form.attendance_rate === '' ? 0 : Number(form.attendance_rate);
    const overallScore = form.overall_score === '' ? 0 : Number(form.overall_score);
    if (!Number.isFinite(attendanceRate) || attendanceRate < 0 || attendanceRate > 100) {
      setFormError('Attendance rate must be between 0 and 100.');
      return;
    }
    if (!Number.isFinite(overallScore) || overallScore < 0 || overallScore > 100) {
      setFormError('Overall score must be between 0 and 100.');
      return;
    }
    setSaving(true);
    try {
      await createPerformance({
        member_id: form.member_id,
        period_start: form.period_start,
        period_end: form.period_end,
        attendance_rate: attendanceRate,
        tasks_completed: Number(form.tasks_completed) || 0,
        tasks_assigned: Number(form.tasks_assigned) || 0,
        volunteer_hours: Number(form.volunteer_hours) || 0,
        events_attended: Number(form.events_attended) || 0,
        overall_score: overallScore,
        notes: form.notes || null,
      });
      setModalOpen(false);
      await refresh();
    } catch (e: any) {
      setFormError(e.message ?? 'Failed to save performance record');
    } finally {
      setSaving(false);
    }
  };

  const filtered = records.filter((r) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return r.member?.full_name?.toLowerCase().includes(q);
  });
  const { page, setPage, totalPages, paged, pageSize, totalItems } = usePagination(filtered, 10);

  const avgScore = records.length
    ? Math.round(records.reduce((s, r) => s + (r.overall_score ?? 0), 0) / records.length)
    : 0;

  return (
    <div>
      <PageTitle
        title="Performance"
        subtitle="Record and track member engagement metrics"
        action={
          <button onClick={openAdd} className="btn btn-primary">
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add Record
            </span>
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard label="Total Records" value={records.length} icon="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" color="primary" />
        <StatCard label="Members Tracked" value={new Set(records.map((r) => r.member_id)).size} icon="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" color="blue" />
        <StatCard label="Average Score" value={avgScore} icon="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10" color="green" />
      </div>

      <div className="mb-4 w-full sm:w-64">
        <Input label="Search" placeholder="Search by member name..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <LoadingState message="Loading performance records..." />
      ) : error ? (
        <ErrorState message={error} onRetry={refresh} />
      ) : filtered.length === 0 ? (
        <EmptyState title="No performance records" message="Add a record to start tracking member engagement." />
      ) : (
        <>
        <Table headers={['Member', 'Period', 'Attendance', 'Tasks', 'Volunteer', 'Events', 'Score']}>
          {paged.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="font-medium text-slate-900 dark:text-white">{r.member?.full_name ?? '—'}</TableCell>
              <TableCell>{formatDate(r.period_start)} – {formatDate(r.period_end)}</TableCell>
              <TableCell>{r.attendance_rate?.toFixed(0) ?? 0}%</TableCell>
              <TableCell>{r.tasks_completed ?? 0}/{r.tasks_assigned ?? 0}</TableCell>
              <TableCell>{r.volunteer_hours?.toFixed(1) ?? 0}h</TableCell>
              <TableCell>{r.events_attended ?? 0}</TableCell>
              <TableCell><span className="font-bold text-primary-600 dark:text-primary-400">{r.overall_score?.toFixed(0) ?? 0}</span></TableCell>
            </TableRow>
          ))}
        </Table>
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} totalItems={totalItems} pageSize={pageSize} />
        </>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Performance Record">
        <div className="space-y-4">
          {formError && (
            <p className="text-sm text-red-600 dark:text-red-400">{formError}</p>
          )}
          <Select label="Member" value={form.member_id} onChange={(e) => setForm({ ...form, member_id: e.target.value })}>
            <option value="">Select a member</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.full_name}</option>
            ))}
          </Select>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Period Start" type="date" value={form.period_start} onChange={(e) => setForm({ ...form, period_start: e.target.value })} />
            <Input label="Period End" type="date" value={form.period_end} onChange={(e) => setForm({ ...form, period_end: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Attendance Rate (%)" type="number" min={0} max={100} value={form.attendance_rate} onChange={(e) => setForm({ ...form, attendance_rate: e.target.value })} />
            <Input label="Overall Score (0-100)" type="number" min={0} max={100} value={form.overall_score} onChange={(e) => setForm({ ...form, overall_score: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Tasks Completed" type="number" min={0} value={form.tasks_completed} onChange={(e) => setForm({ ...form, tasks_completed: e.target.value })} />
            <Input label="Tasks Assigned" type="number" min={0} value={form.tasks_assigned} onChange={(e) => setForm({ ...form, tasks_assigned: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Volunteer Hours" type="number" min={0} step="0.5" value={form.volunteer_hours} onChange={(e) => setForm({ ...form, volunteer_hours: e.target.value })} />
            <Input label="Events Attended" type="number" min={0} value={form.events_attended} onChange={(e) => setForm({ ...form, events_attended: e.target.value })} />
          </div>
          <TextArea label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} placeholder="Optional notes about this period" />
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={() => setModalOpen(false)} className="btn-outline" disabled={saving}>Cancel</button>
          <button onClick={handleSave} className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Record'}</button>
        </div>
      </Modal>
    </div>
  );
}
