import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

const root = process.cwd();
const indexPath = "src/content/english-serial-stories-index.json";

const escapeHtml = (value) => value
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

function extractEnglishText(source) {
  const match = source.match(/^## English text\s*$([\s\S]*?)^## Localization ledger/m);
  if (!match) throw new Error("English story source is missing an English text section.");
  return match[1].trim().split(/\n\s*\n/).map((paragraph) => paragraph.trim()).filter(Boolean);
}

const episodes = [
  {
    storyId: "season-01-reina-episode-01-canonical-20260727",
    episode: 1,
    source: "src/content/season-01-reina-episode-01-en-20260802.md",
    output: "public/en/stories/reina/season-1/episode-1/index.html",
    jpUrl: "/stories/reina/season-1/episode-1/",
    enUrl: "/en/stories/reina/season-1/episode-1/",
    title: "After Being Seen",
    updatedAt: "2026-08-02",
    description: "After a VEIL show, Reina Amamiya notices a gaze she cannot explain away. An adult fictional episode from VEIL.",
    ogImage: "/images/stories/season-01-reina/episode-01-illustrations-20260727/01-ladder-hem-v2-small-livehouse.png",
    ogImageAlt: "Reina Amamiya reaches toward tape on a wall after a VEIL show.",
    images: [
    {
      id: "ep01-06-heels-off",
      alt: "Reina Amamiya holds her heels before climbing a ladder in sheer skin-tone stockings.",
      caption: "VISUAL RECORD 06 / HEELS OFF",
      after: "When she slipped off her heels, she suddenly felt shorter.",
    },
    {
      id: "ep01-01-ladder-hem",
      alt: "Reina Amamiya reaches toward tape high on the wall from a ladder in a small live-music club.",
      caption: "ILLUSTRATION 01 / AFTER BEING SEEN",
      after: "Her fingertips reached the edge of the tape.",
    },
    {
      id: "ep01-02-unseen-gaze",
      alt: "Reina peels tape from a wall in the dimness of a small live-music club.",
      caption: "ILLUSTRATION 02 / UNSEEN GAZE",
      after: "But she knew where he was looking.",
    },
    {
      id: "ep01-03-first-lie",
      alt: "Reina adjusts the hem of her skirt beside equipment after coming down from the ladder.",
      caption: "ILLUSTRATION 03 / THE FIRST LIE",
      after: "It simply was not the whole reason her face had gone red.",
    },
    {
      id: "ep01-07-self-confrontation",
      alt: "Reina faces her own reflection in the dressing room after the show.",
      caption: "VISUAL RECORD 07 / SELF CONFRONTATION",
      after: "The thought came to her, and Reina glared at her own reflection.",
    },
    {
      id: "ep01-09-after-he-left",
      alt: "From below, Reina is seen from behind on the ladder after the drummer has left.",
      caption: "VISUAL RECORD 09 / AFTER HE LEFT",
      after: "The door closed again almost at once.",
    },
    {
      id: "ep01-10-down-from-ladder",
      alt: "Reina lowers her gaze under work lights after coming down from the ladder.",
      caption: "VISUAL RECORD 10 / DOWN FROM THE LADDER",
      after: "Reina climbed down one step at a time. Only after both feet touched the floor did she straighten the hem of her skirt. Her fingertips were damp; the stockings clung to the insides of her thighs.",
    },
    {
      id: "ep01-04-closed-door",
      alt: "Reina holds her stage outfit while looking at the closed dressing-room door.",
      caption: "ILLUSTRATION 04 / THE CLOSED DOOR",
      after: "Then, afterward, the smallest trace of disappointment.",
    },
    {
      id: "ep01-05-night-turn",
      alt: "Reina turns back toward the small live-music club at night.",
      caption: "ILLUSTRATION 05 / TURNING BACK",
      after: "As she walked, Reina looked back at the club one more time.",
    },
    {
      id: "ep01-08-exit-smile",
      alt: "Reina restores her practiced smile near the exit of the small live-music club.",
      caption: "VISUAL RECORD 08 / EXIT",
      after: "Reina dipped her head with her usual smile.",
    },
    ],
  },
  {
    storyId: "season-01-reina-episode-02-canonical-20260802",
    episode: 2,
    source: "src/content/season-01-reina-episode-02-en-20260802.md",
    output: "public/en/stories/reina/season-1/episode-2/index.html",
    jpUrl: "/stories/reina/season-1/episode-2/",
    enUrl: "/en/stories/reina/season-1/episode-2/",
    title: "The Second Look",
    updatedAt: "2026-08-03",
    description: "At a shared-bill show, Reina Amamiya cannot stop returning to the moment she saw more than she meant to. An adult fictional episode from VEIL.",
    ogImage: "/images/stories/season-01-reina/episode-02-visual-records-20260802/ep02-sc01-dressing-room-doorway-v1.png?v=20260802",
    ogImageAlt: "Reina Amamiya pauses at a dressing-room door before a VEIL show.",
    images: [
      { id: "ep02-01-dressing-room-doorway", alt: "Reina Amamiya pauses at a dressing-room door in a small live-music club.", caption: "VISUAL RECORD 01 / THE DOOR", afterIndex: 8 },
      { id: "ep02-02-dressing-room-glimpse", alt: "Reina sees an anonymous drummer’s back through the dressing-room doorway.", caption: "VISUAL RECORD 02 / CURTAIN GAP", afterIndex: 13 },
      { id: "ep02-03-turned-away", alt: "Reina lowers her gaze in the dressing room, trying to hide her discomposure.", caption: "VISUAL RECORD 03 / TURNED AWAY", afterIndex: 22 },
      { id: "ep02-04-mirror-glance", alt: "Reina catches a partial view of her own face in the edge of a backstage mirror.", caption: "VISUAL RECORD 04 / SECOND LOOK", afterIndex: 40 },
      { id: "ep02-06-stage-performance", alt: "Reina sings into a microphone on the intimate stage of a small live-music club.", caption: "VISUAL RECORD 05 / HOLD THE NOTE", afterIndex: 59 },
      { id: "ep02-09-train-message", alt: "Reina sits beside a dark train window after the show, holding a phone with its screen unreadable.", caption: "VISUAL RECORD 06 / THE WAY HOME", afterIndex: 96 },
      { id: "ep02-08-night-heat", alt: "Reina sits alone on her bed at night, eyes closed as she tries to settle herself.", caption: "VISUAL RECORD 07 / NIGHT HEAT", afterIndex: 123 },
      { id: "ep02-11-afterglow", alt: "Reina rests against a pillow in the quiet after the night’s unresolved heat.", caption: "VISUAL RECORD 08 / AFTERGLOW", afterIndex: 158 },
    ],
  },
  {
    storyId: "season-01-reina-episode-04-canonical-20260809",
    episode: 4,
    source: "src/content/season-01-reina-episode-04-en-20260811.md",
    output: "public/en/stories/reina/season-1/episode-4/index.html",
    jpUrl: "/stories/reina/season-1/episode-4/",
    enUrl: "/en/stories/reina/season-1/episode-4/",
    title: "The Name She Found",
    updatedAt: "2026-08-11",
    description: "At an industry showcase, Reina Amamiya recognizes the drummer who has unsettled her—and finds her voice changing under his gaze. An adult fictional episode from VEIL.",
    ogImage: "/images/stories/season-01-reina/episode-04-visual-records-20260811/ep04-sc01-flyer-turn-v1.png",
    ogImageAlt: "Reina Amamiya turns a flyer facedown in a backstage hallway before a VEIL showcase.",
    images: [
      { id: "ep04-01-flyer-turn", alt: "Reina Amamiya turns a flyer facedown in a backstage hallway before a VEIL showcase.", caption: "VISUAL RECORD 01 / FLYER TURN", after: "At Mizuki’s call, Reina turned the flyer facedown." },
      { id: "ep04-02-envelope-choice", alt: "Reina looks down at a large document envelope holding a flyer backstage.", caption: "VISUAL RECORD 02 / ONLY SING", after: "Today, I am only here to sing." },
      { id: "ep04-03-stage-wing-relief", alt: "Reina pauses at the side of the stage, gathering herself before VEIL performs.", caption: "VISUAL RECORD 03 / RELIEF", after: "If Yuto was here, she thought, then today would be all right." },
      { id: "ep04-04-first-line-catches", alt: "Reina sings into a microphone under stage lights at a small hall.", caption: "VISUAL RECORD 04 / FIRST BREATH", after: "He was looking at her." },
      { id: "ep04-05-half-step-forward", alt: "Reina leans forward under dark stage lighting as she pushes her song ahead.", caption: "VISUAL RECORD 05 / HALF STEP", after: "The last note of the chorus held longer than it usually did." },
      { id: "ep04-06-applause-after", alt: "Reina stands alone onstage after a song, holding a microphone in the lingering applause.", caption: "VISUAL RECORD 06 / APPLAUSE", after: "Seeing his face made something in her ache." },
      { id: "ep04-07-praise-in-corridor", alt: "Reina holds a water bottle in a backstage corridor after VEIL’s performance.", caption: "VISUAL RECORD 07 / PRAISE", after: "Reina lowered her head again instead of answering." },
      { id: "ep04-08-words-left-unsaid", alt: "Reina stands alone in a blue-lit backstage corridor with an unresolved expression.", caption: "VISUAL RECORD 08 / WORDS LEFT UNSAID", after: "Reina could not answer." },
    ],
  },
  {
    storyId: "season-01-reina-episode-05-canonical-20260814",
    episode: 5,
    source: "src/content/season-01-reina-episode-05-en-20260815.md",
    output: "public/en/stories/reina/season-1/episode-5/index.html",
    jpUrl: "/stories/reina/season-1/episode-5/",
    enUrl: "/en/stories/reina/season-1/episode-5/",
    title: "The Night She Doesn't Go Home",
    updatedAt: "2026-08-15",
    description: "At a work afterparty, Reina lets a conversation with Toru continue past the moment she could have left—and chooses what comes next. An adult fictional episode from VEIL.",
    ogImage: "/images/stories/season-01-reina/episode-05-visual-records-20260815/ep05-sc01-water-pour-v1.png",
    ogImageAlt: "Reina Amamiya pours water into a glass at a warm Italian restaurant afterparty.",
    images: [
      { id: "ep05-01-water-pour", alt: "Reina Amamiya pours water into a glass at a warm Italian restaurant afterparty.", caption: "VISUAL RECORD 01 / WATER COUNTER", after: "Just as she reached for the water carafe, Toru was standing on the other side of it." },
      { id: "ep05-02-unanswered-words", alt: "Reina Amamiya pauses in a warm restaurant, quietly searching for an answer.", caption: "VISUAL RECORD 02 / NO ANSWER", after: "Reina said nothing." },
      { id: "ep05-03-black-falls-to-shoulder", alt: "The sleeve of Reina’s charcoal knit falls near her hand and water glass at the restaurant table.", caption: "VISUAL RECORD 03 / CHARCOAL KNIT", after: "For the first time, Reina thought he might be more decent than she had expected." },
      { id: "ep05-04-music-talk-continues", alt: "Reina leans forward at a restaurant table as she talks about VEIL’s music.", caption: "VISUAL RECORD 04 / MUSIC TALK", after: "The words in their songs. The songs where the moment Hiyori’s bass came in, even the place where Reina took her breaths changed. The way the band’s sound shifted a little whenever the four of them played together again and again. Rather than there being one finished form, each live show brought them closer to the sound the four of them had at that moment." },
      { id: "ep05-05-even-after-checking-time", alt: "Reina holds a dark-screened phone as she checks the time at the restaurant.", caption: "VISUAL RECORD 05 / TIME GLANCE", after: "When she had checked the time a little earlier, Reina had closed the screen. Even so, she had not stopped the conversation." },
      { id: "ep05-06-first-name", alt: "Reina chooses her words beneath a streetlamp at night.", caption: "VISUAL RECORD 06 / FIRST NAME", after: "The moment she said it, Reina surprised herself a little." },
      { id: "ep05-07-sidewalk-after-closing", alt: "Reina walks along a quiet night sidewalk, holding her phone at her side.", caption: "VISUAL RECORD 07 / AFTER CLOSING", after: "They started walking without either of them naming where they were going." },
      { id: "ep05-08-lit-door", alt: "Reina walks toward a warmly lit hotel entrance at night.", caption: "VISUAL RECORD 08 / LIT DOOR", after: "The doors opened." },
    ],
  },
  {
    storyId: "season-01-reina-episode-06-canonical-20260817",
    episode: 6,
    source: "src/content/season-01-reina-episode-06-en-20260818.md",
    output: "public/en/stories/reina/season-1/episode-6/index.html",
    jpUrl: "/stories/reina/season-1/episode-6/",
    enUrl: "/en/stories/reina/season-1/episode-6/",
    title: "Don't Look Away",
    updatedAt: "2026-08-22",
    description: "In a hotel room after leaving the afterparty, Reina makes the choice she cannot explain away—and looks straight at what she wants. An adult fictional episode from VEIL.",
    ogImage: "/images/members/v5/reina-amamiya-casual-portrait-20260725.png",
    ogImageAlt: "Portrait of Reina Amamiya.",
    images: [
      { id: "ep06-01-sc01", alt: "Visual record 01 for Reina Amamiya's Episode 6.", caption: "VISUAL RECORD 01 / EPISODE 06", afterIndex: 31 },
      { id: "ep06-02-sc02", alt: "Visual record 02 for Reina Amamiya's Episode 6.", caption: "VISUAL RECORD 02 / EPISODE 06", afterIndex: 63 },
      { id: "ep06-03-sc03", alt: "Visual record 03 for Reina Amamiya's Episode 6.", caption: "VISUAL RECORD 03 / EPISODE 06", afterIndex: 96 },
      { id: "ep06-04-sc05", alt: "Visual record 04 for Reina Amamiya's Episode 6.", caption: "VISUAL RECORD 04 / EPISODE 06", afterIndex: 128 },
      { id: "ep06-05-00007", alt: "Visual record 05 for Reina Amamiya's Episode 6.", caption: "VISUAL RECORD 05 / EPISODE 06", afterIndex: 160 },
      { id: "ep06-06-00008", alt: "Visual record 06 for Reina Amamiya's Episode 6.", caption: "VISUAL RECORD 06 / EPISODE 06", afterIndex: 192 },
      { id: "ep06-07-00013", alt: "Visual record 07 for Reina Amamiya's Episode 6.", caption: "VISUAL RECORD 07 / EPISODE 06", afterIndex: 225 },
      { id: "ep06-08-00014", alt: "Visual record 08 for Reina Amamiya's Episode 6.", caption: "VISUAL RECORD 08 / EPISODE 06", afterIndex: 257 },
    ],
  },
];

function figureHtml(image, className = "story-figure") {
  return `<figure class="${className}" id="visual-${escapeHtml(image.id)}"><img src="${escapeHtml(image.src)}" alt="${escapeHtml(image.alt)}" loading="lazy" /><figcaption>${escapeHtml(image.caption)}</figcaption></figure>`;
}

function storyHtml(paragraphs, images) {
  const pending = new Map(images.filter((image) => typeof image.after === "string").map((image) => [image.after, image]));
  const imagesByIndex = new Map();
  for (const image of images) {
    if (!Number.isInteger(image.afterIndex)) continue;
    const atIndex = imagesByIndex.get(image.afterIndex) || [];
    atIndex.push(image);
    imagesByIndex.set(image.afterIndex, atIndex);
  }
  const body = paragraphs.map((paragraph, index) => {
    const content = paragraph.startsWith("> ")
      ? `<blockquote>${escapeHtml(paragraph.slice(2))}</blockquote>`
      : `<p>${escapeHtml(paragraph)}</p>`;
    const byText = pending.get(paragraph);
    if (byText) pending.delete(paragraph);
    const visuals = [...(imagesByIndex.get(index) || []), ...(byText ? [byText] : [])];
    return `${content}${visuals.map((image) => figureHtml(image)).join("")}`;
  }).join("\n");
  if (pending.size) throw new Error(`Missing story anchors: ${[...pending.keys()].join(" | ")}`);
  return body;
}

function pageHtml(episode, paragraphs, images) {
  const hasVisuals = images.length > 0;
  const story = storyHtml(paragraphs, images);
  const visuals = images.map((image) => figureHtml(image, "visual-index-figure")).join("\n");
  const review = images.map((image, index) => `<a href="#visual-${escapeHtml(image.id)}" class="review-card"><img src="${escapeHtml(image.src)}" alt="" loading="lazy" /><span><small>VISUAL ${String(index + 1).padStart(2, "0")}</small><strong>${escapeHtml(image.caption)}</strong></span></a>`).join("\n");
  const ageVisualNote = hasVisuals ? " The illustrations use AI-assisted production methods." : "";
  const disclosure = hasVisuals ? "18+ / FICTION / AI-ASSISTED ILLUSTRATIONS" : "18+ / FICTION";
  const visualRail = hasVisuals ? `<aside class="visual-index" aria-label="Visual records from this episode">${visuals}</aside>` : "";
  const visualReview = hasVisuals ? `<section class="visual-review" aria-labelledby="visual-review-title">
          <header><p class="eyebrow">VISUAL INDEX / AFTER READING</p><h2 id="visual-review-title">Return to the scenes</h2><p>After reading, revisit the moments that stayed with you.</p></header>
          <div class="review-grid">${review}</div>
        </section>` : "";
  const canonical = `https://veil-archive.com${episode.enUrl}`;
  const japanese = `https://veil-archive.com${episode.jpUrl}`;
  const ogImage = `https://veil-archive.com${episode.ogImage}`;
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#09090b" />
    <meta name="robots" content="index,follow,max-image-preview:large" />
    <title>${escapeHtml(episode.title)} — Reina Amamiya | VEIL</title>
    <meta name="description" content="${escapeHtml(episode.description)}" />
    <link rel="canonical" href="${canonical}" />
    <link rel="alternate" hreflang="ja" href="${japanese}" />
    <link rel="alternate" hreflang="en" href="${canonical}" />
    <link rel="alternate" hreflang="x-default" href="https://veil-archive.com/en/start/" />
    <link rel="stylesheet" href="/en/story.css" />
    <script src="/en/story.js" defer></script>
    <meta property="og:type" content="article" />
    <meta property="og:site_name" content="VEIL" />
    <meta property="og:locale" content="en_US" />
    <meta property="og:locale:alternate" content="ja_JP" />
    <meta property="og:title" content="${escapeHtml(episode.title)} — Reina Amamiya | VEIL" />
    <meta property="og:description" content="${escapeHtml(episode.description)}" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:image" content="${ogImage}" />
    <meta property="og:image:alt" content="${escapeHtml(episode.ogImageAlt)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(episode.title)} — Reina Amamiya | VEIL" />
    <meta name="twitter:description" content="${escapeHtml(episode.description)}" />
    <meta name="twitter:image" content="${ogImage}" />
  </head>
  <body>
    <header class="story-site-header">
      <a class="wordmark" href="/en/start/" aria-label="Open the VEIL English entry"><strong>VEIL</strong><span>OFFICIAL RECORD</span></a>
      <nav class="language-switch" aria-label="Choose language"><a href="${episode.jpUrl}" lang="ja">日本語</a><a href="${episode.enUrl}" aria-current="page">EN</a></nav>
    </header>
    <main>
      <section class="english-age-gate" id="english-age-gate" aria-labelledby="english-age-title">
        <p class="eyebrow">18+ CONTENT NOTICE</p>
        <h1 id="english-age-title">Before you continue</h1>
        <p>This fictional episode contains adult-oriented psychological and sensual themes. All characters are adults.${ageVisualNote}</p>
        <div class="age-actions"><button type="button" class="primary-action" id="confirm-age">I am 18 or older</button><a class="secondary-action" href="/en/start/">Return to the English entry</a></div>
      </section>
      <article class="english-story" id="english-story" hidden>
        <header class="english-story-header">
          <p>SEASON 01 — REINA AMAMIYA</p>
          <small>EPISODE ${String(episode.episode).padStart(2, "0")} / 08</small>
          <h1>${escapeHtml(episode.title)}</h1>
          <strong>${disclosure}</strong>
          <span>All characters are fictional adults. This episode contains adult-oriented psychological and sensual fiction.</span>
          <nav class="episode-language-switch" aria-label="Read this episode in another language"><a href="${episode.jpUrl}" lang="ja">日本語</a><span aria-current="page">EN</span></nav>
        </header>
        <div class="english-story-layout${hasVisuals ? "" : " is-text-only"}">
          <div class="english-story-content">${story}</div>${hasVisuals ? `
          ${visualRail}` : ""}
        </div>${hasVisuals ? `
        ${visualReview}` : ""}
        <nav class="story-next"><a href="/en/start/">← Back to the English entry</a><span>NEXT RECORD — COMING SOON</span></nav>
      </article>
    </main>
    <footer class="story-footer"><p>VEIL / FICTIONAL BAND PROJECT</p><nav><a href="/en/editorial/reading-guide/">From the VEIL editor</a><a href="/en/start/">English entry</a></nav></footer>
  </body>
</html>
`;
}

const japaneseStories = JSON.parse(await readFile(join(root, "src/content/serial-stories.json"), "utf8"));
for (const episode of episodes) {
  const source = await readFile(join(root, episode.source), "utf8");
  const japaneseEpisode = Array.isArray(japaneseStories) && japaneseStories.find((story) => story?.id === episode.storyId);
  if (!japaneseEpisode || !Array.isArray(japaneseEpisode.images)) throw new Error(`The published Japanese image data is missing for ${episode.storyId}.`);
  const imageSourceById = new Map(japaneseEpisode.images.map((image) => [image?.id, image?.image]));
  const images = episode.images.map((image) => {
    const src = imageSourceById.get(image.id);
    if (typeof src !== "string" || !src.startsWith("/images/")) throw new Error(`Missing shared image source for ${image.id}.`);
    return { ...image, src };
  });
  const html = pageHtml(episode, extractEnglishText(source), images);
  const output = join(root, episode.output);
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, html, "utf8");
}

const englishStoryIndex = episodes.map(({ storyId, episode, jpUrl, enUrl, title, description, updatedAt }) => ({
  storyId,
  memberSlug: "reina-amamiya",
  season: 1,
  episode,
  jpUrl,
  enUrl,
  title,
  description,
  updatedAt,
}));
await writeFile(join(root, indexPath), `${JSON.stringify(englishStoryIndex, null, 2)}\n`, "utf8");
