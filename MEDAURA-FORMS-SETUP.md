# MEDAURA Forms — Phase 1

1. Make a backup of the existing Supabase project and website.
2. Review and run `sql/03-medaura-forms.sql` in Supabase SQL Editor. Requires the existing `public.admin_roles` table with `user_id` and `role='super_admin'`.
3. Deploy these files to the development branch first. Sign in to `/admin/` as Super Admin, then select `إدارة النماذج`.
4. Create a draft form, add fields, save, then publish. Public form link: `/form.html?slug=YOUR-SLUG`.
5. Test anonymous submission and confirm it appears only to Super Admin in the responses view. Test with Media Admin and anonymous visitors to verify they cannot access submissions.

## Important
- This release does **not** modify the course creation workflow or automatically connect a course's registration button. That integration is a later phase.
- This release has no public server-side spam rate limit/CAPTCHA. Do not open high-traffic public registration until abuse protection is added.
- Responses export currently fetches the latest 1000 records per form, not the full archive.
- The `admin_roles` permission is enforced with Supabase RLS, not just the UI.
- Public form page currently uses Arabic; bilingual public forms are a later enhancement.
- Forms are not deleted in this phase; they can be closed to stop accepting submissions.
