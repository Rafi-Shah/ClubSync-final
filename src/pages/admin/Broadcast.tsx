import { useEffect, useState } from 'react';
import {
  PageTitle,
  Input,
  Select,
  TextArea,
  Table,
  TableRow,
  TableCell,
  Badge,
  formatDate,
  formatDateTime,
} from '../../components/admin/AdminUI';
import { LoadingState, ErrorState, EmptyState } from '../../components/States';
import {
  getAllMembers,
  broadcastNotification,
  getAllNotifications,
} from '../../lib/adminApi';

interface Member {
  id: string;
  full_name: string;
  email: string;
  status: string | null;
}

interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

type NotifType = 'info' | 'announcement' | 'reminder' | 'alert';

export default function Broadcast() {
  const [members, setMembers] = useState<Member[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [type, setType] = useState<NotifType>('announcement');
  const [link, setLink] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const [m, n] = await Promise.all([getAllMembers(), getAllNotifications()]);
      setMembers(m as Member[]);
      setNotifications((n as Notification[]).filter((notif) => notif.type === 'announcement'));
    } catch (e: any) {
      setError(e.message ?? 'Failed to load data.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    (async () => {
      await refresh();
    })();
  }, []);

  function toggleMember(id: string) {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  }

  function selectAll() {
    setSelectedIds(new Set(members.map((m) => m.id)));
  }

  function deselectAll() {
    setSelectedIds(new Set());
  }

  async function handleSend() {
    if (!title.trim() || !body.trim()) return;
    if (selectedIds.size === 0) return;
    setSending(true);
    setSuccessMsg('');
    try {
      const userIds = Array.from(selectedIds);
      await broadcastNotification(userIds, type, title, body, link || undefined);
      setSuccessMsg(`Broadcast sent to ${userIds.length} recipient${userIds.length !== 1 ? 's' : ''}.`);
      // Reset form
      setTitle('');
      setBody('');
      setLink('');
      setType('announcement');
      setSelectedIds(new Set());
      // Refresh notification history
      await refresh();
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (e: any) {
      setError(e.message ?? 'Failed to send broadcast.');
    } finally {
      setSending(false);
    }
  }

  const allSelected = members.length > 0 && selectedIds.size === members.length;

  return (
    <div>
      <PageTitle title="Broadcast" subtitle="Send notifications to multiple members at once" />

      {loading && <LoadingState message="Loading..." />}
      {error && <ErrorState message={error} onRetry={refresh} />}

      {!loading && !error && (
        <div className="space-y-6">
          {/* Success message */}
          {successMsg && (
            <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 flex items-center gap-2">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium">{successMsg}</span>
            </div>
          )}

          {/* Broadcast Form */}
          <div className="card p-6">
            <h2 className="text-lg font-display font-bold text-slate-900 dark:text-white mb-4">New Broadcast</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Notification title"
                />
                <Select
                  label="Type"
                  value={type}
                  onChange={(e) => setType(e.target.value as NotifType)}
                >
                  <option value="info">Info</option>
                  <option value="announcement">Announcement</option>
                  <option value="reminder">Reminder</option>
                  <option value="alert">Alert</option>
                </Select>
              </div>
              <TextArea
                label="Body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={4}
                placeholder="Notification message..."
              />
              <Input
                label="Link (optional)"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://..."
              />

              {/* Recipient selection */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Select Recipients ({selectedIds.size} selected)
                  </label>
                  <div className="flex gap-2">
                    <button onClick={selectAll} className="text-sm text-primary-600 dark:text-primary-400 hover:underline">
                      Select All
                    </button>
                    <span className="text-slate-300 dark:text-slate-600">|</span>
                    <button onClick={deselectAll} className="text-sm text-slate-500 dark:text-slate-400 hover:underline">
                      Deselect All
                    </button>
                  </div>
                </div>
                <div className="max-h-64 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-800">
                  {members.length === 0 ? (
                    <p className="p-4 text-sm text-slate-500 dark:text-slate-400 text-center">No members found.</p>
                  ) : (
                    members.map((member) => {
                      const checked = selectedIds.has(member.id);
                      return (
                        <label
                          key={member.id}
                          className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleMember(member.id)}
                            className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{member.full_name}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{member.email}</p>
                          </div>
                          {member.status && <Badge status={member.status} />}
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleSend}
                  disabled={sending || !title.trim() || !body.trim() || selectedIds.size === 0}
                  className="btn btn-primary"
                >
                  {sending ? 'Sending...' : `Send Broadcast${selectedIds.size > 0 ? ` (${selectedIds.size})` : ''}`}
                </button>
                {!title.trim() || !body.trim() ? (
                  <span className="text-sm text-slate-400 dark:text-slate-500">Enter title and body to send</span>
                ) : selectedIds.size === 0 ? (
                  <span className="text-sm text-slate-400 dark:text-slate-500">Select at least one recipient</span>
                ) : null}
              </div>
            </div>
          </div>

          {/* History */}
          <div>
            <h2 className="text-lg font-display font-bold text-slate-900 dark:text-white mb-4">Broadcast History</h2>
            {notifications.length === 0 ? (
              <EmptyState title="No broadcasts sent" message="Sent announcements will appear here." />
            ) : (
              <Table headers={['Title', 'Body', 'Recipients', 'Date', 'Status']}>
                {(() => {
                  // Group by title+body+created_at to show unique broadcasts
                  const seen = new Map<string, Notification[]>();
                  for (const n of notifications) {
                    const key = `${n.title}__${n.body}__${n.created_at}`;
                    if (!seen.has(key)) seen.set(key, []);
                    seen.get(key)!.push(n);
                  }
                  return Array.from(seen.entries()).map(([key, group]) => {
                    const first = group[0];
                    return (
                      <TableRow key={key}>
                        <TableCell className="font-medium text-slate-900 dark:text-white">{first.title}</TableCell>
                        <TableCell>
                          <span className="line-clamp-1 max-w-xs">{first.body}</span>
                        </TableCell>
                        <TableCell>{group.length}</TableCell>
                        <TableCell className="whitespace-nowrap">{formatDateTime(first.created_at)}</TableCell>
                        <TableCell>
                          {group.every((n) => n.is_read) ? (
                            <Badge status="completed" />
                          ) : group.some((n) => n.is_read) ? (
                            <Badge status="in_progress" />
                          ) : (
                            <Badge status="pending" />
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  });
                })()}
              </Table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
