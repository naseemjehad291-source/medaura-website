MEDAURA translation display fix — 2026-10-29

Changed files:
- language.js: saved per-field translations take precedence over built-in dictionary text; refresh translations when Supabase published content arrives.
- public-data.js: dispatch a content-loaded event after applying Supabase content and localizations.

No SQL changes. No changes to admin roles, certificates or registration.
Deploy as a preview first. Verify: saved translation on Join/About/Courses, AR/EN switching, reload, new course. This is a code-level fix and was not live-tested with your Supabase instance.
