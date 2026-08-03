# VEIL SEO / INDEXING POLICY

Updated: 2026-08-03

## Search entry pages

Google and other search engines may index:

- the site root, About, Formation, member profiles, Gallery, Archive, Discography and News;
- the Japanese and English start pages;
- the Japanese editorial policies;
- the paired Japanese and English recorder reading guides.

These URLs must have a route-specific title, description, canonical URL, robots directive, Open Graph metadata and JSON-LD in the HTML returned before JavaScript runs.

## Full adult stories

Japanese and English full story pages remain public but are intentionally excluded from search with `noindex,nofollow` in both HTML and `X-Robots-Tag` headers. They are not listed in `sitemap.xml`.

Do not block `/stories/` in `robots.txt`: crawlers need to fetch the response to observe the `noindex` directive. Changing full stories to `index` is a separate publication decision and must not happen as a side effect of routine SEO work.

## Other excluded routes

- story JSON, local admin and admin endpoints;
- unfinished Terms and Contact pages;
- the 404 page.

The adult-content policy and privacy policy are complete public information pages. They may be indexed, but they are not priority sitemap entries.

## Sources and build checks

- `src/content/seo-pages.json`: route metadata and sitemap eligibility for React routes.
- `tools/build-sitemap.mjs`: generates `public/sitemap.xml` from the route registry and static-page definitions.
- `tools/build-seo-shells.mjs`: creates route-specific HTML shells after the Vite build.
- `tools/check-seo.mjs`: fails the production build when indexing rules, canonical URLs, language alternates or critical metadata drift.

Use `CI=true pnpm run build` before publication. The build must finish with `SEO verification passed`.
