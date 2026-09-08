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
import {
  getRecruitments,
  createRecruitment,
  updateRecruitment,
  deleteRecruitment,
  getApplications,
  updateApplication,
} from '../../lib/adminApi';

interface Recruitment {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  requirements?: string | null;
  open_at: string;
  close_at?: string | null;
  status: string;
}

interface Application {
  id: string;
  applicant_name: string;
  applicant_email: string;
  applicant_phone?: string | null;
  status: string;
  review_notes?: string | null;
  recruitment: { id: string; title: string } | null;
  [key: string]: any;
}

const emptyForm = {
  title: '',
  slug: '',
  description: '',
  requirements: '',
  open_at: '',
  close_at: '',
  status: 'open',
};

export default function Recruitment() {
  const [tab, setTab] = useState<'postings' | 'applications'>('postings');
  const [appSearch, setAppSearch] = useState('');
  const [recruitments, setRecruitments] = useState<Recruitment[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<'add' | 'edit' | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Recruitment | null>(null);
  const [reviewApp, setReviewApp] = useState<Application | null>(null);
  const [reviewForm, setReviewForm] = useState({ status: 'submitted', review_notes: '' });
  const [reviewSaving, setReviewSaving] = useState(false);
  const [viewingCv, setViewingCv] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const [recs, apps] = await Promise.all([getRecruitments(), getApplications()]);
      setRecruitments(recs as Recruitment[]);
      setApplications(apps as Application[]);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load recruitment data');
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

  function openEdit(r: Recruitment) {
    setModalMode('edit');
    setEditId(r.id);
    setForm({
      title: r.title ?? '',
      slug: r.slug ?? '',
      description: r.description ?? '',
      requirements: r.requirements ?? '',
      open_at: r.open_at ? r.open_at.slice(0, 10) : '',
      close_at: r.close_at ? r.close_at.slice(0, 10) : '',
      status: r.status ?? 'open',
    });
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        slug: form.slug,
        description: form.description || null,
        requirements: form.requirements || null,
        open_at: form.open_at,
        close_at: form.close_at || null,
        status: form.status,
      };
      if (modalMode === 'add') {
        await createRecruitment(payload);
      } else if (modalMode === 'edit' && editId) {
        await updateRecruitment(editId, payload);
      }
      setModalMode(null);
      await refresh();
    } catch (e: any) {
      setError(e.message ?? 'Failed to save job posting');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteRecruitment(deleteTarget.id);
      setDeleteTarget(null);
      await refresh();
    } catch (e: any) {
      setError(e.message ?? 'Failed to delete job posting');
    }
  }

  function openReview(app: Application) {
    setReviewApp(app);
    setReviewForm({
      status: app.status ?? 'submitted',
      review_notes: app.review_notes ?? '',
    });
  }

  async function handleReviewSave() {
    if (!reviewApp) return;
    setReviewSaving(true);
    try {
      await updateApplication(reviewApp.id, {
        status: reviewForm.status,
        review_notes: reviewForm.review_notes || null,
      });
      setReviewApp(null);
      await refresh();
    } catch (e: any) {
      setError(e.message ?? 'Failed to update application');
    } finally {
      setReviewSaving(false);
    }
  }

  const filteredApplications = applications.filter((app) => {
    const q = appSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      app.applicant_name?.toLowerCase().includes(q) ||
      app.applicant_email?.toLowerCase().includes(q)
    );
  });
  const recruitmentsPagination = usePagination(recruitments, 10);
  const applicationsPagination = usePagination(filteredApplications, 10);

  return (
    <div>
      <PageTitle
        title="Recruitment"
        subtitle="Manage job postings and review applications"
        action={
          tab === 'postings' ? (
            <div className="flex gap-2">
              <button onClick={refresh} className="btn-outline">Refresh</button>
              <button onClick={openAdd} className="btn">Add Posting</button>
            </div>
          ) : (
            <button onClick={refresh} className="btn-outline">Refresh</button>
          )
        }
      />

      <div className="flex gap-2 mb-6 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setTab('postings')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            tab === 'postings'
              ? 'border-primary-600 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          Job Postings
        </button>
        <button
          onClick={() => setTab('applications')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            tab === 'applications'
              ? 'border-primary-600 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          Applications
        </button>
      </div>

      {loading ? (
        <LoadingState message="Loading recruitment data..." />
      ) : error ? (
        <ErrorState message={error} onRetry={refresh} />
      ) : tab === 'postings' ? (
        recruitments.length === 0 ? (
          <EmptyState title="No job postings" message="Create a job posting to start recruiting." />
        ) : (
          <>
          <Table headers={['Title', 'Status', 'Open Date', 'Close Date', 'Actions']}>
            {recruitmentsPagination.paged.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium text-slate-900 dark:text-white">{r.title}</TableCell>
                <TableCell><Badge status={r.status} /></TableCell>
                <TableCell>{formatDate(r.open_at)}</TableCell>
                <TableCell>{formatDate(r.close_at)}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(r)} className="btn-outline text-sm">Edit</button>
                    <button
                      onClick={() => setDeleteTarget(r)}
                      className="btn-outline text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                    >
                      Delete
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </Table>
          <Pagination
            page={recruitmentsPagination.page}
            totalPages={recruitmentsPagination.totalPages}
            onPageChange={recruitmentsPagination.setPage}
            totalItems={recruitmentsPagination.totalItems}
            pageSize={recruitmentsPagination.pageSize}
          />
          </>
        )
      ) : (
        <>
        <div className="mb-4 w-full sm:w-64">
          <Input label="Search" placeholder="Search by name or email..." value={appSearch} onChange={(e) => setAppSearch(e.target.value)} />
        </div>
        {filteredApplications.length === 0 ? (
          <EmptyState title="No applications" message="Applications will appear here once submitted." />
        ) : (
          <>
          <Table headers={['Applicant', 'Email', 'Phone', 'Position', 'Status', 'Actions']}>
            {applicationsPagination.paged.map((app) => (
              <TableRow key={app.id}>
                <TableCell className="font-medium text-slate-900 dark:text-white">{app.applicant_name}</TableCell>
                <TableCell>{app.applicant_email}</TableCell>
                <TableCell>{app.applicant_phone || '—'}</TableCell>
                <TableCell>{app.recruitment?.title ?? '—'}</TableCell>
                <TableCell><Badge status={app.status} /></TableCell>
                <TableCell>
                  <button onClick={() => openReview(app)} className="btn-outline text-sm">Review</button>
                </TableCell>
              </TableRow>
            ))}
          </Table>
          <Pagination
            page={applicationsPagination.page}
            totalPages={applicationsPagination.totalPages}
            onPageChange={applicationsPagination.setPage}
            totalItems={applicationsPagination.totalItems}
            pageSize={applicationsPagination.pageSize}
          />
          </>
        )}
        </>
      )}

      {/* Add/Edit Posting Modal */}
      <Modal
        open={!!modalMode}
        onClose={() => setModalMode(null)}
        title={modalMode === 'add' ? 'Add Job Posting' : 'Edit Job Posting'}
      >
        <div className="space-y-4">
          <Input
            label="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <Input
            label="Slug"
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
            placeholder="e.g. marketing-lead-2024"
          />
          <TextArea
            label="Description"
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <TextArea
            label="Requirements"
            rows={3}
            value={form.requirements}
            onChange={(e) => setForm({ ...form, requirements: e.target.value })}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Open Date"
              type="date"
              value={form.open_at}
              onChange={(e) => setForm({ ...form, open_at: e.target.value })}
            />
            <Input
              label="Close Date"
              type="date"
              value={form.close_at}
              onChange={(e) => setForm({ ...form, close_at: e.target.value })}
            />
          </div>
          <Select
            label="Status"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
          >
            <option value="open">Open</option>
            <option value="closed">Closed</option>
          </Select>
        </div>
        <div className="flex gap-3 justify-end mt-6">
          <button onClick={() => setModalMode(null)} className="btn-outline">Cancel</button>
          <button onClick={handleSave} disabled={saving || !form.title || !form.slug} className="btn">
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </Modal>

      {/* Review Application Modal */}
      <Modal
        open={!!reviewApp}
        onClose={() => setReviewApp(null)}
        title="Review Application"
      >
        {reviewApp && (
          <div className="space-y-6">
            
            {/* Personal Information */}
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-1 mb-3">Personal Information</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Full Name</p>
                  <p className="text-sm text-slate-900 dark:text-white mt-1">{reviewApp.applicant_name}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">University Email</p>
                  <p className="text-sm text-slate-900 dark:text-white mt-1">{reviewApp.applicant_email}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Phone</p>
                  <p className="text-sm text-slate-900 dark:text-white mt-1">{reviewApp.applicant_phone || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Student ID</p>
                  <p className="text-sm text-slate-900 dark:text-white mt-1">{reviewApp.student_id || 'Not provided'}</p>
                </div>
              </div>
            </div>

            {/* Department */}
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-1 mb-3">Department</h4>
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Department Preference</p>
                <p className="text-sm text-slate-900 dark:text-white mt-1">{reviewApp.department_preference || 'Not provided'}</p>
              </div>
            </div>

            {/* Application Responses */}
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-1 mb-3">Application Responses</h4>
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Why do you want to join ClubSync?</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300 mt-1 whitespace-pre-wrap">{reviewApp.motivation || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Relevant Experience & Skills</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300 mt-1 whitespace-pre-wrap">{reviewApp.experience || 'Not provided'}</p>
                </div>
              </div>
            </div>

            {/* Application Information */}
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-1 mb-3">Application Information</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Status</p>
                  <p className="text-sm text-slate-900 dark:text-white mt-1 capitalize">{reviewApp.status}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Application Date</p>
                  <p className="text-sm text-slate-900 dark:text-white mt-1">
                    {reviewApp.created_at ? new Date(reviewApp.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Not provided'}
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Recruitment Drive / Position</p>
                  <p className="text-sm text-slate-900 dark:text-white mt-1">{reviewApp.recruitment?.title ?? 'Not provided'}</p>
                </div>
              </div>
            </div>

            {/* CV / Resume */}
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-1 mb-3">CV / Resume</h4>
              {reviewApp.cv_url ? (
                <div className="mt-2 flex gap-3 items-center">
                  <button 
                    onClick={() => setViewingCv(reviewApp.cv_url)}
                    className="btn-outline text-sm flex items-center gap-2 py-1.5"
                    type="button"
                  >
                    <span>📄</span> View CV
                  </button>
                  <a
                    href={reviewApp.cv_url}
                    download
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-primary-600 dark:text-primary-400 hover:underline inline-block"
                  >
                    Download CV
                  </a>
                </div>
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Not provided</p>
              )}
            </div>

            <Select
              label="Status"
              value={reviewForm.status}
              onChange={(e) => setReviewForm({ ...reviewForm, status: e.target.value })}
            >
              <option value="submitted">Submitted</option>
              <option value="under_review">Under Review</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
              <option value="withdrawn">Withdrawn</option>
            </Select>
            <TextArea
              label="Review Notes"
              rows={3}
              value={reviewForm.review_notes}
              onChange={(e) => setReviewForm({ ...reviewForm, review_notes: e.target.value })}
            />
          </div>
        )}
        <div className="flex gap-3 justify-end mt-6">
          <button onClick={() => setReviewApp(null)} className="btn-outline">Cancel</button>
          <button onClick={handleReviewSave} disabled={reviewSaving} className="btn">
            {reviewSaving ? 'Saving...' : 'Save Review'}
          </button>
        </div>
      </Modal>

      <Modal
        open={!!viewingCv}
        onClose={() => setViewingCv(null)}
        title="View CV"
      >
        {viewingCv && (
          <div className="h-[70vh] w-full mt-4 flex flex-col">
            {viewingCv.toLowerCase().endsWith('.pdf') ? (
              <object data={viewingCv} type="application/pdf" className="w-full h-full border-0 rounded-md">
                <div className="flex flex-col items-center justify-center h-full text-slate-500 bg-slate-50 dark:bg-slate-800/50 rounded-md border border-dashed border-slate-200 dark:border-slate-700 p-6 text-center">
                  <p>Failed to load CV or preview not supported for this browser.</p>
                  <a href={viewingCv} target="_blank" rel="noreferrer" className="btn mt-4">
                    Download / Open CV
                  </a>
                </div>
              </object>
            ) : viewingCv.match(/\.(jpeg|jpg|gif|png)$/i) ? (
               <div className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-800/50 rounded-md border border-slate-200 dark:border-slate-700 flex items-center justify-center p-4">
                 <img src={viewingCv} alt="CV Preview" className="max-w-full max-h-full object-contain" />
               </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-500 bg-slate-50 dark:bg-slate-800/50 rounded-md border border-dashed border-slate-200 dark:border-slate-700 p-6 text-center">
                <p>Preview not available for this file type.</p>
                <a href={viewingCv} target="_blank" rel="noreferrer" className="btn mt-4">
                  Download to view
                </a>
              </div>
            )}
            <div className="flex justify-end mt-4">
              <button onClick={() => setViewingCv(null)} className="btn-outline">Close</button>
            </div>
          </div>
        )}
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
