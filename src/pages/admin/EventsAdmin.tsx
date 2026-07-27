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
  formatDate,
  formatDateTime,
  usePagination,
  Pagination,
} from '../../components/admin/AdminUI';
import { LoadingState, ErrorState, EmptyState } from '../../components/States';
import {
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  getAllMembers,
} from '../../lib/adminApi';

interface Member {
  id: string;
  full_name: string;
}

interface EventItem {
  id: string;
  title: string;
  slug: string | null;
  description: string | null;
  location: string | null;
  start_at: string | null;
  end_at: string | null;
  status: string;
  is_public: boolean;
  cover_image_url: string | null;
  organized_by_member_id: string | null;
  organizer: { id: string; full_name: string } | null;
}

const emptyForm = {
  title: '',
  slug: '',
  description: '',
  location: '',
  start_at: '',
  end_at: '',
  status: 'draft',
  is_public: false,
  cover_image_url: '',
  organized_by_member_id: '',
};

export default function EventsAdmin() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<EventItem | null>(null);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const [ev, mem] = await Promise.all([getEvents(), getAllMembers()]);
      setEvents(ev as EventItem[]);
      setMembers(mem as Member[]);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load events');
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
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (ev: EventItem) => {
    setEditingId(ev.id);
    setForm({
      title: ev.title ?? '',
      slug: ev.slug ?? '',
      description: ev.description ?? '',
      location: ev.location ?? '',
      start_at: ev.start_at ? new Date(ev.start_at).toISOString().slice(0, 16) : '',
      end_at: ev.end_at ? new Date(ev.end_at).toISOString().slice(0, 16) : '',
      status: ev.status ?? 'draft',
      is_public: !!ev.is_public,
      cover_image_url: ev.cover_image_url ?? '',
      organized_by_member_id: ev.organized_by_member_id ?? '',
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
    if (!form.start_at) {
      setFormError('Please set a start date/time.');
      return;
    }
    if (form.end_at && new Date(form.end_at) < new Date(form.start_at)) {
      setFormError('End time cannot be before the start time.');
      return;
    }
    // slug is NOT NULL + UNIQUE in the DB; auto-derive one from the title
    // rather than send an empty string, which would either violate the
    // constraint or collide with another event's empty slug.
    const slug = (form.slug || form.title)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    if (!slug) {
      setFormError('Please enter a title or a slug.');
      return;
    }
    setSaving(true);
    try {
      const payload: Record<string, any> = {
        title: form.title,
        slug,
        description: form.description || null,
        location: form.location || null,
        start_at: new Date(form.start_at).toISOString(),
        end_at: form.end_at ? new Date(form.end_at).toISOString() : null,
        status: form.status,
        is_public: form.is_public,
        cover_image_url: form.cover_image_url || null,
        organized_by_member_id: form.organized_by_member_id || null,
      };
      if (editingId) {
        await updateEvent(editingId, payload);
      } else {
        await createEvent(payload);
      }
      setModalOpen(false);
      await refresh();
    } catch (e: any) {
      setFormError(e.message ?? 'Failed to save event');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteEvent(deleteTarget.id);
      setDeleteTarget(null);
      await refresh();
    } catch (e: any) {
      setError(e.message ?? 'Failed to delete event');
    }
  };

  const now = new Date();
  const filtered = events.filter((ev) => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'upcoming') return ev.start_at ? new Date(ev.start_at) >= now : false;
    if (statusFilter === 'past') return ev.start_at ? new Date(ev.start_at) < now : false;
    if (statusFilter === 'draft') return ev.status === 'draft';
    return true;
  });
  const { page, setPage, totalPages, paged, pageSize, totalItems } = usePagination(filtered, 10);

  const counts = {
    upcoming: events.filter((ev) => ev.start_at ? new Date(ev.start_at) >= now : false).length,
    past: events.filter((ev) => ev.start_at ? new Date(ev.start_at) < now : false).length,
    draft: events.filter((ev) => ev.status === 'draft').length,
  };

  return (
    <div>
      <PageTitle
        title="Events"
        subtitle="Manage club events and publications"
        action={
          <button onClick={openAdd} className="btn btn-primary">
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add Event
            </span>
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard label="Upcoming" value={counts.upcoming} icon="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" color="blue" />
        <StatCard label="Past" value={counts.past} icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" color="amber" />
        <StatCard label="Draft" value={counts.draft} icon="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" color="primary" />
      </div>

      <div className="mb-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="w-full sm:w-56">
          <Select label="Filter by status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All</option>
            <option value="upcoming">Upcoming</option>
            <option value="past">Past</option>
            <option value="draft">Draft</option>
          </Select>
        </div>
      </div>

      {loading ? (
        <LoadingState message="Loading events..." />
      ) : error ? (
        <ErrorState message={error} onRetry={refresh} />
      ) : filtered.length === 0 ? (
        <EmptyState title="No events found" message="Create a new event to get started." />
      ) : (
        <>
        <Table headers={['Title', 'Organizer', 'Start', 'Status', 'Public', 'Actions']}>
          {paged.map((ev) => (
            <TableRow key={ev.id}>
              <TableCell className="font-medium text-slate-900 dark:text-white">{ev.title}</TableCell>
              <TableCell>{ev.organizer?.full_name ?? '—'}</TableCell>
              <TableCell>{formatDate(ev.start_at)}</TableCell>
              <TableCell><Badge status={ev.status} /></TableCell>
              <TableCell>
                {ev.is_public ? (
                  <span className="text-green-600 dark:text-green-400 text-sm">Yes</span>
                ) : (
                  <span className="text-slate-400 text-sm">No</span>
                )}
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(ev)} className="text-primary-600 hover:text-primary-700 text-sm font-medium">Edit</button>
                  <button onClick={() => setDeleteTarget(ev)} className="text-red-600 hover:text-red-700 text-sm font-medium">Delete</button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </Table>
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} totalItems={totalItems} pageSize={pageSize} />
        </>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit Event' : 'Add Event'}>
        <div className="space-y-4">
          {formError && (
            <p className="text-sm text-red-600 dark:text-red-400">{formError}</p>
          )}
          <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Event title" />
          <Input label="Slug (optional, auto-generated from title)" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="url-friendly-slug" />
          <TextArea label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Event description" />
          <Input label="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Location" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Start" type="datetime-local" value={form.start_at} onChange={(e) => setForm({ ...form, start_at: e.target.value })} />
            <Input label="End" type="datetime-local" value={form.end_at} onChange={(e) => setForm({ ...form, end_at: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="cancelled">Cancelled</option>
            </Select>
            <Select label="Organizer" value={form.organized_by_member_id} onChange={(e) => setForm({ ...form, organized_by_member_id: e.target.value })}>
              <option value="">— Select organizer —</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>{m.full_name}</option>
              ))}
            </Select>
          </div>
          <Input label="Cover image URL" value={form.cover_image_url} onChange={(e) => setForm({ ...form, cover_image_url: e.target.value })} placeholder="https://..." />
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.is_public} onChange={(e) => setForm({ ...form, is_public: e.target.checked })} className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Public event</span>
          </label>
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
        itemName={deleteTarget?.title ?? 'this event'}
      />
    </div>
  );
}