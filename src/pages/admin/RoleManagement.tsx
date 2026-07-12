import { useEffect, useState } from 'react';
import {
  PageTitle,
  Badge,
} from '../../components/admin/AdminUI';
import { LoadingState, ErrorState, EmptyState } from '../../components/States';
import {
  getRoles,
  getPermissions,
  getRolePermissions,
  toggleRolePermission,
} from '../../lib/adminApi';

interface Role {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  is_system: boolean | null;
}

interface Permission {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
}

interface RolePermission {
  role_id: number;
  permission_id: number;
  permission: Permission;
}

function getCategory(slug: string): string {
  const prefix = slug.split('_')[0];
  const known = ['manage', 'view', 'create', 'edit', 'delete', 'admin', 'assign', 'approve'];
  return known.includes(prefix) ? prefix : 'other';
}

export default function RoleManagement() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRoleId, setExpandedRoleId] = useState<number | null>(null);
  const [togglingKey, setTogglingKey] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const [r, p, rp] = await Promise.all([getRoles(), getPermissions(), getRolePermissions()]);
      setRoles(r as Role[]);
      setPermissions(p as Permission[]);
      setRolePermissions(rp as unknown as RolePermission[]);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load roles and permissions.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    (async () => {
      await refresh();
    })();
  }, []);

  function hasPermission(roleId: number, permissionId: number): boolean {
    return rolePermissions.some((rp) => rp.role_id === roleId && rp.permission_id === permissionId);
  }

  async function handleToggle(roleId: number, permissionId: number, enable: boolean) {
    const key = `${roleId}-${permissionId}`;
    setTogglingKey(key);
    try {
      await toggleRolePermission(roleId, permissionId, enable);
      if (enable) {
        const perm = permissions.find((p) => p.id === permissionId);
        if (perm) {
          setRolePermissions([...rolePermissions, { role_id: roleId, permission_id: permissionId, permission: perm }]);
        }
      } else {
        setRolePermissions(rolePermissions.filter((rp) => !(rp.role_id === roleId && rp.permission_id === permissionId)));
      }
    } catch (e: any) {
      setError(e.message ?? 'Failed to toggle permission.');
    } finally {
      setTogglingKey(null);
    }
  }

  // Group permissions by category
  const groupedPermissions = permissions.reduce<Record<string, Permission[]>>((acc, perm) => {
    const cat = getCategory(perm.slug);
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(perm);
    return acc;
  }, {});
  const categoryOrder = ['manage', 'view', 'create', 'edit', 'delete', 'admin', 'assign', 'approve', 'other'];
  const sortedCategories = Object.keys(groupedPermissions).sort(
    (a, b) => categoryOrder.indexOf(a) - categoryOrder.indexOf(b)
  );

  return (
    <div>
      <PageTitle title="Role Management" subtitle="Manage roles and their permissions" />

      {loading && <LoadingState message="Loading roles..." />}
      {error && <ErrorState message={error} onRetry={refresh} />}

      {!loading && !error && roles.length === 0 && (
        <EmptyState title="No roles" message="Roles will appear here once defined." />
      )}

      {!loading && !error && roles.length > 0 && (
        <div className="space-y-4">
          {roles.map((role) => {
            const isExpanded = expandedRoleId === role.id;
            const rolePermCount = rolePermissions.filter((rp) => rp.role_id === role.id).length;
            return (
              <div key={role.id} className="card overflow-hidden">
                {/* Role header (clickable) */}
                <button
                  onClick={() => setExpandedRoleId(isExpanded ? null : role.id)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary-50 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400 grid place-items-center">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                      </svg>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-slate-900 dark:text-white">{role.name}</h3>
                        {role.is_system && <Badge status="active" />}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {role.slug} · {rolePermCount} permission{rolePermCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {role.description && (
                      <span className="hidden sm:block text-sm text-slate-500 dark:text-slate-400 max-w-xs truncate">
                        {role.description}
                      </span>
                    )}
                    <svg
                      className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </div>
                </button>

                {/* Expanded permissions */}
                {isExpanded && (
                  <div className="border-t border-slate-200 dark:border-slate-800 p-5 bg-slate-50/50 dark:bg-slate-800/20">
                    <div className="space-y-6">
                      {sortedCategories.map((category) => (
                        <div key={category}>
                          <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 capitalize">
                            {category} Permissions
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                            {groupedPermissions[category].map((perm) => {
                              const enabled = hasPermission(role.id, perm.id);
                              const key = `${role.id}-${perm.id}`;
                              const isToggling = togglingKey === key;
                              return (
                                <label
                                  key={perm.id}
                                  className="flex items-center gap-3 p-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
                                >
                                  <div className="relative flex items-center">
                                    <input
                                      type="checkbox"
                                      checked={enabled}
                                      disabled={isToggling}
                                      onChange={(e) => handleToggle(role.id, perm.id, e.target.checked)}
                                      className="sr-only peer"
                                    />
                                    <div className="w-9 h-5 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:bg-primary-600 peer-focus:ring-2 peer-focus:ring-primary-500 peer-focus:ring-offset-2 transition-colors" />
                                    <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{perm.name}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{perm.slug}</p>
                                  </div>
                                  {isToggling && (
                                    <div className="w-4 h-4 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
                                  )}
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
