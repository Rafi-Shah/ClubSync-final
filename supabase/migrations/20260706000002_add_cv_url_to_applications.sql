/*
  # Phase 6: Add CV/Resume upload to recruitment applications

  1. Changes
     - `applications.cv_url` (text, nullable) — public Storage URL of the
       applicant's uploaded CV/resume, stored in the `documents` bucket.
       Nullable because a CV is optional (matches the existing optional
       fields on this table like `experience`).

  2. Notes
     - No RLS changes needed: this column is covered by the existing
       policies on `applications` (anon + authenticated insert; admins
       read all).
*/

alter table applications
  add column if not exists cv_url text;
