import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import FileUpload from '../../components/FileUpload';
import {
  PageTitle,
  Modal,
  ConfirmDelete,
  Input,
  TextArea,
  Badge,
  formatDate,
} from '../../components/admin/AdminUI';
import { LoadingState, ErrorState, EmptyState } from '../../components/States';
import {
  getGalleryItems,
  createGalleryItem,
  updateGalleryItem,
  deleteGalleryItem,
} from '../../lib/adminApi';

interface GalleryItem {
  id: string;
  title: string;
  image_url: string;
  category: string | null;
  description: string | null;
  sort_order: number | null;
  created_at: string | null;
}

interface FormState {
  title: string;
  image_url: string;
  category: string;
  description: string;
  sort_order: number;
}

const emptyForm: FormState = {
  title: '',
  image_url: '',
  category: '',
  description: '',
  sort_order: 0,
};

export default function GalleryCMS() {
  const { user } = useAuth();
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteName, setDeleteName] = useState('');
  const [deleting, setDeleting] = useState(false);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const data = await getGalleryItems();
      setItems(data as GalleryItem[]);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load gallery items.');
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
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(item: GalleryItem) {
    setEditingId(item.id);
    setForm({
      title: item.title ?? '',
      image_url: item.image_url ?? '',
      category: item.category ?? '',
      description: item.description ?? '',
      sort_order: item.sort_order ?? 0,
    });
    setModalOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      if (editingId) {
        await updateGalleryItem(editingId, { ...form });
      } else {
        await createGalleryItem({ ...form });
      }
      setModalOpen(false);
      await refresh();
    } catch (e: any) {
      setError(e.message ?? 'Failed to save gallery item.');
    } finally {
      setSaving(false);
    }
  }

  function openDelete(item: GalleryItem) {
    setDeleteId(item.id);
    setDeleteName(item.title);
  }

  async function confirmDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteGalleryItem(deleteId);
      setDeleteId(null);
      await refresh();
    } catch (e: any) {
      setError(e.message ?? 'Failed to delete gallery item.');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <PageTitle
        title="Gallery CMS"
        subtitle="Manage images displayed on the public gallery page"
        action={
          <button onClick={openAdd} className="btn btn-primary">
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add Image
            </span>
          </button>
        }
      />

      {loading && <LoadingState message="Loading gallery..." />}
      {error && <ErrorState message={error} onRetry={refresh} />}

      {!loading && !error && items.length === 0 && (
        <EmptyState title="No gallery items" message="Add your first image to get started." />
      )}

      {!loading && !error && items.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {items.map((item) => (
            <div key={item.id} className="card overflow-hidden flex flex-col">
              <div className="aspect-video bg-slate-100 dark:bg-slate-800 overflow-hidden">
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full grid place-items-center text-slate-400">
                    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5z" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="p-4 flex flex-col flex-1">
                <h3 className="font-medium text-slate-900 dark:text-white truncate">{item.title}</h3>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {item.category && <Badge status={item.category} />}
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Order: {item.sort_order ?? 0}
                  </span>
                </div>
                {item.description && (
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 line-clamp-2">{item.description}</p>
                )}
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                  {formatDate(item.created_at)}
                </p>
                <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button onClick={() => openEdit(item)} className="btn btn-outline flex-1 text-sm">Edit</button>
                  <button
                    onClick={() => openDelete(item)}
                    className="btn bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-950/50 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit Image' : 'Add Image'}>
        <div className="space-y-4">
          <Input
            label="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Image title"
          />
          <FileUpload
            bucket="gallery"
            folder={user?.id ?? 'unassigned'}
            value={form.image_url || null}
            onChange={(url) => setForm({ ...form, image_url: url })}
            label="Image"
            accept="image/*"
            helpText="JPG or PNG, max 8MB."
          />
          <Input
            label="Category"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            placeholder="e.g. Events, Team, Campus"
          />
          <TextArea
            label="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
            placeholder="Optional description"
          />
          <Input
            label="Sort Order"
            type="number"
            value={form.sort_order}
            onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
          />
          <div className="flex gap-3 justify-end pt-2">
            <button onClick={() => setModalOpen(false)} className="btn-outline">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn btn-primary">
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDelete
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        itemName={deleteName}
      />
    </div>
  );
}
