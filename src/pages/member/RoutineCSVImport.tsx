import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { PageTitle } from '../../components/member/MemberUI';
import { parseCSV, toCSV, downloadCSV } from '../../lib/csv';
import { DAY_NAMES, parseDayOfWeek, parseTimeToMinutes, findOverlap, type RoutineLike } from '../../lib/routineTime';
import { getMyRoutines, bulkCreateRoutines, type RoutineInput } from '../../lib/memberApi';

const TEMPLATE_HEADERS = ['day', 'title', 'course_code', 'teacher', 'start_time', 'end_time', 'location', 'description'];
const TEMPLATE_SAMPLE = [
  { day: 'Monday', title: 'Data Structures', course_code: 'CSE201', teacher: 'Dr. Rahman', start_time: '09:00', end_time: '10:30', location: 'Room 204', description: '' },
  { day: 'Wednesday', title: 'Database Lab', course_code: 'CSE202', teacher: 'Ms. Akter', start_time: '14:00', end_time: '16:00', location: 'Lab 3', description: 'Bring laptop' },
];

interface ValidRow { rowNumber: number; input: RoutineInput; }
interface InvalidRow { rowNumber: number; raw: Record<string, string>; reason: string; }

export default function RoutineCSVImport() {
  const { member } = useAuth();
  const [fileName, setFileName] = useState('');
  const [validRows, setValidRows] = useState<ValidRow[]>([]);
  const [invalidRows, setInvalidRows] = useState<InvalidRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ successCount: number; errors: { row: number; message: string }[] } | null>(null);
  const [existingRoutines, setExistingRoutines] = useState<RoutineLike[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function downloadTemplate() {
    downloadCSV('routine_import_template.csv', toCSV(TEMPLATE_SAMPLE.length ? TEMPLATE_SAMPLE : [Object.fromEntries(TEMPLATE_HEADERS.map(h => [h, '']))]));
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !member) return;
    setFileName(file.name);
    setResult(null);
    setValidRows([]);
    setInvalidRows([]);

    // Pull current routines fresh so in-file rows are also checked against
    // what's already saved, not just against each other.
    const current = await getMyRoutines(member.id);
    setExistingRoutines(current);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = String(ev.target?.result ?? '');
      const rows = parseCSV(text);
      validateRows(rows, current);
    };
    reader.readAsText(file);
  }

  function validateRows(rows: Record<string, string>[], current: RoutineLike[]) {
    const valid: ValidRow[] = [];
    const invalid: InvalidRow[] = [];
    // Rows accepted so far in THIS file, so two rows in the same CSV that
    // overlap each other are also caught — not just overlaps against
    // already-saved routines.
    const acceptedSoFar: RoutineLike[] = [...current];

    rows.forEach((raw, idx) => {
      const rowNumber = idx + 2; // +1 for 0-index, +1 for header row
      const title = (raw.title ?? '').trim();
      const dayRaw = (raw.day ?? '').trim();
      const startRaw = (raw.start_time ?? '').trim();
      const endRaw = (raw.end_time ?? '').trim();

      if (!title) {
        invalid.push({ rowNumber, raw, reason: 'Missing course/title.' });
        return;
      }
      const dayOfWeek = parseDayOfWeek(dayRaw);
      if (dayOfWeek === null) {
        invalid.push({ rowNumber, raw, reason: `Unrecognized day "${dayRaw}". Use a full day name (e.g. "Monday").` });
        return;
      }
      const startMinutes = parseTimeToMinutes(startRaw);
      const endMinutes = parseTimeToMinutes(endRaw);
      if (startMinutes === null || endMinutes === null) {
        invalid.push({ rowNumber, raw, reason: `Invalid time format. Use 24-hour HH:MM (e.g. "14:00"), got start="${startRaw}" end="${endRaw}".` });
        return;
      }
      if (endMinutes <= startMinutes) {
        invalid.push({ rowNumber, raw, reason: 'End time must be after start time.' });
        return;
      }

      const candidate = { day_of_week: dayOfWeek, start_time: startRaw, end_time: endRaw };
      const conflict = findOverlap(acceptedSoFar, candidate);
      if (conflict) {
        invalid.push({ rowNumber, raw, reason: `Overlaps with "${conflict.title}" (${DAY_NAMES[dayOfWeek]} ${conflict.start_time?.slice(0, 5)}–${conflict.end_time?.slice(0, 5)}).` });
        return;
      }

      const input: RoutineInput = {
        member_id: member!.id,
        title,
        course_code: raw.course_code?.trim() || null,
        teacher: raw.teacher?.trim() || null,
        day_of_week: dayOfWeek,
        start_time: startRaw,
        end_time: endRaw,
        location: raw.location?.trim() || null,
        description: raw.description?.trim() || null,
      };
      valid.push({ rowNumber, input });
      acceptedSoFar.push({ title, day_of_week: dayOfWeek, start_time: startRaw, end_time: endRaw }); // so later rows check against this one too
    });

    setValidRows(valid);
    setInvalidRows(invalid);
  }

  async function handleImport() {
    if (validRows.length === 0) return;
    setImporting(true);
    try {
      const outcome = await bulkCreateRoutines(validRows.map(r => r.input));
      setResult(outcome);
      if (outcome.errors.length === 0) {
        setValidRows([]);
        setFileName('');
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    } finally {
      setImporting(false);
    }
  }

  return (
    <div>
      <PageTitle
        title="Import Routine (CSV)"
        subtitle="Upload your weekly class schedule from a spreadsheet"
        action={<Link to="/portal/routine" className="btn-outline">Back to Routine</Link>}
      />

      <div className="card p-6 mb-6">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">1. Get the template</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
          Columns: <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">day, title, course_code, teacher, start_time, end_time, location, description</code>.
          Day accepts full names ("Monday") or 3-letter abbreviations ("Mon"). Times must be 24-hour HH:MM.
        </p>
        <button onClick={downloadTemplate} className="btn-outline text-sm">Download Template</button>
      </div>

      <div className="card p-6 mb-6">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">2. Upload &amp; preview</h2>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={handleFileSelect}
          className="block w-full text-sm text-slate-500 dark:text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 dark:file:bg-primary-950/30 dark:file:text-primary-400 cursor-pointer"
        />
        {fileName && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Selected: {fileName}</p>}
      </div>

      {result && (
        <div className={`mb-6 p-3 rounded-lg text-sm ${result.errors.length === 0 ? 'bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400' : 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400'}`}>
          Imported {result.successCount} row(s){result.errors.length > 0 ? `, ${result.errors.length} failed during save (see below).` : '.'}
          {result.errors.length > 0 && (
            <ul className="mt-2 list-disc list-inside">
              {result.errors.map((e, i) => <li key={i}>Row {e.row + 1}: {e.message}</li>)}
            </ul>
          )}
        </div>
      )}

      {invalidRows.length > 0 && (
        <div className="card p-5 mb-6 border-red-200 dark:border-red-900">
          <h3 className="text-sm font-semibold text-red-600 dark:text-red-400 mb-3">
            {invalidRows.length} row(s) rejected — fix these in your CSV and re-upload
          </h3>
          <div className="space-y-1.5 text-xs">
            {invalidRows.map((r) => (
              <div key={r.rowNumber} className="flex gap-2">
                <span className="font-mono text-slate-400 shrink-0">Row {r.rowNumber}</span>
                <span className="text-red-600 dark:text-red-400">{r.reason}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {validRows.length > 0 && (
        <div className="card overflow-hidden mb-6">
          <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Ready to import ({validRows.length} valid row{validRows.length === 1 ? '' : 's'})
            </h3>
          </div>
          <div className="overflow-x-auto max-h-80">
            <table className="w-full">
              <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800">
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  {['Day', 'Title', 'Code', 'Teacher', 'Start', 'End', 'Room'].map((h) => (
                    <th key={h} className="text-left px-3 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {validRows.map((r) => (
                  <tr key={r.rowNumber} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-3 py-2 text-xs whitespace-nowrap">{DAY_NAMES[r.input.day_of_week]}</td>
                    <td className="px-3 py-2 text-xs whitespace-nowrap">{r.input.title}</td>
                    <td className="px-3 py-2 text-xs whitespace-nowrap font-mono">{r.input.course_code ?? '—'}</td>
                    <td className="px-3 py-2 text-xs whitespace-nowrap">{r.input.teacher ?? '—'}</td>
                    <td className="px-3 py-2 text-xs whitespace-nowrap">{r.input.start_time}</td>
                    <td className="px-3 py-2 text-xs whitespace-nowrap">{r.input.end_time}</td>
                    <td className="px-3 py-2 text-xs whitespace-nowrap">{r.input.location ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800">
            <button onClick={handleImport} disabled={importing} className="btn btn-primary disabled:opacity-60">
              {importing ? 'Importing...' : `Import ${validRows.length} Row(s)`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}