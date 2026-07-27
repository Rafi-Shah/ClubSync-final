import { useEffect, useState } from 'react';
import {
  PageTitle,
  StatCard,
  Table,
  TableRow,
  TableCell,
  Select,
  Input,
  formatDateTime,
  usePagination,
  Pagination,
} from '../../components/admin/AdminUI';
import { LoadingState, ErrorState, EmptyState } from '../../components/States';
import { getActivityLogs } from '../../lib/adminApi';

interface ActivityLog {
  id: string;
  user_id: string | null;
  portal: string | null;
  action: string | null;
  entity_type: string | null;
  description: string | null;
  created_at: string | null;
}

export default function ActivityLogs() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [portalFilter, setPortalFilter] = useState('all');
  const [search, setSearch] = useState('');

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getActivityLogs();
      setLogs(data as ActivityLog[]);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load activity logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      await refresh();
    })();
  }, []);

  const filtered = logs.filter((l) => {
    const portalMatch = portalFilter === 'all' || l.portal === portalFilter;
    const searchMatch =
      search.trim() === '' ||
      (l.description ?? '').toLowerCase().includes(search.trim().toLowerCase());
    return portalMatch && searchMatch;
  });

  const { page, setPage, totalPages, paged, pageSize, totalItems } = usePagination(filtered, 15);

  const total = logs.length;
  const adminLogs = logs.filter((l) => l.portal === 'admin').length;
  const memberLogs = logs.filter((l) => l.portal === 'member').length;

  const truncate = (id: string | null) => {
    if (!id) return '—';
    return id.length > 8 ? `${id.slice(0, 8)}…` : id;
  };

  return (
    <div>
      <PageTitle title="Activity Logs" subtitle="Audit trail of actions across portals" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard label="Total Logs" value={total} icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" color="primary" />
        <StatCard label="Admin Portal" value={adminLogs} icon="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" color="amber" />
        <StatCard label="Member Portal" value={memberLogs} icon="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-8 0 4 4 0 008 0z" color="blue" />
      </div>

      <div className="mb-4 flex flex-col sm:flex-row sm:items-end gap-3">
        <div className="w-full sm:w-48">
          <Select label="Filter by portal" value={portalFilter} onChange={(e) => setPortalFilter(e.target.value)}>
            <option value="all">All portals</option>
            <option value="admin">Admin</option>
            <option value="member">Member</option>
            <option value="public">Public</option>
          </Select>
        </div>
        <div className="flex-1">
          <Input label="Search description" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search log descriptions..." />
        </div>
      </div>

      {loading ? (
        <LoadingState message="Loading logs..." />
      ) : error ? (
        <ErrorState message={error} onRetry={refresh} />
      ) : filtered.length === 0 ? (
        <EmptyState title="No logs found" message="Try adjusting your filters." />
      ) : (
        <>
        <Table headers={['User', 'Portal', 'Action', 'Entity', 'Description', 'Created']}>
          {paged.map((l) => (
            <TableRow key={l.id}>
              <TableCell><code className="text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">{truncate(l.user_id)}</code></TableCell>
              <TableCell><span className="capitalize">{l.portal ?? '—'}</span></TableCell>
              <TableCell className="font-medium text-slate-900 dark:text-white">{l.action ?? '—'}</TableCell>
              <TableCell>{l.entity_type ?? '—'}</TableCell>
              <TableCell className="max-w-xs truncate">{l.description ?? '—'}</TableCell>
              <TableCell>{formatDateTime(l.created_at)}</TableCell>
            </TableRow>
          ))}
        </Table>
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} totalItems={totalItems} pageSize={pageSize} />
        </>
      )}
    </div>
  );
}