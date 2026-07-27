import { useEffect, useState, useMemo } from 'react';
import {
  getAllTasks,
  createTask,
  updateTask,
  deleteTask,
  getAllMembers,
  getEvents,
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
  formatDate,
  usePagination,
  Pagination,
} from '../../components/admin/AdminUI';
import { LoadingState, ErrorState, EmptyState } from '../../components/States';

interface Member {
  id: string;
  full_name: string;
}

interface Event {
  id: string;
  title: string;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  assigned_to_member_id: string | null;
  assigned_by_member_id: string | null;
  related_event_id: string | null;
  status: string;
  priority: string;
  due_at: string | null;
  assignee: { id: string; full_name: string } | null;
  assigner: { id: string; full_name: string } | null;
  event: { id: string; title: string } | null;
}

interface FormState {
  title: string;
  description: string;
  assigned_to_member_id: string;
  assigned_by_member_id: string;
  related_event_id: string;
  status: string;
  priority: string;
  due_at: string;
}

const emptyForm: FormState = {
  title: '',
  description: '',
  assigned_to_member_id: '',
  assigned_by_member_id: '',
  related_event_id: '',
  status: 'pending',
  priority: 'medium',
  due_at: '',
};

const STATUS_OPTIONS = ['pending', 'in_progress', 'completed'];
const PRIORITY_OPTIONS = ['low', 'medium', 'high', 'urgent'];

export default function TaskAssignment() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [t, mems, evs] = await Promise.all([getAllTasks(), getAllMembers(), getEvents()]);
      setTasks(t as Task[]);
      setMembers(mems as Member[]);
      setEvents(evs as Event[]);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      await load();
    })();
  }, []);

  const filteredTasks = useMemo(() => {
    if (statusFilter === 'all') return tasks;
    return tasks.filter((t) => t.status === statusFilter);
  }, [tasks, statusFilter]);

  const { page, setPage, totalPages, paged, pageSize, totalItems } = usePagination(filteredTasks, 10);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (t: Task) => {
    setEditing(t);
    setForm({
      title: t.title,
      description: t.description ?? '',
      assigned_to_member_id: t.assigned_to_member_id ?? '',
      assigned_by_member_id: t.assigned_by_member_id ?? '',
      related_event_id: t.related_event_id ?? '',
      status: t.status ?? 'pending',
      priority: t.priority ?? 'medium',
      due_at: t.due_at ? new Date(t.due_at).toISOString().slice(0, 16) : '',
    });
    setFormError(null);
    setModalOpen(true);
  };

  const handleSave = async () => {
    setFormError(null);
    if (!form.title.trim()) {
      setFormError('Please enter a title.');
      return;
    }
    if (!form.assigned_to_member_id) {
      setFormError('Please select who this task is assigned to.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        description: form.description || null,
        assigned_to_member_id: form.assigned_to_member_id,
        assigned_by_member_id: form.assigned_by_member_id || null,
        related_event_id: form.related_event_id || null,
        status: form.status,
        priority: form.priority,
        due_at: form.due_at ? new Date(form.due_at).toISOString() : null,
      };
      if (editing) {
        await updateTask(editing.id, payload);
      } else {
        await createTask(payload);
      }
      setModalOpen(false);
      await load();
    } catch (e: any) {
      setFormError(e.message ?? 'Failed to save task');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteTask(deleteTarget.id);
      setDeleteTarget(null);
      await load();
    } catch (e: any) {
      setError(e.message ?? 'Failed to delete task');
    }
  };

  return (
    <div>
      <PageTitle
        title="Task Assignment"
        subtitle="Assign and track tasks for members"
        action={
          <button onClick={openAdd} className="btn btn-primary">
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add Task
            </span>
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Tasks" value={tasks.length} icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        <StatCard label="Pending" value={tasks.filter((t) => t.status === 'pending').length} icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" color="amber" />
        <StatCard label="In Progress" value={tasks.filter((t) => t.status === 'in_progress').length} icon="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" color="blue" />
        <StatCard label="Completed" value={tasks.filter((t) => t.status === 'completed').length} icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" color="green" />
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-48">
          <Select
            label="Filter by status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, ' ')}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {loading && <LoadingState message="Loading tasks..." />}
      {error && !loading && <ErrorState message={error} onRetry={load} />}
      {!loading && !error && filteredTasks.length === 0 && (
        <EmptyState title="No tasks found" message={statusFilter === 'all' ? 'Create your first task to get started.' : 'No tasks match this filter.'} />
      )}
      {!loading && !error && filteredTasks.length > 0 && (
        <>
        <Table headers={['Title', 'Assignee', 'Assigner', 'Priority', 'Status', 'Due Date', '']}>
          {paged.map((t) => (
            <TableRow key={t.id}>
              <TableCell className="font-medium text-slate-900 dark:text-white">{t.title}</TableCell>
              <TableCell>{t.assignee?.full_name ?? '—'}</TableCell>
              <TableCell>{t.assigner?.full_name ?? '—'}</TableCell>
              <TableCell>
                <span
                  className={`badge ${
                    t.priority === 'urgent'
                      ? 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300'
                      : t.priority === 'high'
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300'
                        : t.priority === 'medium'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  {t.priority}
                </span>
              </TableCell>
              <TableCell>
                <Badge status={t.status} />
              </TableCell>
              <TableCell>{formatDate(t.due_at)}</TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEdit(t)}
                    className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-primary-600"
                    aria-label="Edit"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setDeleteTarget(t)}
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
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} totalItems={totalItems} pageSize={pageSize} />
        </>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Task' : 'Add Task'}>
        <div className="space-y-4">
          {formError && (
            <p className="text-sm text-red-600 dark:text-red-400">{formError}</p>
          )}
          <Input
            label="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g. Prepare event posters"
          />
          <TextArea
            label="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
            placeholder="Task details"
          />
          <Select
            label="Assign To"
            value={form.assigned_to_member_id}
            onChange={(e) => setForm({ ...form, assigned_to_member_id: e.target.value })}
          >
            <option value="">— None —</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.full_name}
              </option>
            ))}
          </Select>
          <Select
            label="Assigned By"
            value={form.assigned_by_member_id}
            onChange={(e) => setForm({ ...form, assigned_by_member_id: e.target.value })}
          >
            <option value="">— None —</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.full_name}
              </option>
            ))}
          </Select>
          <Select
            label="Related Event (optional)"
            value={form.related_event_id}
            onChange={(e) => setForm({ ...form, related_event_id: e.target.value })}
          >
            <option value="">— None —</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.title}
              </option>
            ))}
          </Select>
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Status"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s.replace(/_/g, ' ')}
                </option>
              ))}
            </Select>
            <Select
              label="Priority"
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
            >
              {PRIORITY_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </Select>
          </div>
          <Input
            label="Due Date"
            type="datetime-local"
            value={form.due_at}
            onChange={(e) => setForm({ ...form, due_at: e.target.value })}
          />
          <div className="flex gap-3 justify-end pt-2">
            <button onClick={() => setModalOpen(false)} className="btn-outline">
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving || !form.title} className="btn btn-primary">
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