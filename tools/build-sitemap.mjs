import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const root = process.cwd();
const siteUrl = "https://veil-archive.com";
const seoPages = JSON.parse(await readFile(join(root, "src/content/seo-pages.json"), "utf8"));
const news = JSON.parse(await readFile(join(root, "src/content/news.json"), "utf8"));
const notesDocument = JSON.parse(await readFile(join(root, "src/content/notes-published/index.json"), "utf8"));

if (!Array.isArray(seoPages) || !seoPages.length) throw new Error("SEO page registry must not be empty.");
if (!Array.isArray(news) || !news.length || !/^\d{4}-\d{2}-\d{2}$/.test(news[0]?.dateTime || "")) {
  throw new Error("Latest news date is required for sitemap generation.");
}
if (!notesDocument || typeof notesDocument !== "object" || Array.isArray(notesDocument) || notesDocument.schemaVersion !== 1 || !Array.isArray(notesDocument.notes)) {
  throw new Error("VEIL NOTES public index has an invalid schema.");
}
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

const entries = [
  ...seoPages.filter((page) => page.sitemap === true && page.path !== "/news").map((page) => ({
    path: page.path,
    lastmod: page.lastmod,
  })),
  { path: "/ja/start", lastmod: "2026-08-03", alternates: startAlternates },
  { path: "/en/start", lastmod: "2026-08-03", alternates: startAlternates },
  { path: "/news", lastmod: news[0].dateTime },
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
  if (/^\/(?:en\/)?stories\//.test(canonical)) throw new Error(`Noindex story must not enter sitemap: ${canonical}`);
}

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries.map(urlEntry).join("\n")}
</urlset>
`;

await writeFile(join(root, "public/sitemap.xml"), xml, "utf8");
