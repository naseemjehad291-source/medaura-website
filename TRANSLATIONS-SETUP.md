# MEDAURA English editorial translation
- Super Admin > 🌐 ترجمة محتوى الموقع (English) allows Arabic-to-English translation pairs.
- Existing Arabic content from site settings, courses, events, team and resources is collected for translation; custom pairs can also be added.
- Translations are stored in `site_settings` under `publicTranslationsEN` (JSON). No schema migration needed.
- Public `language.js` fetches approved translations from Supabase; no external machine translation calls.
- Certificate CTA and student certificate lookup page now have English static labels.
- IMPORTANT: Supabase RLS must allow public SELECT of `site_settings` for English visitors, and super_admin UPSERT. Verify this in preview.
- Text matching is exact; if Arabic text is edited, its translation pair must be updated. The admin UI is not translated.
- No private student data is sent to a third-party translation provider.
