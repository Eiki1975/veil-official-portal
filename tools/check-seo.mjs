import { access, readFile } from "node:fs/promises";
import { join } from "node:path";

const root = process.cwd();
const dist = join(root, "dist");
const failures = [];
const expect = (condition, message) => { if (!condition) failures.push(message); };
const read = (path) => readFile(join(dist, path), "utf8");

const robots = await read("robots.txt");
const sitemap = await read("sitemap.xml");
const headers = await read("_headers");
const redirects = await read("_redirects");
const notesDocument = JSON.parse(await readFile(join(root, "src/content/notes-published/index.json"), "utf8"));
const notes = Array.isArray(notesDocument?.notes) ? notesDocument.notes : [];

expect(!/Disallow:\s*\/(?:en\/)?stories\//i.test(robots), "robots.txt must allow story crawling so noindex can be observed.");
expect(/Sitemap:\s*https:\/\/veil-archive\.com\/sitemap\.xml/i.test(robots), "robots.txt must declare the production sitemap.");
expect(!/<loc>https:\/\/veil-archive\.com\/(?:en\/)?stories\//i.test(sitemap), "Noindex story URLs must not appear in sitemap.xml.");
expect(/<loc>https:\/\/veil-archive\.com\/<\/loc>/.test(sitemap), "The production root must appear in sitemap.xml.");
expect(/\/stories\/\*[^]*?X-Robots-Tag:\s*noindex, nofollow/i.test(headers), "Japanese stories must retain X-Robots-Tag noindex,nofollow.");
expect(/\/en\/stories\/\*[^]*?X-Robots-Tag:\s*noindex, nofollow/i.test(headers), "English stories must retain X-Robots-Tag noindex,nofollow.");
expect(/\/legal\/terms\*[^]*?X-Robots-Tag:\s*noindex, nofollow/i.test(headers), "Unfinished terms page must be noindex.");
expect(/\/legal\/contact\*[^]*?X-Robots-Tag:\s*noindex, nofollow/i.test(headers), "Unfinished contact page must be noindex.");
expect(!/^\S+\s+\/\s+200$/m.test(redirects), "Known indexable routes must be served from route-specific HTML, not root rewrites.");

const locs = [...sitemap.matchAll(/<loc>(https:\/\/veil-archive\.com\/[^<]*)<\/loc>/g)].map((match) => new URL(match[1]).pathname);
expect(new Set(locs).size === locs.length, "sitemap.xml must not contain duplicate URLs.");

for (const pathname of locs) {
  const relative = pathname === "/" ? "index.html" : `${pathname.replace(/^\//, "")}index.html`;
  try {
    await access(join(dist, relative));
    const html = await read(relative);
    expect(!/<meta\s+name="robots"\s+content="[^"]*noindex/i.test(html), `Sitemap URL must be indexable: ${pathname}`);
    expect(html.includes(`<link rel="canonical" href="https://veil-archive.com${pathname}"`), `Sitemap URL and page canonical disagree: ${pathname}`);
  } catch {
    failures.push(`Sitemap URL has no built HTML file: ${pathname}`);
  }
}

const criticalPages = [
  ["index.html", "https://veil-archive.com/", "index,follow"],
  ["about/index.html", "https://veil-archive.com/about/", "index,follow"],
  ["members/reina-amamiya/index.html", "https://veil-archive.com/members/reina-amamiya/", "index,follow"],
  ["editorial/reading-guide/index.html", "https://veil-archive.com/editorial/reading-guide/", "index,follow"],
  ["en/editorial/reading-guide/index.html", "https://veil-archive.com/en/editorial/reading-guide/", "index,follow"],
  ["stories/reina/season-1/episode-1/index.html", "https://veil-archive.com/stories/reina/season-1/episode-1/", "noindex,nofollow"],
  ["legal/terms/index.html", "https://veil-archive.com/legal/terms/", "noindex,nofollow"],
];

for (const [file, canonical, robotsValue] of criticalPages) {
  const html = await read(file);
  expect(/<title>[^<]{5,}<\/title>/i.test(html), `${file} must have a descriptive title.`);
  expect(/<meta\s+name="description"\s+content="[^"]{30,}"/i.test(html), `${file} must have a descriptive meta description.`);
  expect(html.includes(`<link rel="canonical" href="${canonical}"`), `${file} has the wrong canonical URL.`);
  expect(new RegExp(`<meta\\s+name="robots"\\s+content="${robotsValue.replace(",", ",\\s*")}`, "i").test(html), `${file} has the wrong robots directive.`);
  expect(/<meta\s+property="og:title"\s+content="[^"]+"/i.test(html), `${file} must have Open Graph metadata.`);
  expect(/<script[^>]+type="application\/ld\+json"/i.test(html), `${file} must have JSON-LD.`);
}

const japaneseGuide = await read("editorial/reading-guide/index.html");
const englishGuide = await read("en/editorial/reading-guide/index.html");
expect(japaneseGuide.includes('hreflang="en"') && japaneseGuide.includes("/en/editorial/reading-guide/"), "Japanese guide must link to the English alternate.");
expect(englishGuide.includes('hreflang="ja"') && englishGuide.includes("/editorial/reading-guide/"), "English guide must link to the Japanese alternate.");
expect(japaneseGuide.includes("官能小説") && japaneseGuide.includes("イメージビデオ") && japaneseGuide.includes("グラビア"), "Japanese recorder note must cover the approved search intent naturally.");
expect(englishGuide.includes("erotic fiction") && englishGuide.includes("Japanese image videos") && englishGuide.includes("gravure"), "English recorder note must cover the approved search intent naturally.");

const notesIndex = await read("notes/index.html");
if (!notes.length) {
  expect(!sitemap.includes("https://veil-archive.com/notes/"), "Empty VEIL NOTES must not enter the sitemap.");
  expect(notesIndex.includes('<link rel="canonical" href="https://veil-archive.com/notes/"'), "Empty VEIL NOTES must retain its canonical URL.");
  expect(/<meta\s+name="robots"\s+content="noindex,nofollow"/i.test(notesIndex), "Empty VEIL NOTES must remain noindex.");
  expect(notesIndex.includes("公開済みの制作ノートは、まだありません。"), "Empty VEIL NOTES must not invent an article.");
} else {
  expect(sitemap.includes("https://veil-archive.com/notes/"), "Published VEIL NOTES index must enter the sitemap.");
  expect(/<meta\s+name="robots"\s+content="index,follow,max-image-preview:large"/i.test(notesIndex), "Published VEIL NOTES index must be indexable.");
  for (const note of notes) {
    const pathname = `notes/${note.slug}/index.html`;
    const html = await read(pathname);
    expect(sitemap.includes(`https://veil-archive.com/notes/${note.slug}/`), `Published VEIL NOTES article must enter the sitemap: ${note.slug}`);
    expect(html.includes(`<link rel="canonical" href="https://veil-archive.com/notes/${note.slug}/"`), `VEIL NOTES article canonical is wrong: ${note.slug}`);
    expect(/<meta\s+name="robots"\s+content="index,follow,max-image-preview:large"/i.test(html), `VEIL NOTES article must be indexable: ${note.slug}`);
    expect(/"@type":"BlogPosting"/.test(html), `VEIL NOTES article must include BlogPosting JSON-LD: ${note.slug}`);
  }
}

if (failures.length) {
  console.error(`SEO verification failed (${failures.length}):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`SEO verification passed for ${locs.length} sitemap URLs and ${criticalPages.length} critical pages.`);
