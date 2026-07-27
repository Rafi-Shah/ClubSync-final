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
  TextArea,
  formatDate,
  usePagination,
  Pagination,
} from '../../components/admin/AdminUI';
import { LoadingState, ErrorState, EmptyState } from '../../components/States';
import { getAllMembers, updateMember, deleteMember, updateMemberEmail } from '../../lib/adminApi';

interface Member {
  id: string;
  full_name: string;
  email: string;
  phone?: string | null;
  status: string;
  joined_at?: string | null;
  bio?: string | null;
}

const emptyForm = { full_name: '', email: '', phone: '', status: 'active', bio: '' };

export default function MemberManagement() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editMember, setEditMember] = useState<Member | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Member | null>(null);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllMembers();
      setMembers(data as Member[]);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load members');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    (async () => {
      await refresh();
    })();
  }, []);

  const filtered = members.filter((m) => {
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q || m.full_name?.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const { page, setPage, totalPages, paged, pageSize, totalItems } = usePagination(filtered, 10);

  function openEdit(m: Member) {
    setEditMember(m);
    setForm({
      full_name: m.full_name ?? '',
      email: m.email ?? '',
      phone: m.phone ?? '',
      status: m.status ?? 'active',
      bio: m.bio ?? '',
    });
  }

  async function handleSave() {
    if (!editMember) return;
    setSaving(true);
    try {
      // Email changed → update the login (auth) email and members.email
      // together via the Edge Function first, so the two never fall out of
      // sync (this is what previously let the directory show a new email
      // while login still required the old one).
      if (form.email !== editMember.email) {
        await updateMemberEmail(editMember.id, form.email);
      }
      // All other fields go through the normal update. Email is omitted
      // here since it was already handled above (or unchanged).
      await updateMember(editMember.id, {
        full_name: form.full_name,
        phone: form.phone || null,
        status: form.status,
        bio: form.bio || null,
      });
      setEditMember(null);
      await refresh();
    } catch (e: any) {
      setError(e.message ?? 'Failed to update member');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteMember(deleteTarget.id);
      setDeleteTarget(null);
      await refresh();
    } catch (e: any) {
      setError(e.message ?? 'Failed to delete member');
    }
  }

  return (
    <div>
      <PageTitle
        title="Member Management"
        subtitle="View and manage club members"
        action={
          <button onClick={refresh} className="btn-outline">
            Refresh
          </button>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <Input
          label="Search"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </Select>
      </div>

      {loading ? (
        <LoadingState message="Loading members..." />
      ) : error ? (
        <ErrorState message={error} onRetry={refresh} />
      ) : filtered.length === 0 ? (
        <EmptyState title="No members found" message="Try adjusting your search or filters." />
      ) : (
        <>
        <Table headers={['Name', 'Email', 'Phone', 'Status', 'Joined', 'Actions']}>
          {paged.map((m) => (
            <TableRow key={m.id}>
              <TableCell className="font-medium text-slate-900 dark:text-white">{m.full_name}</TableCell>
              <TableCell>{m.email}</TableCell>
              <TableCell>{m.phone || '—'}</TableCell>
              <TableCell><Badge status={m.status} /></TableCell>
              <TableCell>{formatDate(m.joined_at)}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(m)} className="btn-outline text-sm">Edit</button>
                  <button
                    onClick={() => setDeleteTarget(m)}
                    className="btn-outline text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                  >
                    Delete
                  </button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </Table>
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} totalItems={totalItems} pageSize={pageSize} />
        </>
      )}

      <Modal open={!!editMember} onClose={() => setEditMember(null)} title="Edit Member">
        <div className="space-y-4">
          <Input
            label="Full Name"
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
          />
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <Input
            label="Phone"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <Select
            label="Status"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
          >
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </Select>
          <TextArea
            label="Bio"
            rows={3}
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
          />
        </div>
        <div className="flex gap-3 justify-end mt-6">
          <button onClick={() => setEditMember(null)} className="btn-outline">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </Modal>

      <ConfirmDelete
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        itemName={deleteTarget?.full_name ?? ''}
      />
    </div>
  );
}