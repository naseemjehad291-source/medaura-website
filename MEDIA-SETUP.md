# MEDAURA Media Admin — staged deployment

1. Apply `sql/02-media-profiles.sql` in Supabase SQL Editor. This creates a private server-managed table.
2. Deploy `supabase/functions/manage-media-admins/index.ts` as Supabase Edge Function named `manage-media-admins` with **JWT verification enabled**. Function uses Supabase-managed `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` environment variables. Never put service-role secrets in frontend or GitHub.
3. Upload changed site files to the `medaura-media-admin` branch, not main; test Cloudflare preview.
4. Test with two disposable accounts and verify media users cannot access other tables, Storage folders, or admin tabs.
5. IMPORTANT: disable action bans new logins but may not revoke an already-issued access JWT immediately. Add an explicit disabled check to RLS policies before treating disable as immediate revocation. Existing policies only check `admin_roles.role`; therefore do NOT rely on disable as a full access cutoff until this hardening is applied.
6. Activity log covers table modifications only; direct Storage uploads/deletions are not included. Display names for deleted accounts may show their IDs.
7. Public bucket URLs remain public, independent of authenticated Storage policies.

This package is a staged implementation, not production-approved until end-to-end security tests pass.
