# MEDAURA bilingual content editor

1. Run `sql/05-translation-admin.sql` in Supabase SQL Editor **after reviewing the SQL**. The added `edited_ar` column stores approved Arabic copy; the original Arabic source key stays stable.
2. Create a translator user in Supabase Auth and grant their UUID using Super Admin > Translation Panel.
3. In the translation panel, select an existing pair, edit the Arabic copy and/or English copy, and save.
4. Public language switch displays the edited Arabic or approved English. Admin remains Arabic.

**Scope:** This edits the *displayed text*, not the original Supabase course descriptions or administrative records. The translator cannot edit course dates, prices, students, or certificates. Editing content already used as an internal identifier may need a separate Super Admin workflow. Test staging first.
