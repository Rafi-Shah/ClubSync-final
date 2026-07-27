// MODIFIED FILE — replace the full content of: src/pages/admin/CertificateGenerator.tsx
import { useEffect, useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
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
  usePagination,
  Pagination,
} from '../../components/admin/AdminUI';
import { LoadingState, ErrorState, EmptyState } from '../../components/States';
import {
  getCertificates,
  createCertificate,
  deleteCertificate,
  getAllMembers,
  getEvents,
  getSiteSettings,
  updateSiteSettings,
} from '../../lib/adminApi';
import { uploadFile, FileValidationError } from '../../lib/storage';
import CertificateTemplate from '../../components/admin/CertificateTemplate';

interface Certificate {
  id: string;
  member_id: string;
  event_id: string | null;
  certificate_code: string | null;
  title: string;
  description: string | null;
  issued_at: string | null;
  file_url: string | null;
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

// Loads an image into the browser's cache first, so when it's set as an
// <img src> inside the hidden template it's already decoded and ready for
// html2canvas to capture (avoids a blank/partial image in the PDF).
const preloadImage = (url: string) =>
  new Promise<void>((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve();
    img.onerror = () => resolve(); // don't block generation if an asset fails to load
    img.src = url;
  });

export default function CertificateGenerator() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [savingStage, setSavingStage] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Certificate | null>(null);

  // If the admin picks their own file here, we upload it as-is and skip
  // template-based generation entirely (per-certificate custom design).
  const [customFile, setCustomFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ---- Club-wide reusable certificate template (background art) ----
  const [siteSettingsId, setSiteSettingsId] = useState<string | null>(null);
  const [templateUrl, setTemplateUrl] = useState<string | null>(null);
  const [templateUploading, setTemplateUploading] = useState(false);
  const [templateError, setTemplateError] = useState<string | null>(null);
  const templateInputRef = useRef<HTMLInputElement>(null);

  // ---- Club-wide reusable signature image (ideally transparent PNG) ----
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
  const [signatureUploading, setSignatureUploading] = useState(false);
  const [signatureError, setSignatureError] = useState<string | null>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);

  // Data currently rendered in the hidden off-screen template.
  const [renderData, setRenderData] = useState<{
    memberName: string;
    title: string;
    description?: string | null;
    certificateCode: string;
    issuedAt: string;
    backgroundImageUrl?: string | null;
    signatureImageUrl?: string | null;
  } | null>(null);
  const templateRef = useRef<HTMLDivElement>(null);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const [data, mem, ev, settings] = await Promise.all([
        getCertificates(),
        getAllMembers(),
        getEvents(),
        getSiteSettings(),
      ]);
      setCertificates(data as Certificate[]);
      setMembers(mem as Member[]);
      setEvents(ev as EventRow[]);
      setSiteSettingsId((settings as any)?.id ?? null);
      setTemplateUrl((settings as any)?.certificate_template_url ?? null);
      setSignatureUrl((settings as any)?.certificate_signature_url ?? null);
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
    setFormError(null);
    setCustomFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setModalOpen(true);
  };

  // ---- Template upload handlers ----
  const handleTemplateUpload = async (file: File) => {
    setTemplateError(null);
    if (!siteSettingsId) {
      setTemplateError('Site settings row not found — cannot save the template. Contact a developer.');
      return;
    }
    setTemplateUploading(true);
    try {
      const url = await uploadFile('certificates', 'templates', file, {
        maxSizeMB: 5,
        allowedTypes: ['image/'],
      });
      await updateSiteSettings(siteSettingsId, { certificate_template_url: url });
      setTemplateUrl(url);
    } catch (e: any) {
      setTemplateError(e.message ?? 'Failed to upload template');
    } finally {
      setTemplateUploading(false);
      if (templateInputRef.current) templateInputRef.current.value = '';
    }
  };

  const handleRemoveTemplate = async () => {
    if (!siteSettingsId) return;
    try {
      await updateSiteSettings(siteSettingsId, { certificate_template_url: null });
      setTemplateUrl(null);
    } catch (e: any) {
      setTemplateError(e.message ?? 'Failed to remove template');
    }
  };

  // ---- Signature upload handlers ----
  const handleSignatureUpload = async (file: File) => {
    setSignatureError(null);
    if (!siteSettingsId) {
      setSignatureError('Site settings row not found — cannot save the signature. Contact a developer.');
      return;
    }
    setSignatureUploading(true);
    try {
      const url = await uploadFile('certificates', 'signatures', file, {
        maxSizeMB: 2,
        allowedTypes: ['image/'],
      });
      await updateSiteSettings(siteSettingsId, { certificate_signature_url: url });
      setSignatureUrl(url);
    } catch (e: any) {
      setSignatureError(e.message ?? 'Failed to upload signature');
    } finally {
      setSignatureUploading(false);
      if (signatureInputRef.current) signatureInputRef.current.value = '';
    }
  };

  const handleRemoveSignature = async () => {
    if (!siteSettingsId) return;
    try {
      await updateSiteSettings(siteSettingsId, { certificate_signature_url: null });
      setSignatureUrl(null);
    } catch (e: any) {
      setSignatureError(e.message ?? 'Failed to remove signature');
    }
  };

  // Waits one animation frame so React has painted `renderData` into the
  // hidden template div before we hand it to html2canvas.
  const waitForPaint = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

  const handleSave = async () => {
    setFormError(null);
    if (!form.member_id) {
      setFormError('Please select a member.');
      return;
    }
    if (!form.title.trim()) {
      setFormError('Please enter a title.');
      return;
    }

    const member = members.find((m) => m.id === form.member_id);
    if (!member) {
      setFormError('Selected member not found.');
      return;
    }

    setSaving(true);
    try {
      const certificateCode = `CERT-${Date.now()}`;
      const issuedAt = new Date().toISOString();
      let fileUrl: string;

      if (customFile) {
        // ---- Path 1: admin's own uploaded design for this certificate, used as-is ----
        setSavingStage('Uploading...');
        fileUrl = await uploadFile('certificates', form.member_id, customFile, {
          maxSizeMB: 5,
          allowedTypes: ['application/pdf', 'image/'],
        });
      } else {
        // ---- Path 2: auto-generate — uses the saved template/signature if set,
        // otherwise falls back to the built-in decorative design ----
        setSavingStage('Loading assets...');
        await Promise.all([
          templateUrl ? preloadImage(templateUrl) : Promise.resolve(),
          signatureUrl ? preloadImage(signatureUrl) : Promise.resolve(),
        ]);

        setSavingStage('Rendering design...');
        setRenderData({
          memberName: member.full_name,
          title: form.title,
          description: form.description || null,
          certificateCode,
          issuedAt,
          backgroundImageUrl: templateUrl,
          signatureImageUrl: signatureUrl,
        });
        await waitForPaint();

        if (!templateRef.current) throw new Error('Certificate template failed to render.');

        setSavingStage('Generating PDF...');
        const canvas = await html2canvas(templateRef.current, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
        const imgData = canvas.toDataURL('image/jpeg', 0.85);

        const pdf = new jsPDF({
          orientation: 'landscape',
          unit: 'px',
          format: [canvas.width, canvas.height],
        });
        pdf.addImage(imgData, 'JPEG', 0, 0, canvas.width, canvas.height);
        const pdfBlob = pdf.output('blob');
        const pdfFile = new File([pdfBlob], `${certificateCode}.pdf`, { type: 'application/pdf' });

        setSavingStage('Uploading...');
        fileUrl = await uploadFile('certificates', form.member_id, pdfFile, {
          maxSizeMB: 5,
          allowedTypes: ['application/pdf'],
        });
      }

      setSavingStage('Saving...');
      const payload: Record<string, any> = {
        member_id: form.member_id,
        event_id: form.event_id || null,
        certificate_code: certificateCode,
        title: form.title,
        description: form.description || null,
        issued_at: issuedAt,
        file_url: fileUrl,
      };
      await createCertificate(payload);

      setModalOpen(false);
      await refresh();
    } catch (e: any) {
      const message = e instanceof FileValidationError ? e.message : (e.message ?? 'Failed to generate certificate');
      setFormError(message);
    } finally {
      setSaving(false);
      setSavingStage('');
      setRenderData(null);
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

  const filtered = certificates.filter((c) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      c.title?.toLowerCase().includes(q) ||
      c.member?.full_name?.toLowerCase().includes(q) ||
      (c.certificate_code ?? '').toLowerCase().includes(q)
    );
  });
  const { page, setPage, totalPages, paged, pageSize, totalItems } = usePagination(filtered, 10);

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

      {/* ---- Club-wide certificate template + signature panel ---- */}
      <div className="card p-5 mb-6 space-y-6">
        <div>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h3 className="font-display font-semibold text-slate-900 dark:text-white">Certificate Template</h3>
              <p className="text-sm text-slate-500 mt-0.5">
                Upload your background design once. New certificates (without a per-certificate custom file) will
                automatically overlay the club name, member name, title, date, and signature on top of it.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <input
                ref={templateInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleTemplateUpload(f);
                }}
              />
              <button
                onClick={() => templateInputRef.current?.click()}
                disabled={templateUploading}
                className="btn-outline text-sm"
              >
                {templateUploading ? 'Uploading...' : templateUrl ? 'Replace Template' : 'Upload Template'}
              </button>
              {templateUrl && (
                <button onClick={handleRemoveTemplate} className="text-red-600 hover:text-red-700 text-sm font-medium">
                  Remove
                </button>
              )}
            </div>
          </div>
          {templateError && <p className="text-sm text-red-600 dark:text-red-400 mt-2">{templateError}</p>}
          {templateUrl && (
            <img
              src={templateUrl}
              alt="Certificate template preview"
              className="mt-4 w-full max-w-md rounded-lg border border-slate-200 dark:border-slate-800"
            />
          )}
        </div>

        <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h3 className="font-display font-semibold text-slate-900 dark:text-white">Signature</h3>
              <p className="text-sm text-slate-500 mt-0.5">
                Upload a transparent-background PNG of the signature. It will be placed automatically above the
                "Authorized Signature" line on every generated certificate.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <input
                ref={signatureInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleSignatureUpload(f);
                }}
              />
              <button
                onClick={() => signatureInputRef.current?.click()}
                disabled={signatureUploading}
                className="btn-outline text-sm"
              >
                {signatureUploading ? 'Uploading...' : signatureUrl ? 'Replace Signature' : 'Upload Signature'}
              </button>
              {signatureUrl && (
                <button onClick={handleRemoveSignature} className="text-red-600 hover:text-red-700 text-sm font-medium">
                  Remove
                </button>
              )}
            </div>
          </div>
          {signatureError && <p className="text-sm text-red-600 dark:text-red-400 mt-2">{signatureError}</p>}
          {signatureUrl && (
            <div className="mt-4 inline-block bg-slate-100 dark:bg-slate-800 rounded-lg p-3">
              <img src={signatureUrl} alt="Signature preview" className="h-16 object-contain" />
            </div>
          )}
        </div>
      </div>

      <div className="mb-4 w-full sm:w-64">
        <Input label="Search" placeholder="Search by title, member, or code..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <LoadingState message="Loading certificates..." />
      ) : error ? (
        <ErrorState message={error} onRetry={refresh} />
      ) : filtered.length === 0 ? (
        <EmptyState title="No certificates" message="Generate a certificate to get started." />
      ) : (
        <>
        <Table headers={['Member', 'Event', 'Code', 'Title', 'Issued', 'File', 'Actions']}>
          {paged.map((c) => (
            <TableRow key={c.id}>
              <TableCell className="font-medium text-slate-900 dark:text-white">{c.member?.full_name ?? '—'}</TableCell>
              <TableCell>{c.event?.title ?? '—'}</TableCell>
              <TableCell><code className="text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">{c.certificate_code ?? '—'}</code></TableCell>
              <TableCell>{c.title}</TableCell>
              <TableCell>{formatDate(c.issued_at)}</TableCell>
              <TableCell>
                {c.file_url ? (
                  <a href={c.file_url} target="_blank" rel="noopener noreferrer" className="text-primary-600 dark:text-primary-400 hover:underline text-sm font-medium">
                    View
                  </a>
                ) : (
                  <span className="text-slate-400 text-sm">—</span>
                )}
              </TableCell>
              <TableCell>
                <button onClick={() => setDeleteTarget(c)} className="text-red-600 hover:text-red-700 text-sm font-medium">Delete</button>
              </TableCell>
            </TableRow>
          ))}
        </Table>
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} totalItems={totalItems} pageSize={pageSize} />
        </>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Generate Certificate">
        <div className="space-y-4">
          {formError && (
            <p className="text-sm text-red-600 dark:text-red-400">{formError}</p>
          )}
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

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Custom certificate file (optional)
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,image/*"
              onChange={(e) => setCustomFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-slate-600 dark:text-slate-300 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 dark:file:bg-primary-900/30 dark:file:text-primary-300"
            />
            <p className="text-xs text-slate-400 mt-1">
              {customFile
                ? `Selected: ${customFile.name} — this exact file will be uploaded, no auto text overlay.`
                : templateUrl
                ? 'Leave empty to auto-fill your saved template with this certificate\u2019s details.'
                : 'Leave empty to auto-generate a certificate using the built-in design.'}
            </p>
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button onClick={() => setModalOpen(false)} className="btn-outline">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn btn-primary">{saving ? (savingStage || 'Generating...') : 'Generate'}</button>
          </div>
        </div>
      </Modal>

      <ConfirmDelete
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        itemName={deleteTarget?.title ?? 'this certificate'}
      />

      {/* Hidden off-screen certificate template, only used for the auto-generate path. */}
      {renderData && (
        <div style={{ position: 'fixed', top: 0, left: -99999, zIndex: -1 }}>
          <CertificateTemplate
            ref={templateRef}
            memberName={renderData.memberName}
            title={renderData.title}
            description={renderData.description}
            certificateCode={renderData.certificateCode}
            issuedAt={renderData.issuedAt}
            backgroundImageUrl={renderData.backgroundImageUrl}
            signatureImageUrl={renderData.signatureImageUrl}
          />
        </div>
      )}
    </div>
  );
}