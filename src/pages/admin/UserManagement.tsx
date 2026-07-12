import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  PageTitle,
  Badge,
  Modal,
  Input,
  Select,
  Table,
  TableRow,
  TableCell,
} from '../../components/admin/AdminUI';
import { LoadingState, ErrorState, EmptyState } from '../../components/States';
import {
  getAllUsersWithRoles,
  getRoles,
  assignRole,
  removeRole,
  createUserAccount,
} from '../../lib/adminApi';

interface Role {
  id: number;
  name: string;
  slug: string;
}

interface Member {
  id: string;
  full_name: string;
  email: string;
}

interface UserRoleRow {
  user_id: string;
  role: Role;
  member: Member | null;
}

export default function UserManagement() {
  const { user } = useAuth();
  const [rows, setRows] = useState<UserRoleRow[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [manageUser, setManageUser] = useState<{ userId: string; member: Member } | null>(null);
  const [working, setWorking] = useState(false);

  const emptyForm = { full_name: '', email: '', password: '', phone: '', member_code: '', role_slug: 'member' };
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState(emptyForm);
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const [userRows, roleList] = await Promise.all([getAllUsersWithRoles(), getRoles()]);
      setRows(userRows as unknown as UserRoleRow[]);
      setRoles(roleList as Role[]);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    (async () => {
      await refresh();
    })();
  }, []);

  // Group role rows by user_id
  const usersMap = new Map<string, { member: Member | null; roles: Role[] }>();
  for (const r of rows) {
    const existing = usersMap.get(r.user_id);
    if (existing) {
      existing.roles.push(r.role);
    } else {
      usersMap.set(r.user_id, { member: r.member, roles: [r.role] });
    }
  }
  const users = Array.from(usersMap.entries()).map(([userId, info]) => ({
    userId,
    member: info.member,
    roles: info.roles,
  }));

  // Current user's roles (for display)
  const currentMemberId = user?.id;
  const currentUserEntry = users.find((u) => u.member?.id === currentMemberId);

  async function toggleRole(role: Role, checked: boolean) {
    if (!manageUser) return;
    setWorking(true);
    try {
      if (checked) {
        await assignRole(manageUser.userId, role.id);
      } else {
        await removeRole(manageUser.userId, role.id);
      }
      await refresh();
    } catch (e: any) {
      setError(e.message ?? 'Failed to update role');
    } finally {
      setWorking(false);
    }
  }

  async function handleCreateUser() {
    setCreateError(null);
    if (!createForm.full_name || !createForm.email || !createForm.password) {
      setCreateError('Full name, email, and password are required.');
      return;
    }
    if (createForm.password.length < 8) {
      setCreateError('Password must be at least 8 characters.');
      return;
    }
    setCreating(true);
    try {
      await createUserAccount({
        full_name: createForm.full_name,
        email: createForm.email,
        password: createForm.password,
        phone: createForm.phone || undefined,
        member_code: createForm.member_code || undefined,
        role_slug: createForm.role_slug || 'member',
      });
      setCreateOpen(false);
      setCreateForm(emptyForm);
      await refresh();
    } catch (e: any) {
      setCreateError(e.message ?? 'Failed to create account');
    } finally {
      setCreating(false);
    }
  }

  const manageUserRoles = manageUser
    ? users.find((u) => u.userId === manageUser.userId)?.roles ?? []
    : [];

  return (
    <div>
      <PageTitle
        title="User Management"
        subtitle="Manage user roles and permissions"
        action={
          <div className="flex gap-2">
            <button onClick={() => { setCreateForm(emptyForm); setCreateError(null); setCreateOpen(true); }} className="btn-primary">
              Create Account
            </button>
            <button onClick={refresh} className="btn-outline">
              Refresh
            </button>
          </div>
        }
      />

      {currentUserEntry && (
        <div className="card p-4 mb-6">
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Your current roles</p>
          <div className="flex flex-wrap gap-2">
            {currentUserEntry.roles.length === 0 && (
              <span className="text-sm text-slate-400">No roles assigned</span>
            )}
            {currentUserEntry.roles.map((r) => (
              <Badge key={r.id} status={r.slug} />
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <LoadingState message="Loading users..." />
      ) : error ? (
        <ErrorState message={error} onRetry={refresh} />
      ) : users.length === 0 ? (
        <EmptyState title="No users found" message="Users will appear here once they have roles assigned." />
      ) : (
        <Table headers={['Name', 'Email', 'Roles', 'Actions']}>
          {users.map((u) => (
            <TableRow key={u.userId}>
              <TableCell className="font-medium text-slate-900 dark:text-white">
                {u.member?.full_name ?? 'Unknown user'}
              </TableCell>
              <TableCell>{u.member?.email ?? '—'}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1.5">
                  {u.roles.length === 0 && <span className="text-sm text-slate-400">No roles</span>}
                  {u.roles.map((r) => (
                    <Badge key={r.id} status={r.slug} />
                  ))}
                </div>
              </TableCell>
              <TableCell>
                <button
                  onClick={() => u.member && setManageUser({ userId: u.userId, member: u.member })}
                  className="btn-outline text-sm"
                >
                  Manage Roles
                </button>
              </TableCell>
            </TableRow>
          ))}
        </Table>
      )}

      <Modal
        open={!!manageUser}
        onClose={() => setManageUser(null)}
        title={`Manage Roles — ${manageUser?.member.full_name ?? ''}`}
      >
        <div className="space-y-3">
          {roles.length === 0 && (
            <p className="text-sm text-slate-500 dark:text-slate-400">No roles available.</p>
          )}
          {roles.map((role) => {
            const checked = manageUserRoles.some((r) => r.id === role.id);
            return (
              <label
                key={role.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={working}
                  onChange={(e) => toggleRole(role, e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                />
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{role.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{role.slug}</p>
                </div>
              </label>
            );
          })}
        </div>
        <div className="flex justify-end mt-6">
          <button onClick={() => setManageUser(null)} className="btn-outline">
            Done
          </button>
        </div>
      </Modal>

      <Modal
        open={createOpen}
        onClose={() => !creating && setCreateOpen(false)}
        title="Create Account"
      >
        <div className="space-y-3">
          {createError && (
            <p className="text-sm text-red-600 dark:text-red-400">{createError}</p>
          )}
          <Input
            label="Full Name"
            value={createForm.full_name}
            onChange={(e) => setCreateForm({ ...createForm, full_name: e.target.value })}
          />
          <Input
            label="Email"
            type="email"
            value={createForm.email}
            onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
          />
          <Input
            label="Password"
            type="password"
            value={createForm.password}
            onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
          />
          <Input
            label="Phone (optional)"
            value={createForm.phone}
            onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
          />
          <Input
            label="Member Code (optional, auto-generated if blank)"
            value={createForm.member_code}
            onChange={(e) => setCreateForm({ ...createForm, member_code: e.target.value })}
          />
          <Select
            label="Role"
            value={createForm.role_slug}
            onChange={(e) => setCreateForm({ ...createForm, role_slug: e.target.value })}
          >
            {roles.length === 0 && <option value="member">Member</option>}
            {roles.map((r) => (
              <option key={r.id} value={r.slug}>{r.name}</option>
            ))}
          </Select>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Choose an admin-tier role (e.g. Executive, President) to create an admin account, or leave as Member for a regular member account. Either way this creates a real login plus a member record.
          </p>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={() => setCreateOpen(false)} className="btn-outline" disabled={creating}>
            Cancel
          </button>
          <button onClick={handleCreateUser} className="btn-primary" disabled={creating}>
            {creating ? 'Creating...' : 'Create Account'}
          </button>
        </div>
      </Modal>
    </div>
  );
}