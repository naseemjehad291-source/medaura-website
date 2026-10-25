# MEDAURA bilingual translation update

- Expanded professional English translations for public pages and interface labels.
- Admin files were not modified.
- Arabic remains the original language. English is a visitor-facing presentation layer.
- Dynamically published course, event and team descriptions require editor-provided English text; they are not automatically translated.
- Optional Supabase `site_settings` keys ending `_en` and optional published record fields `title_en`, `description_en`, `name_en`, etc. can supply English translations **only if those fields exist in the current database schema**. No schema migration is included.
- Some longer or newly created user-generated content will remain Arabic until translated manually.
- Test the preview branch, including both language buttons, refresh, dynamic cards, login and mobile layout.
