# MEDAURA – Supabase Admin Edition

## Deploy
Upload all files and the entire `admin/` directory to the **root** of your existing GitHub Pages/Cloudflare Pages repository. Do not upload the ZIP itself. Cloudflare Pages will deploy from GitHub. Open `https://medaura-website.pages.dev/admin/`.

## Included
- Existing MEDAURA site and Learning Lab unchanged in appearance and core features.
- `/admin/` authenticated dashboard for courses/events, images and status.
- `public-data.js` loads published courses and events from Supabase.
- `supabase-config.js` contains only the browser-safe publishable key.

## Database requirements
The `courses`, `events`, and `admin_roles` tables and `medaura-images` public Storage bucket with appropriate RLS policies must exist (from setup). Login account must be assigned `super_admin` or `admin` in `admin_roles`. Do not put service_role or secret keys in these files.

## Notes
- Existing sample entries in content.js are replaced by live database results. If Supabase cannot be reached, courses/events are empty rather than displaying sample entries.
- Existing Learning Lab remains browser-local and is NOT stored in Supabase.
- The image bucket is PUBLIC: upload only photos intended for publication. The dashboard does not delete old uploaded images when content is deleted.
- Editor role and resources management are NOT implemented in this version.
- The frontend uses Supabase JS v2 from esm.sh, so an internet connection is required.
- Do not assume the app is production-tested until login, RLS and upload operations are verified on the live site.
