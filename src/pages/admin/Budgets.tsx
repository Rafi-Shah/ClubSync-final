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
} from '../../components/admin/AdminUI';
import { LoadingState, ErrorState, EmptyState } from '../../components/States';
import {
  getBudgets,
  createBudget,
  updateBudget,
  deleteBudget,
} from '../../lib/adminApi';

interface Budget {
  id: string;
  title: string;
  type: string;
  amount: number;
  category: string | null;
  description: string | null;
  transaction_date: string | null;
}

const emptyForm = {
  title: '',
  type: 'expense',
  amount: '',
  category: '',
  description: '',
  transaction_date: '',
};

export default function Budgets() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState('all');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Budget | null>(null);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getBudgets();
      setBudgets(data as Budget[]);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load budgets');
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

  const openEdit = (b: Budget) => {
    setEditingId(b.id);
    setForm({
      title: b.title ?? '',
      type: b.type ?? 'expense',
      amount: b.amount != null ? String(b.amount) : '',
      category: b.category ?? '',
      description: b.description ?? '',
      transaction_date: b.transaction_date ? b.transaction_date.slice(0, 10) : '',
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: Record<string, any> = {
        title: form.title,
        type: form.type,
        amount: Number(form.amount) || 0,
        category: form.category || null,
        description: form.description || null,
        transaction_date: form.transaction_date || null,
      };
      if (editingId) {
        await updateBudget(editingId, payload);
      } else {
        await createBudget(payload);
      }
      setModalOpen(false);
      await refresh();
    } catch (e: any) {
      setError(e.message ?? 'Failed to save budget');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteBudget(deleteTarget.id);
      setDeleteTarget(null);
      await refresh();
    } catch (e: any) {
      setError(e.message ?? 'Failed to delete budget');
    }
  };

  const filtered = budgets.filter((b) => typeFilter === 'all' || b.type === typeFilter);

  const totalIncome = budgets.filter((b) => b.type === 'income').reduce((s, b) => s + (Number(b.amount) || 0), 0);
  const totalExpense = budgets.filter((b) => b.type === 'expense').reduce((s, b) => s + (Number(b.amount) || 0), 0);
  const net = totalIncome - totalExpense;

  const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

  return (
    <div>
      <PageTitle
        title="Budgets"
        subtitle="Track income and expenses"
        action={
          <button onClick={openAdd} className="btn btn-primary">
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add Transaction
            </span>
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard label="Total Income" value={fmt(totalIncome)} icon="M3 13.125C3 13.625 3.5 14 4 14l1.5-.5L7 15l-1.5 1.5L4 16c-.5 0-1 .375-1 .875V19a1 1 0 001 1h16a1 1 0 001-1v-2.125c0-.5-.5-.875-1-.875l-1.5.5L17 15l1.5-1.5L20 14c.5 0 1-.375 1-.875V11a1 1 0 00-1-1H4a1 1 0 00-1 1v2.125z" color="green" />
        <StatCard label="Total Expense" value={fmt(totalExpense)} icon="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" color="red" />
        <StatCard label="Net Balance" value={fmt(net)} icon="M9 7h6m0 10v-3m0 0h-3m3 0h3M5 21h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z" color={net >= 0 ? 'green' : 'red'} />
      </div>

      <div className="mb-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="w-full sm:w-56">
          <Select label="Filter by type" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="all">All types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </Select>
        </div>
      </div>

      {loading ? (
        <LoadingState message="Loading budgets..." />
      ) : error ? (
        <ErrorState message={error} onRetry={refresh} />
      ) : filtered.length === 0 ? (
        <EmptyState title="No transactions found" message="Add a transaction to start tracking finances." />
      ) : (
        <Table headers={['Title', 'Type', 'Category', 'Amount', 'Date', 'Actions']}>
          {filtered.map((b) => (
            <TableRow key={b.id}>
              <TableCell className="font-medium text-slate-900 dark:text-white">{b.title}</TableCell>
              <TableCell><Badge status={b.type} /></TableCell>
              <TableCell>{b.category ?? '—'}</TableCell>
              <TableCell className={b.type === 'income' ? 'text-green-600 dark:text-green-400 font-medium' : 'text-red-600 dark:text-red-400 font-medium'}>
                {b.type === 'income' ? '+' : '−'}{fmt(Number(b.amount) || 0)}
              </TableCell>
              <TableCell>{formatDate(b.transaction_date)}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(b)} className="text-primary-600 hover:text-primary-700 text-sm font-medium">Edit</button>
                  <button onClick={() => setDeleteTarget(b)} className="text-red-600 hover:text-red-700 text-sm font-medium">Delete</button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </Table>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit Transaction' : 'Add Transaction'}>
        <div className="space-y-4">
          <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Transaction title" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select label="Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </Select>
            <Input label="Amount" type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0.00" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Category" />
            <Input label="Transaction date" type="date" value={form.transaction_date} onChange={(e) => setForm({ ...form, transaction_date: e.target.value })} />
          </div>
          <TextArea label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Optional description" />
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
        itemName={deleteTarget?.title ?? 'this transaction'}
      />
    </div>
  );
}
