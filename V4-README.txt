MEDAURA V4 — TEST BRANCH ONLY

Changes:
1. Removed Gallery tab from Super Admin; work-post images and videos remain.
2. Removed Events tab and public Events navigation/page. Database data was NOT deleted.
3. Added Educational Method admin editor.
4. Reduced intro text letter-spacing, preserving animation.
5. Added Contact Form and Partnership Form links to Super Admin.
6. Added full Join MEDAURA editor: intro, heading, description, four cards' titles, descriptions, button text and links.

Upload the contents of this ZIP to GitHub branch medaura-v4, not main. Keep file paths intact.
The V4 editor uses the existing site_settings table. No new SQL migration is required if V3 site_settings works.
Before merging, test all sections and permissions in the Cloudflare Preview deployment.
No Supabase rows or buckets were deleted.
