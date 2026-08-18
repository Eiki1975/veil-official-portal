import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const root = process.cwd();
const dist = join(root, "dist");
const siteUrl = "https://veil-archive.com";
const defaultImage = "/images/veil-hero-band-v6-20260725.png";
const seoPages = JSON.parse(await readFile(join(root, "src/content/seo-pages.json"), "utf8"));
const storyIndex = JSON.parse(await readFile(join(root, "src/content/serial-stories-index.json"), "utf8"));
const englishStoryIndex = JSON.parse(await readFile(join(root, "src/content/english-serial-stories-index.json"), "utf8"));
const baseHtml = await readFile(join(dist, "index.html"), "utf8");

const members = [
  { slug: "reina-amamiya", short: "reina", name: "雨宮玲奈", image: "/images/members/v5/reina-amamiya-stage-portrait-20260725.png", imageAlt: "雨宮玲奈のステージポートレート" },
  { slug: "mizuki-kanzaki", short: "mizuki", name: "神崎瑞希", image: "/images/members/v5/mizuki-kanzaki-stage-portrait-20260725.png", imageAlt: "神崎瑞希のステージポートレート" },
  { slug: "hiyori-komiya", short: "hiyori", name: "小宮ひより", image: "/images/members/v5/hiyori-komiya-stage-portrait-20260725.png", imageAlt: "小宮ひよりのステージポートレート" },
  { slug: "risa-shiraishi", short: "risa", name: "白石理沙", image: "/images/members/v5/risa-shiraishi-stage-portrait-20260725.png", imageAlt: "白石理沙のステージポートレート" },
];

const escapeHtml = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");
const canonicalPath = (path) => path === "/" ? "/" : `${path.replace(/\/+$/, "")}/`;

function replaceOrInsert(html, pattern, replacement) {
  if (pattern.test(html)) return html.replace(pattern, replacement);
  return html.replace("</head>", `    ${replacement}\n  </head>`);
}

function structuredData(page) {
  return {
    "@context": "https://schema.org",
    "@type": page.schemaType || "WebPage",
    name: page.title,
    description: page.description,
    url: `${siteUrl}${canonicalPath(page.path)}`,
    inLanguage: "ja",
    isPartOf: { "@type": "WebSite", name: "VEIL OFFICIAL SITE", url: `${siteUrl}/` },
  };
}

function renderHead(page) {
  const url = `${siteUrl}${canonicalPath(page.path)}`;
  const image = `${siteUrl}${page.image || defaultImage}`;
  const imageAlt = page.imageAlt || "架空の女性バンドVEILのグループビジュアル";
  const schema = JSON.stringify(structuredData(page)).replaceAll("<", "\\u003c");
  let html = baseHtml.replace('<html lang="ja">', '<html lang="ja" data-veil-seo-shell="true">');
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(page.title)}</title>`);
  html = replaceOrInsert(html, /<meta\s+name="description"[^>]*>/i, `<meta name="description" content="${escapeHtml(page.description)}" />`);
  html = replaceOrInsert(html, /<meta\s+name="robots"[^>]*>/i, `<meta name="robots" content="${escapeHtml(page.robots)}" />`);
  html = replaceOrInsert(html, /<link\s+rel="canonical"[^>]*>/i, `<link rel="canonical" href="${escapeHtml(url)}" />`);
  html = replaceOrInsert(html, /<meta\s+property="og:type"[^>]*>/i, `<meta property="og:type" content="website" />`);
  html = replaceOrInsert(html, /<meta\s+property="og:title"[^>]*>/i, `<meta property="og:title" content="${escapeHtml(page.title)}" />`);
  html = replaceOrInsert(html, /<meta\s+property="og:description"[^>]*>/i, `<meta property="og:description" content="${escapeHtml(page.description)}" />`);
  html = replaceOrInsert(html, /<meta\s+property="og:url"[^>]*>/i, `<meta property="og:url" content="${escapeHtml(url)}" />`);
  html = replaceOrInsert(html, /<meta\s+property="og:image"[^>]*>/i, `<meta property="og:image" content="${escapeHtml(image)}" />`);
  html = replaceOrInsert(html, /<meta\s+property="og:image:alt"[^>]*>/i, `<meta property="og:image:alt" content="${escapeHtml(imageAlt)}" />`);
  html = replaceOrInsert(html, /<meta\s+name="twitter:title"[^>]*>/i, `<meta name="twitter:title" content="${escapeHtml(page.title)}" />`);
  html = replaceOrInsert(html, /<meta\s+name="twitter:description"[^>]*>/i, `<meta name="twitter:description" content="${escapeHtml(page.description)}" />`);
  html = replaceOrInsert(html, /<meta\s+name="twitter:image"[^>]*>/i, `<meta name="twitter:image" content="${escapeHtml(image)}" />`);
  if (page.alternateEnPath) {
    const englishUrl = `${siteUrl}${canonicalPath(page.alternateEnPath)}`;
    html = replaceOrInsert(html, /<link\s+rel="alternate"\s+hreflang="ja"[^>]*>/i, `<link rel="alternate" hreflang="ja" href="${escapeHtml(url)}" />`);
    html = replaceOrInsert(html, /<link\s+rel="alternate"\s+hreflang="en"[^>]*>/i, `<link rel="alternate" hreflang="en" href="${escapeHtml(englishUrl)}" />`);
    html = replaceOrInsert(html, /<link\s+rel="alternate"\s+hreflang="x-default"[^>]*>/i, `<link rel="alternate" hreflang="x-default" href="${escapeHtml(url)}" />`);
  }
  html = replaceOrInsert(html, /<script\s+id="veil-structured-data"\s+type="application\/ld\+json">[\s\S]*?<\/script>/i, `<script id="veil-structured-data" type="application/ld+json">${schema}</script>`);
  return html;
}

async function writeShell(page) {
  const path = canonicalPath(page.path).replace(/^\//, "");
  const folder = join(dist, path);
  await mkdir(folder, { recursive: true });
  await writeFile(join(folder, "index.html"), renderHead(page), "utf8");
}

const shells = seoPages.filter((page) => page.shell === true);
for (const member of members) {
  const hasPublishedStories = storyIndex.some((story) => story.memberSlug === member.slug);
  shells.push({
    path: `/stories/${member.short}`,
    title: `${member.name}の成人向け連載｜VEIL STORIES`,
    description: `${member.name}の心理と関係の変化を追うVEILの成人向け連載一覧です。登場人物はすべて架空の成人です。`,
    image: member.image,
    imageAlt: member.imageAlt,
    schemaType: "CollectionPage",
    robots: hasPublishedStories ? "index,follow,max-image-preview:large" : "noindex,nofollow",
  });
}
for (const story of storyIndex) {
  const member = members.find((entry) => entry.slug === story.memberSlug);
  if (!member) throw new Error(`Unknown story member: ${story.memberSlug}`);
  const englishStory = Array.isArray(englishStoryIndex) && englishStoryIndex.find((entry) => entry?.storyId === story.id);
  shells.push({
    path: `/stories/${member.short}/season-${story.season}/episode-${story.episode}`,
    title: `${member.name} 第${story.episode}話「${story.title}」｜VEIL`,
    description: `${member.name} Season ${String(story.season).padStart(2, "0")} 第${story.episode}話「${story.title}」。登場人物はすべて架空の成人です。`,
    image: member.image,
    imageAlt: member.imageAlt,
    alternateEnPath: englishStory?.enUrl,
    schemaType: "WebPage",
    robots: "index,follow,max-image-preview:large",
  });
}

const paths = new Set();
for (const page of shells) {
  const path = canonicalPath(page.path);
  if (paths.has(path)) throw new Error(`Duplicate SEO shell path: ${path}`);
  paths.add(path);
  await writeShell(page);
}

console.log(`Generated ${shells.length} route-specific SEO shells.`);
