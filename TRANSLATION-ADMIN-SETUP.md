# MEDAURA Translation Admin setup
1. In Supabase SQL Editor run `sql/05-translation-admin.sql` **once**.
2. Create a translator user in Supabase Authentication > Users (or invite via the dashboard). Copy its User UUID.
3. Log in to `admin/translations.html` with the Super Admin account. In "إضافة حساب مترجم", paste the new user's UUID and activate it.
4. The translator signs in at `admin/translations.html` and can edit **only** English translation pairs. No changes to the existing admin_roles table or course/certificate policies.
5. Public English translations are loaded from `medaura_public_translations` via the Supabase public read policy. AR keeps original text.
6. Existing translations in the built-in dictionary remain available. This panel manages custom Arabic-to-English pairs, including text written by Super Admin.
7. Check both AR and EN in a preview deployment. Text matching is exact; when Arabic content changes, update its English pair.
8. No automatic translation API is called. Never add sensitive personal data to the translation list.
