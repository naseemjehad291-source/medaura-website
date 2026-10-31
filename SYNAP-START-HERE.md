# SYNAP — visual redesign preview

This is a separate visual prototype based on the supplied site ZIP and the supplied Khalil logo.

- Open `index.html` to preview the visual design and static sections.
- Original routing, course and admin JavaScript architecture retained for migration.
- **Supabase is intentionally DISCONNECTED**: configure a separate SYNAP project in `supabase-config.js` before testing login, publishing or dynamic content. Do not use the former MEDAURA database or production credentials.
- Original `CNAME` was removed; no domain is configured.
- New design lives in `synap-theme.css`; old inline styles remain under it for compatibility.
- The logo was extracted from the user-supplied JPEG, not recreated; an original transparent PNG/SVG is preferable for final production.
- Admin, translations, database schema, and mobile UX require end-to-end QA before launch. This is a **design preview, not a production-certified release**.
