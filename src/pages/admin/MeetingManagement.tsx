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
  Input,
  Select,
  TextArea,
  formatDateTime,
} from '../../components/admin/AdminUI';
import { LoadingState, ErrorState, EmptyState } from '../../components/States';
import {
  getMeetings,
  createMeeting,
  updateMeeting,
  deleteMeeting,
  getAllMembers,
} from '../../lib/adminApi';

interface Member {
  id: string;
  full_name: string;
}

interface Meeting {
  id: string;
  title: string;
  agenda: string | null;
  location: string | null;
  start_at: string | null;
  end_at: string | null;
  meeting_type: string;
  status: string;
  organized_by_member_id: string | null;
  organizer: { id: string; full_name: string } | null;
}

const emptyForm = {
  title: '',
  agenda: '',
  location: '',
  start_at: '',
  end_at: '',
  meeting_type: 'general',
  status: 'scheduled',
  organized_by_member_id: '',
};

export default function MeetingManagement() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Meeting | null>(null);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const [m, mem] = await Promise.all([getMeetings(), getAllMembers()]);
      setMeetings(m as Meeting[]);
      setMembers(mem as Member[]);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load meetings');
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
    setEditingId(null);
    setForm({ ...emptyForm });
    setModalOpen(true);
  };

  const openEdit = (m: Meeting) => {
    setEditingId(m.id);
    setForm({
      title: m.title ?? '',
      agenda: m.agenda ?? '',
      location: m.location ?? '',
      start_at: m.start_at ? new Date(m.start_at).toISOString().slice(0, 16) : '',
      end_at: m.end_at ? new Date(m.end_at).toISOString().slice(0, 16) : '',
      meeting_type: m.meeting_type ?? 'general',
      status: m.status ?? 'scheduled',
      organized_by_member_id: m.organized_by_member_id ?? '',
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: Record<string, any> = {
        title: form.title,
        agenda: form.agenda || null,
        location: form.location || null,
        start_at: form.start_at ? new Date(form.start_at).toISOString() : null,
        end_at: form.end_at ? new Date(form.end_at).toISOString() : null,
        meeting_type: form.meeting_type,
        status: form.status,
        organized_by_member_id: form.organized_by_member_id || null,
      };
      if (editingId) {
        await updateMeeting(editingId, payload);
      } else {
        await createMeeting(payload);
      }
      setModalOpen(false);
      await refresh();
    } catch (e: any) {
      setError(e.message ?? 'Failed to save meeting');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMeeting(deleteTarget.id);
      setDeleteTarget(null);
      await refresh();
    } catch (e: any) {
      setError(e.message ?? 'Failed to delete meeting');
    }
  };

  const filtered = meetings.filter((m) => statusFilter === 'all' || m.status === statusFilter);

  const counts = {
    scheduled: meetings.filter((m) => m.status === 'scheduled').length,
    completed: meetings.filter((m) => m.status === 'completed').length,
    cancelled: meetings.filter((m) => m.status === 'cancelled').length,
  };

  return (
    <div>
      <PageTitle
        title="Meeting Management"
        subtitle="Schedule and track club meetings"
        action={
          <button onClick={openAdd} className="btn btn-primary">
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add Meeting
            </span>
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard label="Scheduled" value={counts.scheduled} icon="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" color="blue" />
        <StatCard label="Completed" value={counts.completed} icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" color="green" />
        <StatCard label="Cancelled" value={counts.cancelled} icon="M6 18L18 6M6 6l12 12" color="red" />
      </div>

      <div className="mb-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="w-full sm:w-56">
          <Select label="Filter by status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All statuses</option>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </Select>
        </div>
      </div>

      {loading ? (
        <LoadingState message="Loading meetings..." />
      ) : error ? (
        <ErrorState message={error} onRetry={refresh} />
      ) : filtered.length === 0 ? (
        <EmptyState title="No meetings found" message="Create a new meeting to get started." />
      ) : (
        <Table headers={['Title', 'Organizer', 'Type', 'Start Time', 'Status', 'Actions']}>
          {filtered.map((m) => (
            <TableRow key={m.id}>
              <TableCell className="font-medium text-slate-900 dark:text-white">{m.title}</TableCell>
              <TableCell>{m.organizer?.full_name ?? '—'}</TableCell>
              <TableCell className="capitalize">{m.meeting_type}</TableCell>
              <TableCell>{formatDateTime(m.start_at)}</TableCell>
              <TableCell><Badge status={m.status} /></TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(m)} className="text-primary-600 hover:text-primary-700 text-sm font-medium">Edit</button>
                  <button onClick={() => setDeleteTarget(m)} className="text-red-600 hover:text-red-700 text-sm font-medium">Delete</button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </Table>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit Meeting' : 'Add Meeting'}>
        <div className="space-y-4">
          <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Meeting title" />
          <TextArea label="Agenda" value={form.agenda} onChange={(e) => setForm({ ...form, agenda: e.target.value })} rows={3} placeholder="Agenda items" />
          <Input label="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Location" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Start" type="datetime-local" value={form.start_at} onChange={(e) => setForm({ ...form, start_at: e.target.value })} />
            <Input label="End" type="datetime-local" value={form.end_at} onChange={(e) => setForm({ ...form, end_at: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select label="Type" value={form.meeting_type} onChange={(e) => setForm({ ...form, meeting_type: e.target.value })}>
              <option value="general">General</option>
              <option value="emergency">Emergency</option>
              <option value="board">Board</option>
              <option value="committee">Committee</option>
            </Select>
            <Select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </Select>
          </div>
          <Select label="Organizer" value={form.organized_by_member_id} onChange={(e) => setForm({ ...form, organized_by_member_id: e.target.value })}>
            <option value="">— Select organizer —</option>
            {members.map((mem) => (
              <option key={mem.id} value={mem.id}>{mem.full_name}</option>
            ))}
          </Select>
          <div className="flex gap-3 justify-end pt-2">
            <button onClick={() => setModalOpen(false)} className="btn-outline">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn btn-primary">{saving ? 'Saving...' : 'Save'}</button>
          </div>
        </div>
      </Modal>

      <ConfirmDelete
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        itemName={deleteTarget?.title ?? 'this meeting'}
      />
    </div>
  );
}
