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
} from '../../components/admin/AdminUI';
import { LoadingState, ErrorState, EmptyState } from '../../components/States';
import {
  getInventory,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
} from '../../lib/adminApi';

interface InventoryItem {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  quantity: number;
  unit: string | null;
  condition: string | null;
  location: string | null;
}

const emptyForm = {
  name: '',
  description: '',
  category: '',
  quantity: '',
  unit: '',
  condition: 'good',
  location: '',
};

export default function Inventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState('all');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<InventoryItem | null>(null);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getInventory();
      setItems(data as InventoryItem[]);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load inventory');
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
    setModalOpen(true);
  };

  const openEdit = (it: InventoryItem) => {
    setEditingId(it.id);
    setForm({
      name: it.name ?? '',
      description: it.description ?? '',
      category: it.category ?? '',
      quantity: it.quantity != null ? String(it.quantity) : '',
      unit: it.unit ?? '',
      condition: it.condition ?? 'good',
      location: it.location ?? '',
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: Record<string, any> = {
        name: form.name,
        description: form.description || null,
        category: form.category || null,
        quantity: Number(form.quantity) || 0,
        unit: form.unit || null,
        condition: form.condition,
        location: form.location || null,
      };
      if (editingId) {
        await updateInventoryItem(editingId, payload);
      } else {
        await createInventoryItem(payload);
      }
      setModalOpen(false);
      await refresh();
    } catch (e: any) {
      setError(e.message ?? 'Failed to save item');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteInventoryItem(deleteTarget.id);
      setDeleteTarget(null);
      await refresh();
    } catch (e: any) {
      setError(e.message ?? 'Failed to delete item');
    }
  };

  const categories = Array.from(new Set(items.map((i) => i.category).filter(Boolean))) as string[];
  const filtered = items.filter((i) => categoryFilter === 'all' || i.category === categoryFilter);

  const totalItems = items.length;
  const totalQuantity = items.reduce((s, i) => s + (Number(i.quantity) || 0), 0);
  const lowCondition = items.filter((i) => i.condition === 'poor' || i.condition === 'fair').length;

  return (
    <div>
      <PageTitle
        title="Inventory"
        subtitle="Manage club resources and equipment"
        action={
          <button onClick={openAdd} className="btn btn-primary">
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add Item
            </span>
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard label="Total Items" value={totalItems} icon="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" color="primary" />
        <StatCard label="Total Quantity" value={totalQuantity} icon="M9 7h6m0 10v-3m0 0h-3m3 0h3M5 21h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z" color="blue" />
        <StatCard label="Needs Attention" value={lowCondition} icon="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.67 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" color="amber" />
      </div>

      <div className="mb-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="w-full sm:w-56">
          <Select label="Filter by category" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="all">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </Select>
        </div>
      </div>

      {loading ? (
        <LoadingState message="Loading inventory..." />
      ) : error ? (
        <ErrorState message={error} onRetry={refresh} />
      ) : filtered.length === 0 ? (
        <EmptyState title="No inventory items" message="Add an item to start tracking inventory." />
      ) : (
        <Table headers={['Name', 'Category', 'Quantity', 'Unit', 'Condition', 'Location', 'Actions']}>
          {filtered.map((it) => (
            <TableRow key={it.id}>
              <TableCell className="font-medium text-slate-900 dark:text-white">{it.name}</TableCell>
              <TableCell>{it.category ?? '—'}</TableCell>
              <TableCell>{it.quantity}</TableCell>
              <TableCell>{it.unit ?? '—'}</TableCell>
              <TableCell>
                {it.condition ? <Badge status={it.condition === 'new' ? 'published' : it.condition === 'good' ? 'active' : it.condition === 'fair' ? 'pending' : 'cancelled'} /> : '—'}
              </TableCell>
              <TableCell>{it.location ?? '—'}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(it)} className="text-primary-600 hover:text-primary-700 text-sm font-medium">Edit</button>
                  <button onClick={() => setDeleteTarget(it)} className="text-red-600 hover:text-red-700 text-sm font-medium">Delete</button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </Table>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit Item' : 'Add Item'}>
        <div className="space-y-4">
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Item name" />
          <TextArea label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Optional description" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Category" />
            <Input label="Quantity" type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} placeholder="0" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Unit" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="e.g. pcs, boxes" />
            <Select label="Condition" value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })}>
              <option value="new">New</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
              <option value="poor">Poor</option>
            </Select>
          </div>
          <Input label="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Storage location" />
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
        itemName={deleteTarget?.name ?? 'this item'}
      />
    </div>
  );
}
