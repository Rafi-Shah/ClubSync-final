import { useEffect, useState } from 'react';
import {
  PageTitle,
  StatCard,
  Modal,
  ConfirmDelete,
  Table,
  TableRow,
  TableCell,
  Select,
  TextArea,
  Input,
  formatDate,
} from '../../components/admin/AdminUI';
import { LoadingState, ErrorState, EmptyState } from '../../components/States';
import {
  getCertificates,
  createCertificate,
  deleteCertificate,
  getAllMembers,
  getEvents,
} from '../../lib/adminApi';

interface Certificate {
  id: string;
  member_id: string;
  event_id: string | null;
  certificate_code: string | null;
  title: string;
  description: string | null;
  issued_at: string | null;
  member: { id: string; full_name: string } | null;
  event: { id: string; title: string } | null;
}

interface Member {
  id: string;
  full_name: string;
}

interface EventRow {
  id: string;
  title: string;
}

const emptyForm = {
  member_id: '',
  event_id: '',
  title: '',
  description: '',
};

export default function CertificateGenerator() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Certificate | null>(null);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const [data, mem, ev] = await Promise.all([
        getCertificates(),
        getAllMembers(),
        getEvents(),
      ]);
      setCertificates(data as Certificate[]);
      setMembers(mem as Member[]);
      setEvents(ev as EventRow[]);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load certificates');
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
    setModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: Record<string, any> = {
        member_id: form.member_id,
        event_id: form.event_id || null,
        certificate_code: `CERT-${Date.now()}`,
        title: form.title,
        description: form.description || null,
        issued_at: new Date().toISOString(),
      };
      await createCertificate(payload);
      setModalOpen(false);
      await refresh();
    } catch (e: any) {
      setError(e.message ?? 'Failed to generate certificate');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteCertificate(deleteTarget.id);
      setDeleteTarget(null);
      await refresh();
    } catch (e: any) {
      setError(e.message ?? 'Failed to delete certificate');
    }
  };

  const now = new Date();
  const thisMonth = certificates.filter((c) => {
    if (!c.issued_at) return false;
    const d = new Date(c.issued_at);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  return (
    <div>
      <PageTitle
        title="Certificate Generator"
        subtitle="Issue and manage member certificates"
        action={
          <button onClick={openAdd} className="btn btn-primary">
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Generate Certificate
            </span>
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <StatCard label="Total Certificates" value={certificates.length} icon="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" color="primary" />
        <StatCard label="This Month" value={thisMonth} icon="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" color="green" />
      </div>

      {loading ? (
        <LoadingState message="Loading certificates..." />
      ) : error ? (
        <ErrorState message={error} onRetry={refresh} />
      ) : certificates.length === 0 ? (
        <EmptyState title="No certificates" message="Generate a certificate to get started." />
      ) : (
        <Table headers={['Member', 'Event', 'Code', 'Title', 'Issued', 'Actions']}>
          {certificates.map((c) => (
            <TableRow key={c.id}>
              <TableCell className="font-medium text-slate-900 dark:text-white">{c.member?.full_name ?? '—'}</TableCell>
              <TableCell>{c.event?.title ?? '—'}</TableCell>
              <TableCell><code className="text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">{c.certificate_code ?? '—'}</code></TableCell>
              <TableCell>{c.title}</TableCell>
              <TableCell>{formatDate(c.issued_at)}</TableCell>
              <TableCell>
                <button onClick={() => setDeleteTarget(c)} className="text-red-600 hover:text-red-700 text-sm font-medium">Delete</button>
              </TableCell>
            </TableRow>
          ))}
        </Table>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Generate Certificate">
        <div className="space-y-4">
          <Select label="Member" value={form.member_id} onChange={(e) => setForm({ ...form, member_id: e.target.value })}>
            <option value="">Select a member</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.full_name}</option>
            ))}
          </Select>
          <Select label="Event (optional)" value={form.event_id} onChange={(e) => setForm({ ...form, event_id: e.target.value })}>
            <option value="">No associated event</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>{ev.title}</option>
            ))}
          </Select>
          <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Certificate title" />
          <TextArea label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Optional description" />
          <div className="flex gap-3 justify-end pt-2">
            <button onClick={() => setModalOpen(false)} className="btn-outline">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn btn-primary">{saving ? 'Generating...' : 'Generate'}</button>
          </div>
        </div>
      </Modal>

      <ConfirmDelete
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        itemName={deleteTarget?.title ?? 'this certificate'}
      />
    </div>
  );
}
