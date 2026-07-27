import { useEffect, useState } from 'react';
import {
  PageTitle,
  StatCard,
  Badge,
  Modal,
  Table,
  TableRow,
  TableCell,
  Select,
  TextArea,
  formatDateTime,
  usePagination,
  Pagination,
} from '../../components/admin/AdminUI';
import { LoadingState, ErrorState, EmptyState } from '../../components/States';
import {
  getAllAttendance,
  createAttendance,
  updateAttendance,
  getAllMembers,
  getEvents,
  getMeetings,
} from '../../lib/adminApi';

interface Member { id: string; full_name: string; }
interface EventItem { id: string; title: string; }
interface MeetingItem { id: string; title: string; }

interface Attendance {
  id: string;
  member_id: string;
  event_id: string | null;
  meeting_id: string | null;
  status: string;
  notes: string | null;
  recorded_at: string | null;
  member: { id: string; full_name: string } | null;
  event: { id: string; title: string } | null;
  meeting: { id: string; title: string } | null;
}

const emptyForm = {
  member_id: '',
  event_id: '',
  meeting_id: '',
  status: 'present',
  notes: '',
};

export default function AttendanceAdmin() {
  const [records, setRecords] = useState<Attendance[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [meetings, setMeetings] = useState<MeetingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');

  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [editTarget, setEditTarget] = useState<Attendance | null>(null);
  const [editStatus, setEditStatus] = useState('present');
  const [editNotes, setEditNotes] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const [a, m, ev, mt] = await Promise.all([
        getAllAttendance(),
        getAllMembers(),
        getEvents(),
        getMeetings(),
      ]);
      setRecords(a as Attendance[]);
      setMembers(m as Member[]);
      setEvents(ev as EventItem[]);
      setMeetings(mt as MeetingItem[]);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load attendance');
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
    setAddOpen(true);
  };

  const handleAdd = async () => {
    setFormError(null);
    if (!form.member_id) {
      setFormError('Please select a member.');
      return;
    }
    setSaving(true);
    try {
      await createAttendance({
        member_id: form.member_id,
        event_id: form.event_id || null,
        meeting_id: form.meeting_id || null,
        status: form.status,
        notes: form.notes || null,
      });
      setAddOpen(false);
      await refresh();
    } catch (e: any) {
      setFormError(e.message ?? 'Failed to create attendance record');
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (a: Attendance) => {
    setEditTarget(a);
    setEditStatus(a.status);
    setEditNotes(a.notes ?? '');
  };

  const handleEditSave = async () => {
    if (!editTarget) return;
    setEditSaving(true);
    try {
      await updateAttendance(editTarget.id, { status: editStatus, notes: editNotes || null });
      setEditTarget(null);
      await refresh();
    } catch (e: any) {
      setError(e.message ?? 'Failed to update attendance');
    } finally {
      setEditSaving(false);
    }
  };

  const filtered = records.filter((a) => statusFilter === 'all' || a.status === statusFilter);
  const { page, setPage, totalPages, paged, pageSize, totalItems } = usePagination(filtered, 15);

  const counts = {
    present: records.filter((a) => a.status === 'present').length,
    absent: records.filter((a) => a.status === 'absent').length,
    late: records.filter((a) => a.status === 'late').length,
    excused: records.filter((a) => a.status === 'excused').length,
  };

  const refTitle = (a: Attendance) => a.event?.title ?? a.meeting?.title ?? '—';

  return (
    <div>
      <PageTitle
        title="Attendance"
        subtitle="Track member attendance at events and meetings"
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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Present" value={counts.present} icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" color="green" />
        <StatCard label="Absent" value={counts.absent} icon="M6 18L18 6M6 6l12 12" color="red" />
        <StatCard label="Late" value={counts.late} icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" color="amber" />
        <StatCard label="Excused" value={counts.excused} icon="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" color="blue" />
      </div>

      <div className="mb-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="w-full sm:w-56">
          <Select label="Filter by status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All statuses</option>
            <option value="present">Present</option>
            <option value="absent">Absent</option>
            <option value="late">Late</option>
            <option value="excused">Excused</option>
          </Select>
        </div>
      </div>

      {loading ? (
        <LoadingState message="Loading attendance..." />
      ) : error ? (
        <ErrorState message={error} onRetry={refresh} />
      ) : filtered.length === 0 ? (
        <EmptyState title="No attendance records" message="Add a record to start tracking attendance." />
      ) : (
        <>
        <Table headers={['Member', 'Event / Meeting', 'Status', 'Recorded', 'Actions']}>
          {paged.map((a) => (
            <TableRow key={a.id}>
              <TableCell className="font-medium text-slate-900 dark:text-white">{a.member?.full_name ?? '—'}</TableCell>
              <TableCell>{refTitle(a)}</TableCell>
              <TableCell><Badge status={a.status} /></TableCell>
              <TableCell>{formatDateTime(a.recorded_at)}</TableCell>
              <TableCell>
                <button onClick={() => openEdit(a)} className="text-primary-600 hover:text-primary-700 text-sm font-medium">Edit</button>
              </TableCell>
            </TableRow>
          ))}
        </Table>
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} totalItems={totalItems} pageSize={pageSize} />
        </>
      )}

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Attendance Record">
        <div className="space-y-4">
          {formError && (
            <p className="text-sm text-red-600 dark:text-red-400">{formError}</p>
          )}
          <Select label="Member" value={form.member_id} onChange={(e) => setForm({ ...form, member_id: e.target.value })}>
            <option value="">— Select member —</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.full_name}</option>
            ))}
          </Select>
          <Select label="Event (optional)" value={form.event_id} onChange={(e) => setForm({ ...form, event_id: e.target.value })}>
            <option value="">— None —</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>{ev.title}</option>
            ))}
          </Select>
          <Select label="Meeting (optional)" value={form.meeting_id} onChange={(e) => setForm({ ...form, meeting_id: e.target.value })}>
            <option value="">— None —</option>
            {meetings.map((mt) => (
              <option key={mt.id} value={mt.id}>{mt.title}</option>
            ))}
          </Select>
          <Select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="present">Present</option>
            <option value="absent">Absent</option>
            <option value="late">Late</option>
            <option value="excused">Excused</option>
          </Select>
          <TextArea label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} placeholder="Optional notes" />
          <div className="flex gap-3 justify-end pt-2">
            <button onClick={() => setAddOpen(false)} className="btn-outline">Cancel</button>
            <button onClick={handleAdd} disabled={saving} className="btn btn-primary">{saving ? 'Saving...' : 'Save'}</button>
          </div>
        </div>
      </Modal>

      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Edit Attendance">
        <div className="space-y-4">
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Member</p>
            <p className="font-medium text-slate-900 dark:text-white">{editTarget?.member?.full_name ?? '—'}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Event / Meeting</p>
            <p className="font-medium text-slate-900 dark:text-white">{editTarget ? refTitle(editTarget) : '—'}</p>
          </div>
          <Select label="Status" value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
            <option value="present">Present</option>
            <option value="absent">Absent</option>
            <option value="late">Late</option>
            <option value="excused">Excused</option>
          </Select>
          <TextArea label="Notes" value={editNotes} onChange={(e) => setEditNotes(e.target.value)} rows={3} placeholder="Optional notes" />
          <div className="flex gap-3 justify-end pt-2">
            <button onClick={() => setEditTarget(null)} className="btn-outline">Cancel</button>
            <button onClick={handleEditSave} disabled={editSaving} className="btn btn-primary">{editSaving ? 'Saving...' : 'Save'}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}