import { useEffect, useState } from 'react';
import {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getAllMembers,
} from '../../lib/adminApi';
import {
  PageTitle,
  StatCard,
  Modal,
  ConfirmDelete,
  Input,
  TextArea,
  Select,
  formatDate,
} from '../../components/admin/AdminUI';
import { LoadingState, ErrorState, EmptyState } from '../../components/States';

interface Member {
  id: string;
  full_name: string;
}

interface Department {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  head_member_id: string | null;
  head: { id: string; full_name: string } | null;
  members: { member_id: string }[];
  created_at: string;
}

interface FormState {
  name: string;
  slug: string;
  description: string;
  head_member_id: string;
}

const emptyForm: FormState = { name: '', slug: '', description: '', head_member_id: '' };

export default function Departments() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Department | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [deps, mems] = await Promise.all([getDepartments(), getAllMembers()]);
      setDepartments(deps as Department[]);
      setMembers(mems as Member[]);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load departments');
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
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (d: Department) => {
    setEditing(d);
    setForm({
      name: d.name,
      slug: d.slug,
      description: d.description ?? '',
      head_member_id: d.head_member_id ?? '',
    });
    setFormError(null);
    setModalOpen(true);
  };

  const handleSave = async () => {
    setFormError(null);
    if (!form.name.trim()) {
      setFormError('Please enter a department name.');
      return;
    }
    const slug = (form.slug || form.name)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    if (!slug) {
      setFormError('Please enter a name or a slug.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        slug,
        description: form.description || null,
        head_member_id: form.head_member_id || null,
      };
      if (editing) {
        await updateDepartment(editing.id, payload);
      } else {
        await createDepartment(payload);
      }
      setModalOpen(false);
      await load();
    } catch (e: any) {
      setFormError(e.message ?? 'Failed to save department');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteDepartment(deleteTarget.id);
      setDeleteTarget(null);
      await load();
    } catch (e: any) {
      setError(e.message ?? 'Failed to delete department');
    }
  };

  const totalMembers = departments.reduce((sum, d) => sum + (d.members?.length ?? 0), 0);

  return (
    <div>
      <PageTitle
        title="Departments"
        subtitle="Organize your club into departments"
        action={
          <button onClick={openAdd} className="btn btn-primary">
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add Department
            </span>
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard label="Total Departments" value={departments.length} icon="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
        <StatCard label="Total Members in Departments" value={totalMembers} icon="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4z" color="green" />
        <StatCard label="With Assigned Head" value={departments.filter((d) => d.head).length} icon="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" color="blue" />
      </div>

      {loading && <LoadingState message="Loading departments..." />}
      {error && !loading && <ErrorState message={error} onRetry={load} />}
      {!loading && !error && departments.length === 0 && (
        <EmptyState title="No departments yet" message="Create your first department to get started." />
      )}
      {!loading && !error && departments.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((d) => (
            <div key={d.id} className="card p-5 flex flex-col">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-display font-bold text-slate-900 dark:text-white">{d.name}</h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">/{d.slug}</p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEdit(d)}
                    className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-primary-600"
                    aria-label="Edit"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setDeleteTarget(d)}
                    className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600"
                    aria-label="Delete"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 flex-1 line-clamp-3 min-h-[3rem]">
                {d.description || 'No description provided.'}
              </p>
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Head</span>
                  <span className="font-medium text-slate-900 dark:text-white">{d.head?.full_name ?? '—'}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Members</span>
                  <span className="font-medium text-slate-900 dark:text-white">{d.members?.length ?? 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Created</span>
                  <span className="font-medium text-slate-900 dark:text-white">{formatDate(d.created_at)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Department' : 'Add Department'}>
        <div className="space-y-4">
          {formError && (
            <p className="text-sm text-red-600 dark:text-red-400">{formError}</p>
          )}
          <Input
            label="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Marketing"
          />
          <Input
            label="Slug"
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
            placeholder="e.g. marketing"
          />
          <TextArea
            label="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
            placeholder="What does this department do?"
          />
          <Select
            label="Department Head"
            value={form.head_member_id}
            onChange={(e) => setForm({ ...form, head_member_id: e.target.value })}
          >
            <option value="">— None —</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.full_name}
              </option>
            ))}
          </Select>
          <div className="flex gap-3 justify-end pt-2">
            <button onClick={() => setModalOpen(false)} className="btn-outline">
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving || !form.name || !form.slug} className="btn btn-primary">
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDelete
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        itemName={deleteTarget?.name ?? ''}
      />
    </div>
  );
}