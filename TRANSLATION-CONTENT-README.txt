MEDAURA — Content-linked Translation Admin

1. Back up your Supabase database and deploy this ZIP to a preview environment first.
2. In Supabase SQL Editor, review and execute TRANSLATION-CONTENT-SQL.sql once. It creates a new translations table and a restricted save function.
3. Deploy the updated website files. Log in at admin/translations.html.
4. New courses/events/team entries appear after clicking تحديث المحتوى. Edits to Arabic update the actual original database field; English is stored by entity ID and field name.
5. Existing translations in medaura_public_translations remain intact. New translations take precedence in public-data.js when source text matches.
6. IMPORTANT: library resources in resourcesJSON are not yet editable in this release, to avoid letting a translator overwrite URLs or resource metadata in a single JSON setting. Static text embedded in HTML/JS also remains outside this editor.
7. No production database changes have been executed by this ZIP. Test RLS and the translation function in preview before publishing.
