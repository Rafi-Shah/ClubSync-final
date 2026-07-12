import { useEffect, useState, useMemo } from 'react';
import { getAllRoutines, getAllMembers } from '../../lib/adminApi';
import { PageTitle, StatCard, Select } from '../../components/admin/AdminUI';
import { LoadingState, ErrorState, EmptyState } from '../../components/States';

interface Member {
  id: string;
  full_name: string;
  email?: string;
  avatar_url?: string | null;
}

interface Routine {
  id: string;
  member_id: string;
  member: { id: string; full_name: string } | null;
  title: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  location: string | null;
  is_active: boolean;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function AvailabilityChecker() {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDay());

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [r, mems] = await Promise.all([getAllRoutines(), getAllMembers()]);
      setRoutines(r as Routine[]);
      setMembers(mems as Member[]);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load availability data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      await load();
    })();
  }, []);

  // Weekly grid: routines grouped by day of week
  const weeklyGrid = useMemo(() => {
    const grid: Record<number, Routine[]> = {};
    for (let i = 0; i < 7; i++) grid[i] = [];
    routines.forEach((r) => {
      if (r.is_active && r.day_of_week >= 0 && r.day_of_week <= 6) {
        grid[r.day_of_week].push(r);
      }
    });
    return grid;
  }, [routines]);

  // Busy routines for the selected day
  const busyByMember = useMemo(() => {
    const map: Record<string, Routine[]> = {};
    (weeklyGrid[selectedDay] ?? []).forEach((r) => {
      if (!r.member_id) return;
      if (!map[r.member_id]) map[r.member_id] = [];
      map[r.member_id].push(r);
    });
    return map;
  }, [weeklyGrid, selectedDay]);

  const availableMembers = useMemo(
    () => members.filter((m) => !busyByMember[m.id]),
    [members, busyByMember],
  );

  const busyMembers = useMemo(
    () => members.filter((m) => busyByMember[m.id]),
    [members, busyByMember],
  );

  const totalBusySlots = Object.values(busyByMember).reduce((sum, arr) => sum + arr.length, 0);

  return (
    <div>
      <PageTitle
        title="Availability Checker"
        subtitle="See who's free and who's busy across the week"
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard label="Total Members" value={members.length} icon="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4z" />
        <StatCard label="Available Today" value={availableMembers.length} icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" color="green" />
        <StatCard label="Busy Today" value={busyMembers.length} icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" color="amber" />
      </div>

      {/* Weekly grid */}
      <div className="card p-5 mb-6">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Weekly Overview</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {DAYS.map((day, i) => {
            const count = (weeklyGrid[i] ?? []).length;
            const isSelected = i === selectedDay;
            return (
              <button
                key={day}
                onClick={() => setSelectedDay(i)}
                className={`p-3 rounded-lg border text-left transition-all ${
                  isSelected
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/30 ring-2 ring-primary-500/30'
                    : 'border-slate-200 dark:border-slate-800 hover:border-primary-300 dark:hover:border-primary-700'
                }`}
              >
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{day.slice(0, 3)}</p>
                <p className="text-lg font-display font-bold text-slate-900 dark:text-white mt-1">{count}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">slots</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Day picker */}
      <div className="card p-5 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-full sm:w-56">
            <Select
              label="Filter by day"
              value={String(selectedDay)}
              onChange={(e) => setSelectedDay(parseInt(e.target.value, 10))}
            >
              {DAYS.map((d, i) => (
                <option key={i} value={i}>
                  {d}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex items-end">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Showing availability for <span className="font-semibold text-slate-900 dark:text-white">{DAYS[selectedDay]}</span>
            </p>
          </div>
        </div>
      </div>

      {loading && <LoadingState message="Loading availability..." />}
      {error && !loading && <ErrorState message={error} onRetry={load} />}
      {!loading && !error && members.length === 0 && (
        <EmptyState title="No members found" message="Add members to check their availability." />
      )}

      {!loading && !error && members.length > 0 && (
        <div className="space-y-6">
          {/* Available Members */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <h2 className="font-display font-bold text-slate-900 dark:text-white">
                Available Members
              </h2>
              <span className="text-sm text-slate-400 dark:text-slate-500">({availableMembers.length})</span>
            </div>
            {availableMembers.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400 py-4">No members available on this day.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {availableMembers.map((m) => (
                  <div key={m.id} className="card p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-950/40 grid place-items-center text-green-600 dark:text-green-400 font-semibold text-sm shrink-0">
                      {m.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-slate-900 dark:text-white truncate">{m.full_name}</p>
                      <p className="text-xs text-green-600 dark:text-green-400">Available</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Busy Members */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <h2 className="font-display font-bold text-slate-900 dark:text-white">
                Busy Members
              </h2>
              <span className="text-sm text-slate-400 dark:text-slate-500">
                ({busyMembers.length} · {totalBusySlots} slots)
              </span>
            </div>
            {busyMembers.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400 py-4">No members are busy on this day.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {busyMembers.map((m) => {
                  const slots = busyByMember[m.id] ?? [];
                  return (
                    <div key={m.id} className="card p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-950/40 grid place-items-center text-amber-600 dark:text-amber-400 font-semibold text-sm shrink-0">
                          {m.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-slate-900 dark:text-white truncate">{m.full_name}</p>
                          <p className="text-xs text-amber-600 dark:text-amber-400">
                            Busy · {slots.length} {slots.length === 1 ? 'slot' : 'slots'}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        {slots
                          .slice()
                          .sort((a, b) => (a.start_time ?? '').localeCompare(b.start_time ?? ''))
                          .map((s) => (
                            <div
                              key={s.id}
                              className="flex items-center justify-between text-xs bg-slate-50 dark:bg-slate-800/50 rounded-lg px-3 py-2"
                            >
                              <span className="font-medium text-slate-700 dark:text-slate-300 truncate">
                                {s.title}
                              </span>
                              <span className="text-slate-500 dark:text-slate-400 shrink-0 ml-2">
                                {s.start_time ?? '—'} – {s.end_time ?? '—'}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
