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
  formatDateTime,
  usePagination,
  Pagination,
} from '../../components/admin/AdminUI';
import { LoadingState, ErrorState, EmptyState } from '../../components/States';
import {
  getResourceBookings,
  createResourceBooking,
  updateResourceBooking,
  deleteResourceBooking,
  getInventory,
  getAllMembers,
} from '../../lib/adminApi';

interface Booking {
  id: string;
  item_id: string;
  member_id: string;
  purpose: string | null;
  start_at: string | null;
  end_at: string | null;
  status: string;
  item: { id: string; name: string } | null;
  member: { id: string; full_name: string } | null;
}

interface InventoryItem {
  id: string;
  name: string;
}

interface Member {
  id: string;
  full_name: string;
}

const emptyForm = {
  item_id: '',
  member_id: '',
  purpose: '',
  start_at: '',
  end_at: '',
};

export default function ResourceBooking() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Booking | null>(null);
  const [deleting, setDeleting] = useState(false);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const [data, inv, mem] = await Promise.all([
        getResourceBookings(),
        getInventory(),
        getAllMembers(),
      ]);
      setBookings(data as Booking[]);
      setInventory(inv as InventoryItem[]);
      setMembers(mem as Member[]);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load resource bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      await refresh();
    })();
  }, []);

  const [formError, setFormError] = useState<string | null>(null);

  const openAdd = () => {
    setForm({ ...emptyForm });
    setFormError(null);
    setModalOpen(true);
  };

  const handleSave = async () => {
    setFormError(null);
    if (!form.item_id || !form.member_id) {
      setFormError('Please select both an item and a member.');
      return;
    }
    if (!form.start_at || !form.end_at) {
      setFormError('Please set both a start and end time.');
      return;
    }
    if (new Date(form.end_at) <= new Date(form.start_at)) {
      setFormError('End time must be after the start time.');
      return;
    }
    setSaving(true);
    try {
      const payload: Record<string, any> = {
        item_id: form.item_id,
        member_id: form.member_id,
        purpose: form.purpose || null,
        start_at: new Date(form.start_at).toISOString(),
        end_at: new Date(form.end_at).toISOString(),
        status: 'pending',
      };
      await createResourceBooking(payload);
      setModalOpen(false);
      await refresh();
    } catch (e: any) {
      setFormError(e.message ?? 'Failed to create booking');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    setUpdatingId(id);
    try {
      await updateResourceBooking(id, { status });
      await refresh();
    } catch (e: any) {
      setError(e.message ?? 'Failed to update booking');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteResourceBooking(deleteTarget.id);
      setDeleteTarget(null);
      await refresh();
    } catch (e: any) {
      setError(e.message ?? 'Failed to delete booking');
    } finally {
      setDeleting(false);
    }
  };

  const filtered = bookings.filter(
    (b) => statusFilter === 'all' || b.status === statusFilter
  );
  const { page, setPage, totalPages, paged, pageSize, totalItems } = usePagination(filtered, 10);

  const total = bookings.length;
  const pending = bookings.filter((b) => b.status === 'pending').length;
  const approved = bookings.filter((b) => b.status === 'approved').length;

  return (
    <div>
      <PageTitle
        title="Resource Bookings"
        subtitle="Manage inventory item reservations"
        action={
          <button onClick={openAdd} className="btn btn-primary">
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              New Booking
            </span>
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard label="Total Bookings" value={total} icon="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" color="primary" />
        <StatCard label="Pending" value={pending} icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" color="amber" />
        <StatCard label="Approved" value={approved} icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" color="green" />
      </div>

      <div className="mb-4 w-full sm:w-56">
        <Select label="Filter by status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </Select>
      </div>

      {loading ? (
        <LoadingState message="Loading bookings..." />
      ) : error ? (
        <ErrorState message={error} onRetry={refresh} />
      ) : filtered.length === 0 ? (
        <EmptyState title="No bookings" message="Create a booking to reserve an inventory item." />
      ) : (
        <>
        <Table headers={['Item', 'Member', 'Purpose', 'Start', 'End', 'Status', 'Actions']}>
          {paged.map((b) => (
            <TableRow key={b.id}>
              <TableCell className="font-medium text-slate-900 dark:text-white">{b.item?.name ?? '—'}</TableCell>
              <TableCell>{b.member?.full_name ?? '—'}</TableCell>
              <TableCell>{b.purpose ?? '—'}</TableCell>
              <TableCell>{formatDateTime(b.start_at)}</TableCell>
              <TableCell>{formatDateTime(b.end_at)}</TableCell>
              <TableCell><Badge status={b.status} /></TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {b.status === 'pending' ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleStatusUpdate(b.id, 'approved')}
                        disabled={updatingId === b.id}
                        className="text-green-600 hover:text-green-700 text-sm font-medium disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(b.id, 'rejected')}
                        disabled={updatingId === b.id}
                        className="text-red-600 hover:text-red-700 text-sm font-medium disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  ) : (
                    <span className="text-sm text-slate-400">—</span>
                  )}
                  <button
                    onClick={() => setDeleteTarget(b)}
                    className="text-slate-400 hover:text-red-600 text-sm font-medium"
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Booking">
        <div className="space-y-4">
          {formError && (
            <p className="text-sm text-red-600 dark:text-red-400">{formError}</p>
          )}
          <Select label="Item" value={form.item_id} onChange={(e) => setForm({ ...form, item_id: e.target.value })}>
            <option value="">Select an item</option>
            {inventory.map((i) => (
              <option key={i.id} value={i.id}>{i.name}</option>
            ))}
          </Select>
          <Select label="Member" value={form.member_id} onChange={(e) => setForm({ ...form, member_id: e.target.value })}>
            <option value="">Select a member</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.full_name}</option>
            ))}
          </Select>
          <TextArea label="Purpose" value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} rows={3} placeholder="Reason for booking" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Start" type="datetime-local" value={form.start_at} onChange={(e) => setForm({ ...form, start_at: e.target.value })} />
            <Input label="End" type="datetime-local" value={form.end_at} onChange={(e) => setForm({ ...form, end_at: e.target.value })} />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button onClick={() => setModalOpen(false)} className="btn-outline">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn btn-primary">{saving ? 'Saving...' : 'Create Booking'}</button>
          </div>
        </div>
      </Modal>

      <ConfirmDelete
        open={!!deleteTarget}
        onClose={() => !deleting && setDeleteTarget(null)}
        onConfirm={handleDelete}
        itemName={deleteTarget ? `the booking for "${deleteTarget.item?.name ?? 'this item'}"` : ''}
      />
    </div>
  );
}