import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

const root = process.cwd();
const siteUrl = "https://veil-archive.com";
const source = join(root, "src/content/news.json");
const output = join(root, "public/news/index.html");

const escapeHtml = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

const safeHref = (value) => typeof value === "string" && value.startsWith("/") && !value.startsWith("//") && /^\/[A-Za-z0-9._~:/?#\[\]@!$&'()*+,;=%-]*$/.test(value) && !value.includes("..") && !/%2e/i.test(value)
  ? value
  : "";

const sourceValue = JSON.parse(await readFile(source, "utf8"));
if (!Array.isArray(sourceValue) || !sourceValue.length) throw new Error("News source must contain at least one entry.");

const entries = sourceValue.map((entry) => {
  if (!entry || typeof entry !== "object") throw new Error("News entry must be an object.");
  const date = typeof entry.date === "string" ? entry.date : "";
  const dateTime = typeof entry.dateTime === "string" ? entry.dateTime : "";
  const type = typeof entry.type === "string" ? entry.type : "";
  const title = typeof entry.title === "string" ? entry.title : "";
  const summary = typeof entry.summary === "string" ? entry.summary : "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateTime) || !date || !type || !title || !summary) throw new Error("News entry is missing required public fields.");
  return { date, dateTime, type, title, summary, href: safeHref(entry.href), adult: entry.adult === true };
});

function itemHtml(entry) {
  const destination = entry.href
    ? `<a class="news-entry-link" href="${escapeHtml(entry.href)}">記録を開く <span aria-hidden="true">→</span></a>`
    : "";
  return `<article class="news-entry">
        <div class="news-entry-meta"><time datetime="${escapeHtml(entry.dateTime)}">${escapeHtml(entry.date)}</time><span>${escapeHtml(entry.type)}${entry.adult ? " / 18+" : ""}</span></div>
        <div class="news-entry-copy"><h2>${escapeHtml(entry.title)}</h2><p>${escapeHtml(entry.summary)}</p></div>
        ${destination}
      </article>`;
}

const schema = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "VEIL NEWS",
  description: "VEIL公式サイトの公開・更新履歴。",
  url: `${siteUrl}/news/`,
  inLanguage: "ja",
  dateModified: entries[0].dateTime,
  mainEntity: {
    "@type": "ItemList",
    itemListElement: entries.map((entry, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "CreativeWork",
        name: entry.title,
        datePublished: entry.dateTime,
        ...(entry.href ? { url: `${siteUrl}${entry.href}` } : {}),
      },
    })),
  },
}).replaceAll("<", "\\u003c");

const html = `<!doctype html>
<html lang="ja">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#09090b" />
    <meta name="robots" content="index,follow" />
    <title>VEIL NEWS｜公開・更新履歴</title>
    <meta name="description" content="VEIL公式サイトの公開・更新履歴。雨宮玲奈 Season 01、音楽、記録の最新情報をお知らせします。" />
    <link rel="canonical" href="${siteUrl}/news/" />
    <link rel="stylesheet" href="/news.css" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="VEIL OFFICIAL SITE" />
    <meta property="og:locale" content="ja_JP" />
    <meta property="og:title" content="VEIL NEWS｜公開・更新履歴" />
    <meta property="og:description" content="VEIL公式サイトの公開・更新履歴。" />
    <meta property="og:url" content="${siteUrl}/news/" />
    <meta property="og:image" content="${siteUrl}/images/veil-hero-band-v6-20260725.png" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="VEIL NEWS｜公開・更新履歴" />
    <meta name="twitter:description" content="VEIL公式サイトの公開・更新履歴。" />
    <meta name="twitter:image" content="${siteUrl}/images/veil-hero-band-v6-20260725.png" />
    <script type="application/ld+json">${schema}</script>
  </head>
  <body>
    <header class="site-header"><a class="wordmark" href="/" aria-label="VEILのトップへ"><strong>VEIL</strong><span>OFFICIAL SITE</span></a><a class="home-link" href="/">TOP <span aria-hidden="true">↗</span></a></header>
    <main>
      <section class="intro"><p>PUBLIC RECORD / SITE UPDATES</p><h1>NEWS</h1><div><strong>公開・更新履歴</strong><span>Published works, records and site updates.</span></div><p>公開した作品と、読める導線に影響する変更を、日付とともに残します。</p></section>
      <section class="news-log" aria-label="VEILの公開・更新履歴">
        ${entries.map(itemHtml).join("\n        ")}
      </section>
      <aside class="notice"><strong>閲覧について</strong><p>一部の物語には成人向け表現が含まれます。該当する記録は、18歳以上であることを確認した後に読むことができます。</p></aside>
    </main>
    <footer><span>VEIL / FICTIONAL BAND PROJECT</span><a href="/">VEIL OFFICIAL SITE</a></footer>
  </body>
</html>
`;

await mkdir(dirname(output), { recursive: true });
await writeFile(output, html, "utf8");
