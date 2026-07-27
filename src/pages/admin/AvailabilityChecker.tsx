import { useEffect, useState } from 'react';
import { PageTitle, StatCard, Select, Input } from '../../components/admin/AdminUI';
import { LoadingState, ErrorState, EmptyState } from '../../components/States';
import { findAvailableMembers, getDepartments, getRoles, type AvailabilityResult } from '../../lib/adminApi';
import { DAY_NAMES, parseTimeToMinutes } from '../../lib/routineTime';

interface Department { id: string; name: string; }
interface Role { id: number; slug: string; name: string; }

export default function AvailabilityChecker() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);

  const [dayOfWeek, setDayOfWeek] = useState<number>(new Date().getDay());
  const [startTime, setStartTime] = useState('14:00');
  const [endTime, setEndTime] = useState('16:00');

  const [roleSlug, setRoleSlug] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [batch, setBatch] = useState('');
  const [semester, setSemester] = useState('');
  const [committeeOnly, setCommitteeOnly] = useState(false);
  const [search, setSearch] = useState('');

  const [results, setResults] = useState<AvailabilityResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingFilters, setLoadingFilters] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeError, setTimeError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [d, r] = await Promise.all([getDepartments(), getRoles()]);
        setDepartments(d as Department[]);
        setRoles(r as Role[]);
      } catch {
        // Filters are optional enhancements — a failure here shouldn't block search.
      } finally {
        setLoadingFilters(false);
      }
    })();
  }, []);

  async function runSearch() {
    setTimeError(null);
    const startMinutes = parseTimeToMinutes(startTime);
    const endMinutes = parseTimeToMinutes(endTime);
    if (startMinutes === null || endMinutes === null) {
      setTimeError('Enter valid start and end times.');
      return;
    }
    if (endMinutes <= startMinutes) {
      setTimeError('End time must be after the start time.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await findAvailableMembers({
        dayOfWeek,
        startMinutes,
        endMinutes,
        roleSlugs: roleSlug ? [roleSlug] : undefined,
        departmentIds: departmentId ? [departmentId] : undefined,
        batch: batch || undefined,
        semester: semester || undefined,
        committeeOnly: committeeOnly || undefined,
        search: search || undefined,
        limit: 300,
      });
      setResults(data);
    } catch (e: any) {
      setError(e.message ?? 'Failed to search availability.');
    } finally {
      setLoading(false);
    }
  }

  // Run once on load with the default window, then again whenever the
  // person clicks "Search" — not on every keystroke, to avoid unnecessary
  // API calls while typing a search term or picking filters.
  useEffect(() => { runSearch(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const available = (results ?? []).filter(r => r.is_available);
  const busy = (results ?? []).filter(r => !r.is_available);

  return (
    <div>
      <PageTitle
        title="Availability Finder"
        subtitle="Find members whose class routine is clear for a specific day and time window"
      />

      <div className="card p-5 mb-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Select label="Day" value={String(dayOfWeek)} onChange={(e) => setDayOfWeek(parseInt(e.target.value, 10))}>
            {DAY_NAMES.map((d, i) => <option key={i} value={i}>{d}</option>)}
          </Select>
          <Input label="Start Time" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          <Input label="End Time" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
          <div className="flex items-end">
            <button onClick={runSearch} disabled={loading} className="btn btn-primary w-full disabled:opacity-60">
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>
        {timeError && <p className="text-sm text-red-600 dark:text-red-400">{timeError}</p>}

        {/* Smart filtering */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">Smart Filters</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <Select label="Club Role" value={roleSlug} onChange={(e) => setRoleSlug(e.target.value)} disabled={loadingFilters}>
              <option value="">Any role</option>
              {roles.map((r) => <option key={r.slug} value={r.slug}>{r.name}</option>)}
            </Select>
            <Select label="Department" value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} disabled={loadingFilters}>
              <option value="">Any department</option>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </Select>
            <Input label="Batch" value={batch} onChange={(e) => setBatch(e.target.value)} placeholder="e.g. 2022" />
            <Input label="Semester" value={semester} onChange={(e) => setSemester(e.target.value)} placeholder="e.g. 6th" />
            <Input label="Search Name / ID" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Type to filter..." />
          </div>
          <label className="flex items-center gap-2 mt-3 text-sm text-slate-700 dark:text-slate-300">
            <input type="checkbox" checked={committeeOnly} onChange={(e) => setCommitteeOnly(e.target.checked)} className="rounded border-slate-300 text-primary-600 focus:ring-primary-500" />
            Executive committee members only
          </label>
        </div>
      </div>

      {results && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <StatCard label="Matched" value={results.length} icon="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4z" />
          <StatCard label="Available" value={available.length} icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" color="green" />
          <StatCard label="Busy" value={busy.length} icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" color="amber" />
        </div>
      )}

      {loading && <LoadingState message="Searching availability..." />}
      {error && !loading && <ErrorState message={error} onRetry={runSearch} />}
      {!loading && !error && results && results.length === 0 && (
        <EmptyState title="No members matched" message="Try widening the time window or clearing a filter." />
      )}

      {!loading && !error && results && results.length > 0 && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800">
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  {['Status', 'Name', 'Student ID', 'Department', 'Position', 'Phone', 'Conflict'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {results.map((r) => (
                  <tr key={r.member_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      {r.is_available ? (
                        <span className="inline-flex items-center gap-1.5 text-green-600 dark:text-green-400 text-sm font-medium">
                          <span className="w-2 h-2 rounded-full bg-green-500" /> Available
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-red-600 dark:text-red-400 text-sm font-medium">
                          <span className="w-2 h-2 rounded-full bg-red-500" /> Busy
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-white whitespace-nowrap">{r.full_name}</td>
                    <td className="px-4 py-3 text-sm text-slate-500 whitespace-nowrap font-mono">{r.member_code}</td>
                    <td className="px-4 py-3 text-sm text-slate-500 whitespace-nowrap">{r.department_names ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-slate-500 whitespace-nowrap">{r.position_title}</td>
                    <td className="px-4 py-3 text-sm text-slate-500 whitespace-nowrap">{r.phone ?? '—'}</td>
                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                      {!r.is_available && r.conflict_title
                        ? `${r.conflict_title} (${r.conflict_start?.slice(0, 5)}–${r.conflict_end?.slice(0, 5)})`
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}