import { useEffect, useState } from 'react';
import {
  PageTitle,
  Badge,
  Modal,
  ConfirmDelete,
  Table,
  TableRow,
  TableCell,
  Input,
  Select,
  formatDate,
} from '../../components/admin/AdminUI';
import { LoadingState, ErrorState, EmptyState } from '../../components/States';
import {
  getExecutives,
  createExecutive,
  updateExecutive,
  deleteExecutive,
  getAllMembers,
} from '../../lib/adminApi';

interface Member {
  id: string;
  full_name: string;
  email?: string;
}

interface Executive {
  id: string;
  member_id: string;
  position: string;
  term_start: string;
  term_end?: string | null;
  is_active: boolean;
  member: Member | null;
}

const emptyForm = { member_id: '', position: '', term_start: '', term_end: '', is_active: true };

export default function ExecutiveManagement() {
  const [executives, setExecutives] = useState<Executive[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<'add' | 'edit' | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Executive | null>(null);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const [execs, mems] = await Promise.all([getExecutives(), getAllMembers()]);
      setExecutives(execs as Executive[]);
      setMembers(mems as Member[]);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load executives');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    (async () => {
      await refresh();
    })();
  }, []);

  function openAdd() {
    setModalMode('add');
    setEditId(null);
    setForm(emptyForm);
  }

  function openEdit(ex: Executive) {
    setModalMode('edit');
    setEditId(ex.id);
    setForm({
      member_id: ex.member_id,
      position: ex.position ?? '',
      term_start: ex.term_start ? ex.term_start.slice(0, 10) : '',
      term_end: ex.term_end ? ex.term_end.slice(0, 10) : '',
      is_active: ex.is_active,
    });
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload = {
        member_id: form.member_id,
        position: form.position,
        term_start: form.term_start,
        term_end: form.term_end || null,
        is_active: form.is_active,
      };
      if (modalMode === 'add') {
        await createExecutive(payload);
      } else if (modalMode === 'edit' && editId) {
        await updateExecutive(editId, payload);
      }
      setModalMode(null);
      await refresh();
    } catch (e: any) {
      setError(e.message ?? 'Failed to save executive');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteExecutive(deleteTarget.id);
      setDeleteTarget(null);
      await refresh();
    } catch (e: any) {
      setError(e.message ?? 'Failed to delete executive');
    }
  }

  return (
    <div>
      <PageTitle
        title="Executive Committee"
        subtitle="Manage executive committee members and terms"
        action={
          <div className="flex gap-2">
            <button onClick={refresh} className="btn-outline">Refresh</button>
            <button onClick={openAdd} className="btn">Add Executive</button>
          </div>
        }
      />

      {loading ? (
        <LoadingState message="Loading executives..." />
      ) : error ? (
        <ErrorState message={error} onRetry={refresh} />
      ) : executives.length === 0 ? (
        <EmptyState title="No executives found" message="Add an executive to get started." />
      ) : (
        <Table headers={['Member', 'Position', 'Term Start', 'Term End', 'Status', 'Actions']}>
          {executives.map((ex) => (
            <TableRow key={ex.id}>
              <TableCell className="font-medium text-slate-900 dark:text-white">
                {ex.member?.full_name ?? 'Unknown'}
              </TableCell>
              <TableCell>{ex.position}</TableCell>
              <TableCell>{formatDate(ex.term_start)}</TableCell>
              <TableCell>{formatDate(ex.term_end)}</TableCell>
              <TableCell>
                <Badge status={ex.is_active ? 'active' : 'closed'} />
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(ex)} className="btn-outline text-sm">Edit</button>
                  <button
                    onClick={() => setDeleteTarget(ex)}
                    className="btn-outline text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                  >
                    Delete
                  </button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </Table>
      )}

      <Modal
        open={!!modalMode}
        onClose={() => setModalMode(null)}
        title={modalMode === 'add' ? 'Add Executive' : 'Edit Executive'}
      >
        <div className="space-y-4">
          <Select
            label="Member"
            value={form.member_id}
            onChange={(e) => setForm({ ...form, member_id: e.target.value })}
          >
            <option value="">Select a member...</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.full_name}</option>
            ))}
          </Select>
          <Input
            label="Position"
            value={form.position}
            onChange={(e) => setForm({ ...form, position: e.target.value })}
            placeholder="e.g. President, Vice President"
          />
          <Input
            label="Term Start"
            type="date"
            value={form.term_start}
            onChange={(e) => setForm({ ...form, term_start: e.target.value })}
          />
          <Input
            label="Term End"
            type="date"
            value={form.term_end}
            onChange={(e) => setForm({ ...form, term_end: e.target.value })}
          />
          <Select
            label="Status"
            value={form.is_active ? 'active' : 'inactive'}
            onChange={(e) => setForm({ ...form, is_active: e.target.value === 'active' })}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
        </div>
        <div className="flex gap-3 justify-end mt-6">
          <button onClick={() => setModalMode(null)} className="btn-outline">Cancel</button>
          <button onClick={handleSave} disabled={saving || !form.member_id || !form.position} className="btn">
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </Modal>

      <ConfirmDelete
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        itemName={deleteTarget ? `${deleteTarget.position} (${deleteTarget.member?.full_name ?? ''})` : ''}
      />
    </div>
  );
}
