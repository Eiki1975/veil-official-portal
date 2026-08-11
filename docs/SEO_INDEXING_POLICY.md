# VEIL SEO / INDEXING POLICY

Updated: 2026-08-11

## Search entry pages

Google and other search engines may index:

- the site root, About, Formation, member profiles, Gallery, Archive, Discography and News;
- the Japanese and English start pages;
- the Japanese editorial policies;
- the paired Japanese and English recorder reading guides.

These URLs must have a route-specific title, description, canonical URL, robots directive, Open Graph metadata and JSON-LD in the HTML returned before JavaScript runs.

## Full adult stories

Published Japanese and English full story pages may be indexed. Their pre-JavaScript HTML must use `index,follow,max-image-preview:large`, a route-specific title and description, canonical URL, Open Graph metadata and JSON-LD where the shell generator supplies it. They must appear in `sitemap.xml`; paired Japanese and English pages must declare matching hreflang alternates.

Do not block `/stories/` in `robots.txt` and do not apply an `X-Robots-Tag` to published story routes. The story collection for a member is indexable only after that member has at least one published episode. Unreleased story collections, drafts, candidate previews, story JSON and local administration remain excluded from search and from the sitemap.

## Other excluded routes

- story JSON, local admin and admin endpoints;
- unfinished Terms and Contact pages;
- the 404 page.

The adult-content policy and privacy policy are complete public information pages. They may be indexed, but they are not priority sitemap entries.

## Sources and build checks

- `src/content/seo-pages.json`: route metadata and sitemap eligibility for React routes.
- `src/content/serial-stories-index.json` and `src/content/english-serial-stories-index.json`: generated records of published Japanese and English episodes used for sitemap inclusion.
- `tools/build-sitemap.mjs`: generates `public/sitemap.xml` from the route registry and static-page definitions.
- `tools/build-seo-shells.mjs`: creates route-specific HTML shells after the Vite build.
- `tools/check-seo.mjs`: fails the production build when indexing rules, canonical URLs, language alternates or critical metadata drift.

Use `CI=true pnpm run build` before publication. The build must finish with `SEO verification passed`.
