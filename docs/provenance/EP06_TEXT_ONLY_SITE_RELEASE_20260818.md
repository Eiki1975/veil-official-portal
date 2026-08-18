# VEIL S1 Reina EP06 — text-only bilingual site release

- Release status: public-site source, pending build and production verification
- User authorization: 2026-08-18. The user approved Japanese-and-English publication after confirming that the frozen Japanese manuscript could be read only for the independent English localization.
- Japanese story ID: `season-01-reina-episode-06-canonical-20260817`
- Japanese URL: `/stories/reina/season-1/episode-6/`
- English URL: `/en/stories/reina/season-1/episode-6/`

## Japanese source integrity

| Asset | SHA-256 | Status |
| --- | --- | --- |
| `.veil-admin/story-drafts/season-01-reina/EP06_目を逸らさないで_CANONICAL_20260817.md` | `3f11f23172d145397ec6a286c56c99c89b4db644894fc228e0abf9f3e7c85ad4` | User-approved frozen canonical manuscript; unchanged. |
| `src/content/season-01-reina-episode-06-canonical-published-20260818.md` | `3f11f23172d145397ec6a286c56c99c89b4db644894fc228e0abf9f3e7c85ad4` | Byte-identical public-source copy. |

## English localization

| Asset | SHA-256 | Status |
| --- | --- | --- |
| `src/content/season-01-reina-episode-06-en-20260818.md` | `80d97ecbb1580dcca7c8f93baace68bf608e442f8f22fc8b1e34f75af8e2cd0f` | Independent English localization, reviewed for chronology, adult setting, consent and agency, limited Reina viewpoint, relationship treatment, names, and natural English. |

The English source is independent of the Japanese canonical manuscript. It preserves the events and psychological meaning without changing the Japanese text.

## Visual status

This is an explicitly approved text-only release. The user will add Episode 06 visual records separately.

- No inline story images, visual anchors, captions, or image alt text are included in this release.
- The existing member portrait `public/images/members/v5/reina-amamiya-casual-portrait-20260725.png` (SHA-256 `42a9c6c4e21ba22b2d193f6dfaf3eaf2bdd579ec0bfa5791e93afcb56ef916c5`) is used only as the English page's generic Open Graph image. The Japanese SEO shell similarly uses `public/images/members/v5/reina-amamiya-stage-portrait-20260725.png` (SHA-256 `6b19128a458a01c95eee965d17d216e0463832f22c20956be181cdf84269cca0`) as its generic Open Graph image. Neither is presented as an Episode 06 scene image.
- A later visual update must use the same approved public image URLs for Japanese and English, with corresponding Japanese/English alt text, captions, and story anchors. It must not modify either prose source.

## Release checks

- The Japanese public source is byte-identical to the frozen canonical manuscript.
- Japanese and English routes are linked in both directions.
- The text-only layout omits empty visual rails, galleries, and AI-illustration claims for Episode 06.
- Build and production checks are recorded only after they complete successfully.
