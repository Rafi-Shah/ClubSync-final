import { useEffect, useState, useRef } from 'react';
import {
  PageTitle,
  Select,
  Table,
  TableRow,
  TableCell,
} from '../../components/admin/AdminUI';
import { LoadingState, ErrorState, EmptyState } from '../../components/States';
import {
  getAllMembers,
  getEvents,
  getAllTasks,
  getBudgets,
  getInventory,
  createTask,
  createBudget,
  createInventoryItem,
  createEvent,
} from '../../lib/adminApi';

type ExportTarget = 'members' | 'events' | 'tasks' | 'budgets' | 'inventory';

interface ExportConfig {
  key: ExportTarget;
  label: string;
  fetch: () => Promise<any[]>;
}

const exportConfigs: ExportConfig[] = [
  { key: 'members', label: 'Members', fetch: getAllMembers },
  { key: 'events', label: 'Events', fetch: getEvents },
  { key: 'tasks', label: 'Tasks', fetch: getAllTasks },
  { key: 'budgets', label: 'Budgets', fetch: getBudgets },
  { key: 'inventory', label: 'Inventory', fetch: getInventory },
];

// Members are intentionally excluded from import: creating a real login
// requires a password, which a members export/CSV never contains (and
// shouldn't). Previously "members" was listed here anyway and every
// imported row silently failed with no explanation. Export (Read) for
// members is unaffected — see exportConfigs above.
const importTargets: ExportTarget[] = ['events', 'tasks', 'budgets', 'inventory'];

// ---- CSV helpers ----
function toCSV(rows: any[]): string {
  if (!rows || rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const escape = (val: any) => {
    const s = val === null || val === undefined ? '' : String(val);
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map((h) => escape(row[h])).join(','));
  }
  return lines.join('\n');
}

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"') {
          if (line[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = false;
          }
        } else {
          current += ch;
        }
      } else {
        if (ch === '"') {
          inQuotes = true;
        } else if (ch === ',') {
          result.push(current);
          current = '';
        } else {
          current += ch;
        }
      }
    }
    result.push(current);
    return result;
  };
  const headers = parseLine(lines[0]);
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const values = parseLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] ?? '';
    });
    rows.push(row);
  }
  return rows;
}

function downloadCSV(filename: string, csv: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function ImportExport() {
  const [exporting, setExporting] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  // ---- Import state ----
  const [importTarget, setImportTarget] = useState<ExportTarget>('events');
  const [parsedRows, setParsedRows] = useState<Record<string, string>[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: boolean; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleExport(target: ExportTarget) {
    const config = exportConfigs.find((c) => c.key === target)!;
    setExporting(target);
    setExportError(null);
    try {
      const data = await config.fetch();
      if (data.length === 0) {
        setExportError(`No ${config.label.toLowerCase()} data to export.`);
        return;
      }
      const csv = toCSV(data);
      downloadCSV(`${target}_export_${new Date().toISOString().split('T')[0]}.csv`, csv);
    } catch (e: any) {
      setExportError(e.message ?? `Failed to export ${config.label.toLowerCase()}.`);
    } finally {
      setExporting(null);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setImportResult(null);
    setParseError(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = String(ev.target?.result ?? '');
        const rows = parseCSV(text);
        if (rows.length === 0) {
          setParseError('No data rows found in the CSV file.');
          setParsedRows([]);
          return;
        }
        setParsedRows(rows);
      } catch {
        setParseError('Failed to parse CSV file. Please check the format.');
        setParsedRows([]);
      }
    };
    reader.onerror = () => setParseError('Failed to read the file.');
    reader.readAsText(file);
  }

  function clearImport() {
    setParsedRows([]);
    setFileName('');
    setParseError(null);
    setImportResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleImport() {
    if (parsedRows.length === 0) return;
    setImporting(true);
    setImportResult(null);
    let successCount = 0;
    let errorCount = 0;
    try {
      for (const row of parsedRows) {
        try {
          switch (importTarget) {
            case 'events':
              await createEvent(row);
              successCount++;
              break;
            case 'tasks':
              await createTask(row);
              successCount++;
              break;
            case 'budgets':
              await createBudget(row);
              successCount++;
              break;
            case 'inventory':
              await createInventoryItem(row);
              successCount++;
              break;
          }
        } catch {
          errorCount++;
        }
      }
      setImportResult({
        success: errorCount === 0,
        message: `Import complete: ${successCount} succeeded, ${errorCount} failed.`,
      });
      if (errorCount === 0) {
        clearImport();
      }
    } catch (e: any) {
      setImportResult({ success: false, message: e.message ?? 'Import failed.' });
    } finally {
      setImporting(false);
    }
  }

  const previewHeaders = parsedRows.length > 0 ? Object.keys(parsedRows[0]) : [];

  return (
    <div>
      <PageTitle title="Import / Export" subtitle="Export data to CSV or import from CSV files" />

      {exportError && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-sm">
          {exportError}
        </div>
      )}

      {/* ---- Export Section ---- */}
      <div className="card p-6 mb-6">
        <h2 className="text-lg font-display font-bold text-slate-900 dark:text-white mb-1">Export Data</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          Download data from each table as a CSV file.
        </p>
        <div className="flex flex-wrap gap-3">
          {exportConfigs.map((config) => (
            <button
              key={config.key}
              onClick={() => handleExport(config.key)}
              disabled={exporting === config.key}
              className="btn btn-outline flex items-center gap-2"
            >
              {exporting === config.key ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                  Export {config.label}
                </>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ---- Import Section ---- */}
      <div className="card p-6">
        <h2 className="text-lg font-display font-bold text-slate-900 dark:text-white mb-1">Import Data</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          Upload a CSV file, preview the data, then import into the selected table.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">CSV File</label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileSelect}
              className="block w-full text-sm text-slate-500 dark:text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 dark:file:bg-primary-950/30 dark:file:text-primary-400 cursor-pointer"
            />
            {fileName && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Selected: {fileName}</p>
            )}
          </div>
          <Select
            label="Target Table"
            value={importTarget}
            onChange={(e) => setImportTarget(e.target.value as ExportTarget)}
          >
            {importTargets.map((t) => (
              <option key={t} value={t}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </option>
            ))}
          </Select>
        </div>

        {parseError && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-sm">
            {parseError}
          </div>
        )}

        {importResult && (
          <div
            className={`mb-4 p-3 rounded-lg text-sm ${
              importResult.success
                ? 'bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400'
                : 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400'
            }`}
          >
            {importResult.message}
          </div>
        )}

        {/* Preview */}
        {parsedRows.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Preview ({parsedRows.length} rows)
              </h3>
              <button onClick={clearImport} className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                Clear
              </button>
            </div>
            <div className="card overflow-hidden">
              <div className="overflow-x-auto max-h-80">
                <table className="w-full">
                  <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800">
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      {previewHeaders.map((h) => (
                        <th key={h} className="text-left px-3 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {parsedRows.slice(0, 50).map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        {previewHeaders.map((h) => (
                          <td key={h} className="px-3 py-2 text-xs text-slate-700 dark:text-slate-300 whitespace-nowrap max-w-[200px] truncate">
                            {row[h]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {parsedRows.length > 50 && (
                <div className="px-3 py-2 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800">
                  Showing first 50 of {parsedRows.length} rows
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleImport}
            disabled={parsedRows.length === 0 || importing}
            className="btn btn-primary"
          >
            {importing ? 'Importing...' : 'Import'}
          </button>
          {parsedRows.length > 0 && (
            <button onClick={clearImport} className="btn-outline">
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}