import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const root = process.cwd();
const siteUrl = "https://veil-archive.com";
const seoPages = JSON.parse(await readFile(join(root, "src/content/seo-pages.json"), "utf8"));
const news = JSON.parse(await readFile(join(root, "src/content/news.json"), "utf8"));
const notesDocument = JSON.parse(await readFile(join(root, "src/content/notes-published/index.json"), "utf8"));
const stories = JSON.parse(await readFile(join(root, "src/content/serial-stories-index.json"), "utf8"));
const englishStories = JSON.parse(await readFile(join(root, "src/content/english-serial-stories-index.json"), "utf8"));

if (!Array.isArray(seoPages) || !seoPages.length) throw new Error("SEO page registry must not be empty.");
if (!Array.isArray(news) || !news.length || !/^\d{4}-\d{2}-\d{2}$/.test(news[0]?.dateTime || "")) {
  throw new Error("Latest news date is required for sitemap generation.");
}
if (!notesDocument || typeof notesDocument !== "object" || Array.isArray(notesDocument) || notesDocument.schemaVersion !== 1 || !Array.isArray(notesDocument.notes)) {
  throw new Error("VEIL NOTES public index has an invalid schema.");
}
if (!Array.isArray(stories) || !stories.length) throw new Error("Published story index must not be empty.");
if (!Array.isArray(englishStories)) throw new Error("English story index must be an array.");
const notes = notesDocument.notes;
const noteSlug = (value) => /^[a-z0-9][a-z0-9-]{0,79}$/.test(String(value || ""));
const noteDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(String(value || ""));
for (const note of notes) {
  if (!note || typeof note !== "object" || !noteSlug(note.slug) || !noteDate(note.publishedAt) || !noteDate(note.updatedAt)) {
    throw new Error("VEIL NOTES public entry is invalid.");
  }
}

const canonicalPath = (path) => path === "/" ? "/" : `${path.replace(/\/+$/, "")}/`;
const escapeXml = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&apos;");

function urlEntry({ path, lastmod, alternates = [] }) {
  const loc = `${siteUrl}${canonicalPath(path)}`;
  const links = alternates.map(({ lang, path: alternatePath }) =>
    `    <xhtml:link rel="alternate" hreflang="${escapeXml(lang)}" href="${escapeXml(`${siteUrl}${canonicalPath(alternatePath)}`)}" />`,
  );
  return [
    "  <url>",
    `    <loc>${escapeXml(loc)}</loc>`,
    ...links,
    ...(lastmod ? [`    <lastmod>${escapeXml(lastmod)}</lastmod>`] : []),
    "  </url>",
  ].join("\n");
}

const startAlternates = [
  { lang: "ja", path: "/ja/start" },
  { lang: "en", path: "/en/start" },
  { lang: "x-default", path: "/ja/start" },
];
const editorialAlternates = [
  { lang: "ja", path: "/editorial/reading-guide" },
  { lang: "en", path: "/en/editorial/reading-guide" },
];
const shortMemberSlug = (memberSlug) => String(memberSlug || "").split("-")[0];
const storyPath = (story) => `/stories/${shortMemberSlug(story.memberSlug)}/season-${story.season}/episode-${story.episode}`;
const storyCollectionPath = (memberSlug) => `/stories/${shortMemberSlug(memberSlug)}`;
const englishStoryByJapanesePath = new Map(englishStories.map((story) => [String(story.jpUrl || "").replace(/\/+$/, ""), story]));

for (const story of stories) {
  if (!story || !/^[-a-z0-9]+$/i.test(String(story.memberSlug || "")) || !Number.isInteger(story.season) || !Number.isInteger(story.episode) || !/^\d{4}-\d{2}-\d{2}/.test(String(story.updatedAt || ""))) {
    throw new Error("Published story entry is invalid.");
  }
}
for (const story of englishStories) {
  if (!story || !/^\/stories\/[a-z0-9-]+\/season-\d+\/episode-\d+\/$/.test(String(story.jpUrl || "")) || !/^\/en\/stories\/[a-z0-9-]+\/season-\d+\/episode-\d+\/$/.test(String(story.enUrl || "")) || !/^\d{4}-\d{2}-\d{2}/.test(String(story.updatedAt || ""))) {
    throw new Error("Published English story entry is invalid.");
  }
}

const entries = [
  ...seoPages.filter((page) => page.sitemap === true && page.path !== "/news").map((page) => ({
    path: page.path,
    lastmod: page.lastmod,
  })),
  { path: "/ja/start", lastmod: "2026-08-03", alternates: startAlternates },
  { path: "/en/start", lastmod: "2026-08-03", alternates: startAlternates },
  { path: "/news", lastmod: news[0].dateTime },
  ...[...new Set(stories.map((story) => story.memberSlug))].map((memberSlug) => ({
    path: storyCollectionPath(memberSlug),
    lastmod: stories.filter((story) => story.memberSlug === memberSlug).map((story) => story.updatedAt.slice(0, 10)).sort().at(-1),
  })),
  ...stories.flatMap((story) => {
    const path = storyPath(story);
    const englishStory = englishStoryByJapanesePath.get(path);
    const alternates = englishStory ? [
      { lang: "ja", path },
      { lang: "en", path: englishStory.enUrl },
      { lang: "x-default", path },
    ] : [];
    return [
      { path, lastmod: story.updatedAt.slice(0, 10), alternates },
      ...(englishStory ? [{ path: englishStory.enUrl, lastmod: englishStory.updatedAt, alternates }] : []),
    ];
  }),
  ...(notes.length ? [
    { path: "/notes", lastmod: notes.map((note) => note.updatedAt).sort().at(-1) },
    ...notes.map((note) => ({ path: `/notes/${note.slug}`, lastmod: note.updatedAt })),
  ] : []),
  { path: "/editorial/reading-guide", lastmod: "2026-08-03", alternates: editorialAlternates },
  { path: "/en/editorial/reading-guide", lastmod: "2026-08-03", alternates: editorialAlternates },
  { path: "/editorial/sensual-fiction", lastmod: "2026-08-03" },
  { path: "/editorial/visual-records", lastmod: "2026-08-03" },
];

const seen = new Set();
for (const entry of entries) {
  const canonical = canonicalPath(entry.path);
  if (seen.has(canonical)) throw new Error(`Duplicate sitemap URL: ${canonical}`);
  seen.add(canonical);
}

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries.map(urlEntry).join("\n")}
</urlset>
`;

await writeFile(join(root, "public/sitemap.xml"), xml, "utf8");
