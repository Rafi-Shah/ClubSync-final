import { useRef, useState } from 'react';
import { uploadFile, FileValidationError, type UploadBucket } from '../lib/storage';

interface FileUploadProps {
  bucket: UploadBucket;
  /** Folder to scope this upload to — typically the current user/member id. */
  folder: string;
  /** Current file URL, if one is already set (e.g. editing an existing record). */
  value: string | null;
  onChange: (url: string) => void;
  label?: string;
  accept?: string;
  /** Renders a square image preview instead of a generic file chip. */
  imagePreview?: boolean;
  helpText?: string;
}

export default function FileUpload({
  bucket, folder, value, onChange, label, accept = 'image/*',
  imagePreview = true, helpText,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const url = await uploadFile(bucket, folder, file);
      onChange(url);
    } catch (e) {
      const message = e instanceof FileValidationError
        ? e.message
        : 'Upload failed. Please check your connection and try again.';
      setError(message);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div>
      {label && <label className="label">{label}</label>}

      <div className="flex items-center gap-4">
        {imagePreview && (
          <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 grid place-items-center border border-slate-200 dark:border-slate-700">
            {value ? (
              <img src={value} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M4 8h.01M4 20h16a2 2 0 002-2V6a2 2 0 00-2-2H4a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            )}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="btn-outline text-sm disabled:opacity-60 disabled:cursor-wait"
            aria-busy={uploading}
          >
            {uploading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" aria-hidden="true" />
                Uploading...
              </>
            ) : value ? 'Replace File' : 'Upload File'}
          </button>
          {!imagePreview && value && (
            <a href={value} target="_blank" rel="noopener noreferrer" className="ml-3 text-sm text-primary-600 hover:underline truncate">
              View current file
            </a>
          )}
          {helpText && !error && <p className="text-xs text-slate-400 mt-1.5">{helpText}</p>}
          {error && (
            <p className="text-xs text-red-600 dark:text-red-400 mt-1.5" role="alert">{error}</p>
          )}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </div>
  );
}
