# MEDAURA Translation Admin account management

The SQL `sql/05-translation-admin.sql` was already run by the site owner; do not rerun it.

Deploy this ZIP to the site and deploy the **new Supabase Edge Function** `supabase/functions/translator-users/index.ts` as `translator-users` using the same process as the existing `media-users` function. Without that function, the new panel cannot create/manage accounts. The function requires the standard Supabase environment secrets and checks the caller's `admin_roles.role = super_admin` server-side.

Log in as Super Admin > 🌐 إدارة المترجمين > create translator by email/password. Translator logs in at `/admin/translations.html`.

The account creation uses Supabase Admin API in a server-side Edge Function; never place a service role key in the frontend. Disabling a user prevents new authentication but may not immediately revoke existing JWTs until expiration; for immediate translation-write revocation, remove their row from `medaura_translation_editors`.

Test on staging first. No modifications to media-users function or certificate code.
