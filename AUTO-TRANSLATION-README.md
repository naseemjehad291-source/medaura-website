# MEDAURA automatic English fallback (public site only)

- Existing human-curated English translations are preferred.
- Untranslated Arabic text on the public homepage is translated on demand using the third-party MyMemory public translation API when EN is selected.
- Arabic is preserved if the service is offline, rate-limited, blocked by CORS, or returns an unusable translation. No quality guarantee is possible.
- For privacy, automatic translation is intentionally disabled on registration forms, certificate lookup and certificate verification, where personal information may appear. Existing static English translations remain available on those pages.
- The public free service may impose usage limits or change its terms. No API key is stored in the site. Review MyMemory terms/privacy before production use.
- Admin pages, Supabase schema, certificate PDF generation and issuance logic are unchanged.
- Test on a staging deployment before publishing.
