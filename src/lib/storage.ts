import { supabase } from './supabase';

export type UploadBucket = 'avatars' | 'gallery' | 'certificates' | 'documents' | 'reports';

interface UploadOptions {
  /** Max file size in megabytes. */
  maxSizeMB?: number;
  /** Allowed MIME types/prefixes, e.g. ['image/'] or ['application/pdf']. */
  allowedTypes?: string[];
}

const DEFAULTS: Record<UploadBucket, Required<UploadOptions>> = {
  avatars: { maxSizeMB: 3, allowedTypes: ['image/'] },
  gallery: { maxSizeMB: 8, allowedTypes: ['image/'] },
  certificates: { maxSizeMB: 5, allowedTypes: ['application/pdf', 'image/'] },
  documents: { maxSizeMB: 5, allowedTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument'] },
  reports: { maxSizeMB: 10, allowedTypes: ['application/pdf'] },
};

export class FileValidationError extends Error {}

function validateFile(file: File, bucket: UploadBucket, options?: UploadOptions) {
  const { maxSizeMB, allowedTypes } = { ...DEFAULTS[bucket], ...options };

  if (file.size > maxSizeMB * 1024 * 1024) {
    throw new FileValidationError(`File is too large. Maximum size is ${maxSizeMB}MB.`);
  }

  const isAllowed = allowedTypes.some(t => file.type.startsWith(t));
  if (!isAllowed) {
    throw new FileValidationError(`File type "${file.type || 'unknown'}" is not allowed for this upload.`);
  }
}

function safeFileName(file: File): string {
  const ext = file.name.includes('.') ? file.name.split('.').pop() : '';
  const base = crypto.randomUUID();
  return ext ? `${base}.${ext.toLowerCase().replace(/[^a-z0-9]/g, '')}` : base;
}

/**
 * Uploads a file to the given Supabase Storage bucket under `folder/`,
 * validating size + MIME type first. Returns the public URL.
 *
 * `folder` should scope the file to the current user, e.g. the member's id,
 * so Storage RLS policies (see the storage migration) can enforce that people
 * only write inside their own folder.
 */
export async function uploadFile(
  bucket: UploadBucket,
  folder: string,
  file: File,
  options?: UploadOptions,
): Promise<string> {
  validateFile(file, bucket, options);

  const path = `${folder}/${safeFileName(file)}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });
  if (error) throw error;

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/** Deletes a previously-uploaded file, given its full storage path (not the public URL). */
export async function deleteFile(bucket: UploadBucket, path: string): Promise<void> {
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) throw error;
}

/** Extracts the storage path from a Supabase public URL, for use with deleteFile(). */
export function pathFromPublicUrl(bucket: UploadBucket, publicUrl: string): string | null {
  const marker = `/storage/v1/object/public/${bucket}/`;
  const idx = publicUrl.indexOf(marker);
  return idx === -1 ? null : publicUrl.slice(idx + marker.length);
}