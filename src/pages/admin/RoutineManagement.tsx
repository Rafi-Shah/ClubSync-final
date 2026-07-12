import { useEffect, useState } from 'react';
import {
  getAllRoutines,
  createRoutine,
  updateRoutine,
  deleteRoutine,
  getAllMembers,
} from '../../lib/adminApi';
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
  TextArea,
  Select,
} from '../../components/admin/AdminUI';
import { LoadingState, ErrorState, EmptyState } from '../../components/States';

interface Member {
  id: string;
  full_name: string;
}

interface Routine {
  id: string;
  member_id: string;
  member: { id: string; full_name: string } | null;
  title: string;
  description: string | null;
  day_of_week: number;
  start_time: string;
  end_time: string;
  location: string | null;
  is_active: boolean;
}

interface FormState {
  member_id: string;
  title: string;
  description: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  location: string;
  is_active: boolean;
}

const emptyForm: FormState = {
  member_id: '',
  title: '',
  description: '',
  day_of_week: '0',
  start_time: '',
  end_time: '',
  location: '',
  is_active: true,
};

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function RoutineManagement() {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Routine | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Routine | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [r, mems] = await Promise.all([getAllRoutines(), getAllMembers()]);
      setRoutines(r as Routine[]);
      setMembers(mems as Member[]);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load routines');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      await load();
    })();
  }, []);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (r: Routine) => {
    setEditing(r);
    setForm({
      member_id: r.member_id ?? '',
      title: r.title,
      description: r.description ?? '',
      day_of_week: String(r.day_of_week),
      start_time: r.start_time ?? '',
      end_time: r.end_time ?? '',
      location: r.location ?? '',
      is_active: r.is_active,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        member_id: form.member_id || null,
        title: form.title,
        description: form.description || null,
        day_of_week: parseInt(form.day_of_week, 10),
        start_time: form.start_time || null,
        end_time: form.end_time || null,
        location: form.location || null,
        is_active: form.is_active,
      };
      if (editing) {
        await updateRoutine(editing.id, payload);
      } else {
        await createRoutine(payload);
      }
      setModalOpen(false);
      await load();
    } catch (e: any) {
      setError(e.message ?? 'Failed to save routine');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteRoutine(deleteTarget.id);
      setDeleteTarget(null);
      await load();
    } catch (e: any) {
      setError(e.message ?? 'Failed to delete routine');
    }
  };

  return (
    <div>
      <PageTitle
        title="Routine Management"
        subtitle="Manage weekly routines and schedules for members"
        action={
          <button onClick={openAdd} className="btn btn-primary">
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add Routine
            </span>
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard label="Total Routines" value={routines.length} icon="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        <StatCard label="Active" value={routines.filter((r) => r.is_active).length} icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" color="green" />
        <StatCard label="Inactive" value={routines.filter((r) => !r.is_active).length} icon="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" color="amber" />
      </div>

      {loading && <LoadingState message="Loading routines..." />}
      {error && !loading && <ErrorState message={error} onRetry={load} />}
      {!loading && !error && routines.length === 0 && (
        <EmptyState title="No routines yet" message="Create your first routine to get started." />
      )}
      {!loading && !error && routines.length > 0 && (
        <Table headers={['Member', 'Title', 'Day', 'Start', 'End', 'Location', 'Status', '']}>
          {routines.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="font-medium text-slate-900 dark:text-white">
                {r.member?.full_name ?? '—'}
              </TableCell>
              <TableCell>{r.title}</TableCell>
              <TableCell>{DAYS[r.day_of_week] ?? '—'}</TableCell>
              <TableCell>{r.start_time ?? '—'}</TableCell>
              <TableCell>{r.end_time ?? '—'}</TableCell>
              <TableCell>{r.location ?? '—'}</TableCell>
              <TableCell>
                <Badge status={r.is_active ? 'active' : 'suspended'} />
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEdit(r)}
                    className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-primary-600"
                    aria-label="Edit"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setDeleteTarget(r)}
                    className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600"
                    aria-label="Delete"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </Table>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Routine' : 'Add Routine'}>
        <div className="space-y-4">
          <Select label="Member" value={form.member_id} onChange={(e) => setForm({ ...form, member_id: e.target.value })}>
            <option value="">— Select member —</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.full_name}
              </option>
            ))}
          </Select>
          <Input
            label="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g. Morning Practice"
          />
          <TextArea
            label="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={2}
            placeholder="Optional details"
          />
          <Select
            label="Day of Week"
            value={form.day_of_week}
            onChange={(e) => setForm({ ...form, day_of_week: e.target.value })}
          >
            {DAYS.map((d, i) => (
              <option key={i} value={i}>
                {d}
              </option>
            ))}
          </Select>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Start Time"
              type="time"
              value={form.start_time}
              onChange={(e) => setForm({ ...form, start_time: e.target.value })}
            />
            <Input
              label="End Time"
              type="time"
              value={form.end_time}
              onChange={(e) => setForm({ ...form, end_time: e.target.value })}
            />
          </div>
          <Input
            label="Location"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            placeholder="e.g. Room 101"
          />
          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
            />
            Active
          </label>
          <div className="flex gap-3 justify-end pt-2">
            <button onClick={() => setModalOpen(false)} className="btn-outline">
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving || !form.title || !form.member_id} className="btn btn-primary">
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDelete
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        itemName={deleteTarget?.title ?? ''}
      />
    </div>
  );
}
