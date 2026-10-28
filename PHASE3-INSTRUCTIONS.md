# MEDAURA — Certificates Phase 3

1. Run `sql/04-certificate-public-lookup.sql` in Supabase SQL Editor **before** publishing the updated website.
2. Upload the entire ZIP contents to the same GitHub branch as before.
3. Admin > Certificates > choose a course under **الشهادات الصادرة** and download a PDF for a previously issued certificate.
4. Open `certificate.html`, enter an existing university ID, and test the PDF download.
5. Scan the PDF QR and check `verify.html` shows the same certificate.

Notes:
- PDF is generated client-side from a live certificate layout; no files are stored in Supabase Storage.
- The PDF depends on third-party browser libraries loaded from cdnjs; an internet connection is needed.
- University-ID-only lookup is public as requested. It allows anyone knowing an ID to access associated certificate details. Deploy rate limiting / anti-automation protections before broad public launch.
- Existing certificate records are reused; this does not reissue them.
- Certificate date is currently the course's `issue_date`. Editing the course date later will also change the displayed date for existing certificates; freeze it before issuing production certificates or implement a per-certificate date snapshot.
- The certificate is an HTML-rendered visual approximation of the approved mockup, not a pixel-identical reproduction.
