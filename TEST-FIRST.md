# MEDAURA — Media Admin staging build

This is a TEST build for GitHub branch `medaura-media-admin` only. Do not merge into `main` before tests.

## Included
- Unified login and role-limited menu for `media_admin`.
- Work post editing and direct publishing for active media admins.
- Super Admin media user management calling the ALREADY deployed `media-users` Edge Function.
- Activity log display from `admin_activity_log` (table changes only, not Storage operations).

## Preconditions
- `media-users` deployed with its Super Admin server-side authorization, and JWT legacy gateway verification OFF (function still checks bearer token itself).
- `admin_roles`, `media_admin_profiles`, `is_active_media_admin()`, audit triggers and proper RLS/storage policies installed.
- Media accounts have NOT been created yet. Create them only after verifying the Super Admin list action.

## Safe testing
1. Upload only to the testing branch; preview it separately. Do not merge or deploy to production.
2. Sign in as Super Admin, open `إدارة الإعلاميين`, confirm list loads (likely empty). Never share passwords or JWTs.
3. Create two media accounts using the UI, then test their access to `أعمالنا` only. Do not publish test content to public visitors unless intended.
4. Verify forbidden API calls to other tables and Storage paths, disabled account behavior, and audit log.

## Limitations
- Existing Supabase SQL/storage policies were not reverified end-to-end by this ZIP build.
- Super Admin user management function has no fully atomic cross-service account creation/disable.
- Audit display shows actor UUID, not display name, and does not cover Storage object changes.
- A staging branch alone does not isolate production Supabase data; this frontend uses the same configured project. Test cautiously.
