import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const root = process.cwd();
const siteUrl = "https://veil-archive.com";
const sourceDir = join(root, "src", "content", "notes-published");
const sourcePath = join(sourceDir, "index.json");
const outputDir = join(root, "public", "notes");
const defaultImage = "/images/veil-hero-band-v6-20260725.png";

const escapeHtml = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

const escapeJson = (value) => JSON.stringify(value).replaceAll("<", "\\u003c");
const isDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value);
const isSlug = (value) => /^[a-z0-9][a-z0-9-]{0,79}$/.test(value);
const isSafeCover = (value, slug) => typeof value === "object" && value !== null
  && typeof value.src === "string"
  && value.src.startsWith(`/images/notes/${slug}/`)
  && /^\/images\/notes\/[a-z0-9-]+\/[A-Za-z0-9._-]+\.(?:png|jpe?g|webp)$/i.test(value.src)
  && !value.src.includes("..")
  && typeof value.alt === "string"
  && value.alt.trim().length > 0;

function assertExactKeys(value, allowed, label) {
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) throw new Error(`${label} has an unsupported field: ${key}`);
  }
}

function assertArticle(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Each published note must be an object.");
  assertExactKeys(value, new Set(["id", "slug", "title", "summary", "category", "publishedAt", "updatedAt", "readingMinutes", "cover"]), "Published note");
  const article = value;
  if (!/^[a-z0-9][a-z0-9-]{0,119}$/.test(String(article.id || ""))) throw new Error("Published note has an invalid id.");
  if (!isSlug(String(article.slug || ""))) throw new Error(`Published note ${article.id} has an invalid slug.`);
  if (typeof article.title !== "string" || !article.title.trim()) throw new Error(`Published note ${article.id} requires a title.`);
  if (typeof article.summary !== "string" || article.summary.trim().length < 20) throw new Error(`Published note ${article.id} requires a public summary.`);
  if (typeof article.category !== "string" || !article.category.trim()) throw new Error(`Published note ${article.id} requires a category.`);
  if (!isDate(String(article.publishedAt || "")) || !isDate(String(article.updatedAt || ""))) throw new Error(`Published note ${article.id} has an invalid date.`);
  if (!Number.isInteger(article.readingMinutes) || article.readingMinutes < 1 || article.readingMinutes > 99) throw new Error(`Published note ${article.id} has an invalid reading time.`);
  if (article.cover !== undefined && !isSafeCover(article.cover, article.slug)) throw new Error(`Published note ${article.id} has an invalid cover.`);
  return article;
}

function markdownToHtml(markdown, label) {
  const lines = markdown.replace(/\r\n?/g, "\n").trim().split("\n");
  if (!lines.length || !lines.some((line) => line.trim())) throw new Error(`${label} has no body text.`);
  const output = [];
  let paragraph = [];
  let list = [];

  const flushParagraph = () => {
    if (!paragraph.length) return;
    output.push(`<p>${escapeHtml(paragraph.join(" ").trim())}</p>`);
    paragraph = [];
  };
  const flushList = () => {
    if (!list.length) return;
    output.push(`<ul>${list.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`);
    list = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }
    const heading = line.match(/^(#{2,3})\s+(.+)$/);
    if (heading) {
      flushParagraph();
      flushList();
      const level = heading[1].length;
      output.push(`<h${level}>${escapeHtml(heading[2])}</h${level}>`);
      continue;
    }
    const item = line.match(/^-\s+(.+)$/);
    if (item) {
      flushParagraph();
      list.push(item[1]);
      continue;
    }
    flushList();
    paragraph.push(line);
  }
  flushParagraph();
  flushList();
  return output.join("\n        ");
}

function documentHead({ title, description, canonical, robots, schema, image = defaultImage, type = "website" }) {
  const absoluteImage = `${siteUrl}${image}`;
  return `<meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#09090b" />
    <meta name="robots" content="${escapeHtml(robots)}" />
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <link rel="canonical" href="${escapeHtml(canonical)}" />
    <link rel="stylesheet" href="/notes.css" />
    <meta property="og:type" content="${type}" />
    <meta property="og:site_name" content="VEIL OFFICIAL SITE" />
    <meta property="og:locale" content="ja_JP" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:url" content="${escapeHtml(canonical)}" />
    <meta property="og:image" content="${escapeHtml(absoluteImage)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="${escapeHtml(absoluteImage)}" />
    <script type="application/ld+json">${escapeJson(schema)}</script>`;
}

function layout(head, body) {
  return `<!doctype html>
<html lang="ja">
  <head>
    ${head}
  </head>
  <body>
    <header class="notes-header"><a class="wordmark" href="/" aria-label="VEILのトップへ"><strong>VEIL</strong><span>NOTES</span></a><a class="top-link" href="/">TOP <span aria-hidden="true">↗</span></a></header>
    <main>
      ${body}
    </main>
    <footer class="notes-footer"><span>VEIL NOTES / OUTSIDE THE STORY</span><nav><a href="/">TOP</a><a href="/news/">NEWS</a><a href="/legal/adult-policy/">18+ POLICY</a></nav></footer>
  </body>
</html>
`;
}

function renderIndex(notes) {
  const hasPublishedNotes = notes.length > 0;
  const canonical = `${siteUrl}/notes/`;
  const title = "VEIL NOTES｜制作の記録";
  const description = "VEILの物語、ビジュアル、音楽が形になるまでの、公開された制作の記録です。作品世界内の記録とは区別して掲載します。";
  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "VEIL NOTES",
    description,
    url: canonical,
    inLanguage: "ja",
    isPartOf: { "@type": "WebSite", name: "VEIL OFFICIAL SITE", url: `${siteUrl}/` },
    ...(hasPublishedNotes ? {
      mainEntity: {
        "@type": "ItemList",
        itemListElement: notes.map((note, index) => ({
          "@type": "ListItem",
          position: index + 1,
          item: { "@type": "BlogPosting", headline: note.title, url: `${siteUrl}/notes/${note.slug}/`, datePublished: note.publishedAt, dateModified: note.updatedAt },
        })),
      },
    } : {}),
  };
  const entries = hasPublishedNotes
    ? `<div class="notes-list">${notes.map((note) => `<article class="note-row"><div class="note-row-meta"><time datetime="${escapeHtml(note.publishedAt)}">${escapeHtml(note.publishedAt.replaceAll("-", "."))}</time><span>${escapeHtml(note.category)}</span></div><div><h2><a href="/notes/${escapeHtml(note.slug)}/">${escapeHtml(note.title)}</a></h2><p>${escapeHtml(note.summary)}</p></div><a class="note-row-link" href="/notes/${escapeHtml(note.slug)}/">読む <span aria-hidden="true">→</span></a></article>`).join("\n")}</div>`
    : `<aside class="notes-empty"><strong>公開済みの制作ノートは、まだありません。</strong><p>記事は、内容ごとの明示承認を経てからここに追加されます。</p></aside>`;
  return layout(documentHead({ title, description, canonical, robots: hasPublishedNotes ? "index,follow,max-image-preview:large" : "noindex,nofollow", schema }), `<article class="notes-index"><header class="notes-intro"><p class="eyebrow">OUTSIDE THE STORY</p><h1>VEIL NOTES</h1><p class="subtitle">制作の記録</p><p class="lead">これは作品世界内の記録ではなく、VEILを制作する過程を公開するためのページです。未公開の原稿、候補、内部の会話や素材は掲載しません。</p></header>${entries}</article>`);
}

function renderArticle(note, body) {
  const canonical = `${siteUrl}/notes/${note.slug}/`;
  const title = `${note.title}｜VEIL NOTES`;
  const image = note.cover?.src || defaultImage;
  const schema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: note.title,
    description: note.summary,
    url: canonical,
    mainEntityOfPage: canonical,
    inLanguage: "ja",
    datePublished: note.publishedAt,
    dateModified: note.updatedAt,
    publisher: { "@type": "Organization", name: "VEIL OFFICIAL SITE", url: `${siteUrl}/` },
    isPartOf: { "@type": "Blog", name: "VEIL NOTES", url: `${siteUrl}/notes/` },
    image: `${siteUrl}${image}`,
  };
  const cover = note.cover ? `<figure class="note-cover"><img src="${escapeHtml(note.cover.src)}" alt="${escapeHtml(note.cover.alt)}" /></figure>` : "";
  return layout(documentHead({ title, description: note.summary, canonical, robots: "index,follow,max-image-preview:large", schema, image, type: "article" }), `<article class="notes-article"><header class="notes-article-header"><p class="eyebrow">OUTSIDE THE STORY / ${escapeHtml(note.category)}</p><h1>${escapeHtml(note.title)}</h1><p class="lead">${escapeHtml(note.summary)}</p><dl><div><dt>公開</dt><dd><time datetime="${escapeHtml(note.publishedAt)}">${escapeHtml(note.publishedAt.replaceAll("-", "."))}</time></dd></div><div><dt>更新</dt><dd><time datetime="${escapeHtml(note.updatedAt)}">${escapeHtml(note.updatedAt.replaceAll("-", "."))}</time></dd></div><div><dt>目安</dt><dd>${note.readingMinutes}分</dd></div></dl></header>${cover}<section class="note-body">${body}</section><aside class="notes-disclosure"><strong>作品外の制作記録について</strong><p>この記事は、VEILの制作過程を公開するための記録です。作品内の設定、未公開の原稿、候補、個人情報、内部の会話や制作素材は掲載しません。</p></aside><a class="back-link" href="/notes/">← VEIL NOTES 一覧へ</a></article>`);
}

const source = JSON.parse(await readFile(sourcePath, "utf8"));
if (!source || typeof source !== "object" || Array.isArray(source)) throw new Error("VEIL NOTES public index must be an object.");
assertExactKeys(source, new Set(["schemaVersion", "notes"]), "VEIL NOTES public index");
if (source.schemaVersion !== 1 || !Array.isArray(source.notes)) throw new Error("VEIL NOTES public index has an invalid schema.");

const ids = new Set();
const slugs = new Set();
const notes = source.notes.map(assertArticle).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt) || b.updatedAt.localeCompare(a.updatedAt));
for (const note of notes) {
  if (ids.has(note.id)) throw new Error(`Duplicate VEIL NOTES id: ${note.id}`);
  if (slugs.has(note.slug)) throw new Error(`Duplicate VEIL NOTES slug: ${note.slug}`);
  ids.add(note.id);
  slugs.add(note.slug);
}

await mkdir(outputDir, { recursive: true });
await writeFile(join(outputDir, "index.html"), renderIndex(notes), "utf8");
for (const note of notes) {
  const markdown = await readFile(join(sourceDir, `${note.slug}.md`), "utf8");
  const body = markdownToHtml(markdown, `VEIL NOTES ${note.id}`);
  const articleDir = join(outputDir, note.slug);
  await mkdir(articleDir, { recursive: true });
  await writeFile(join(articleDir, "index.html"), renderArticle(note, body), "utf8");
}

console.log(`Generated VEIL NOTES index and ${notes.length} published article page(s).`);
