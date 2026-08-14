# VEIL Season 01 Reina EP05 — Site Release Provenance

## Release scope

- Episode: Season 01, Reina Amamiya, Episode 05 — `帰らない夜` / *The Night She Doesn't Go Home*
- Site release date: 2026-08-15
- Scope: Japanese and English story pages plus the same eight user-approved visual records.
- Excluded: social posts, newsletters, and any change to the frozen Japanese canonical manuscript.

## Approval record

- The full Japanese EP05 manuscript was user-approved and frozen as the current canonical manuscript on 2026-08-14.
- The user approved the final eight EP05 visual candidates and authorized upload and site publication on 2026-08-15.
- The user then expressly confirmed simultaneous Japanese and English publication on 2026-08-15.

## Japanese source integrity

- Frozen source: `.veil-admin/story-drafts/season-01-reina/EP05_帰らない夜_CANONICAL_20260814.md`
- Site source copy: `src/content/season-01-reina-episode-05-canonical-published-20260815.md`
- SHA-256 of both files: `4e0a4f234d4a34961dceffb1389a70c02986eb96dc61ab0c8b5f0363abcadeef`
- SHA-256 of the frozen `## 本文` section: `6e3c1e8bb3244198ef06270985ed7421777f768cdbf5ca5b732461c59c0f6dba`
- English localization source: `src/content/season-01-reina-episode-05-en-20260815.md`
- English source SHA-256: `06d68cdfdb77515517a894fd10bc75415d9b723d32ea3bd6f22286f8a230a12b`

The Japanese publication source is a byte-identical copy of the frozen canonical manuscript. The English source is a localization for the bilingual release; it is not a replacement canonical manuscript.

## Visual record mapping

All source candidates remain in `veil_image_pipeline/candidate-comparisons/EP05_帰らない夜_ChatGPTCandidates_20260814/`. The release copies below are new immutable public files; no existing public image was overwritten.

| Record | Approved source candidate | Public release copy | SHA-256 | Japanese insertion point |
| --- | --- | --- | --- | --- |
| 01 | `SC01_グラスへ水を注ぐ_CHATGPT_DRAFT_01_20260814.png` | `public/images/stories/season-01-reina/episode-05-visual-records-20260815/ep05-sc01-water-pour-v1.png` | `df1ed0e8437c026e274ed19c62bfa967e4fb1594b8fe170ac72161b37dcb6e1b` | afterIndex 34 |
| 02 | `SC02_返せなかった言葉_CHATGPT_DRAFT_01_20260814.png` | `public/images/stories/season-01-reina/episode-05-visual-records-20260815/ep05-sc02-unanswered-words-v1.png` | `e8b188a873c17869c62caa1d32100b6561d34cd25dda8818998be5af9b127ea0` | afterIndex 68 |
| 03 | `SC03_肩へ落ちる黒_CHATGPT_DRAFT_01_20260814.png` | `public/images/stories/season-01-reina/episode-05-visual-records-20260815/ep05-sc03-black-falls-to-shoulder-v1.png` | `3bfc2fb61cd6cb9b4356baf1ef6a9d144ae06b0d9276c77d07cf4779bffd0a8a` | afterIndex 98 |
| 04 | `SC04_音の話が続く_CHATGPT_DRAFT_01_20260814.png` | `public/images/stories/season-01-reina/episode-05-visual-records-20260815/ep05-sc04-music-talk-continues-v1.png` | `538088cdeead22741965adaf27bf6b23506278924f9864d00c4d4cd88d8a9bb9` | afterIndex 182 |
| 05 | `SC05_時刻を見ても_CHATGPT_DRAFT_01_20260814.png` | `public/images/stories/season-01-reina/episode-05-visual-records-20260815/ep05-sc05-even-after-checking-time-v1.png` | `7c4b5920f236fbf5389ac968f039cf8ba9cf9f33e1ae7cdb5c48580f29dc1b3d` | afterIndex 220 |
| 06 | `SC07_初めて呼んだ名_CHATGPT_DRAFT_01_20260814.png` | `public/images/stories/season-01-reina/episode-05-visual-records-20260815/ep05-sc06-first-name-v1.png` | `2404feb973cd7ed78279e56b939e0d58a97af04d76232d1200dd0d0840fe706b` | afterIndex 252 |
| 07 | `SC06_閉店後の歩道_CHATGPT_DRAFT_01_20260814.png` | `public/images/stories/season-01-reina/episode-05-visual-records-20260815/ep05-sc07-sidewalk-after-closing-v1.png` | `e9f6f56ff22c196a8bb223025757cda73a96bdd3d1efe6b94662bdb3c11d9f8f` | afterIndex 278 |
| 08 | `SC08_灯りの残るドア_CHATGPT_DRAFT_01_20260814.png` | `public/images/stories/season-01-reina/episode-05-visual-records-20260815/ep05-sc08-lit-door-v1.png` | `6eabb5914bfe0ceaa62bc7a80894dced1af85019c1864586e9f22668e8923fc6` | afterIndex 292 |

Records 06 and 07 are intentionally ordered by story chronology: the source candidate titled `初めて呼んだ名` occurs before the source candidate titled `閉店後の歩道`. Both original candidates are retained unchanged.

The English page uses the same image URLs. Its eight exact English anchor sentences are checked by the English-story build before output.
