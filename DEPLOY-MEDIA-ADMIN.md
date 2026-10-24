# MEDAURA Media Admin — staging implementation

This is **not production ready**. Keep on `medaura-media-admin` branch until Supabase Edge Function deployed and authorization tests completed.

- Same `/admin/` login for super_admin and media_admin.
- media_admin navigation limited to «أعمالنا»; database RLS remains the real security boundary.
- super_admin sees account management and activity log.
- Supabase Edge Function `media-users` requires valid JWT and super_admin role. Uses service-role secret only server-side.
- The existing `media_admin_profiles` table and `is_active_media_admin()` function must already exist.

**Before deployment:** configure and deploy Edge Function with JWT verification enabled. Supabase project secrets SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY are injected server-side. Never paste service-role keys in the frontend. Test two accounts, disabled sessions, and other tables/Storage denied. The activity log currently records database rows only, not Storage operations; user IDs appear rather than names. The public bucket remains public.

**Known limitations:** account disable must be tested under real JWT session and RLS. Super Admin account management depends on Edge Function deployment. Do not merge to main without end-to-end tests.
