// Shared between the manual Routine editor and the CSV bulk import page.
// day_of_week uses 0=Sunday..6=Saturday, matching the DB column.

export const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

const DAY_ALIASES: Record<string, number> = {
  sunday: 0, sun: 0,
  monday: 1, mon: 1,
  tuesday: 2, tue: 2, tues: 2,
  wednesday: 3, wed: 3,
  thursday: 4, thu: 4, thur: 4, thurs: 4,
  friday: 5, fri: 5,
  saturday: 6, sat: 6,
};

/** Parses a full day name ("Monday") or common abbreviation ("Mon"), case-insensitive. Returns 0-6 or null. */
export function parseDayOfWeek(input: string): number | null {
  const key = input.trim().toLowerCase();
  return key in DAY_ALIASES ? DAY_ALIASES[key] : null;
}

/** Parses a 24-hour "HH:MM" string into minutes-since-midnight, or null if malformed. */
export function parseTimeToMinutes(input: string): number | null {
  const match = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(input.trim());
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

export interface RoutineLike {
  id?: string;
  title: string;
  day_of_week: number;
  start_time: string | null;
  end_time: string | null;
  is_active?: boolean;
}

/**
 * Returns the first existing entry that overlaps the candidate slot on the
 * same day, or null if there's no conflict. Mirrors the DB's
 * routines_no_overlap exclusion constraint so the UI can give an immediate,
 * specific error before ever hitting the database.
 *
 * - excludeId: skip this entry (used when editing an existing routine so it
 *   doesn't conflict with itself).
 * - Inactive entries (is_active === false) are ignored, matching the DB
 *   constraint's WHERE (is_active) clause.
 */
export function findOverlap(
  existing: RoutineLike[],
  candidate: { day_of_week: number; start_time: string; end_time: string },
  excludeId?: string
): RoutineLike | null {
  const candStart = parseTimeToMinutes(candidate.start_time);
  const candEnd = parseTimeToMinutes(candidate.end_time);
  if (candStart === null || candEnd === null) return null;

  for (const r of existing) {
    if (excludeId && r.id === excludeId) continue;
    if (r.is_active === false) continue;
    if (r.day_of_week !== candidate.day_of_week) continue;
    if (!r.start_time || !r.end_time) continue;

    const rStart = parseTimeToMinutes(r.start_time);
    const rEnd = parseTimeToMinutes(r.end_time);
    if (rStart === null || rEnd === null) continue;

    // Half-open interval overlap check: [candStart, candEnd) vs [rStart, rEnd)
    if (candStart < rEnd && rStart < candEnd) {
      return r;
    }
  }
  return null;
}