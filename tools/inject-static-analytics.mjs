import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const root = process.cwd();
const dist = join(root, "dist");
const marker = '<script defer src="/analytics.js" data-veil-analytics="static"></script>';

async function htmlFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return htmlFiles(path);
    return entry.isFile() && entry.name.endsWith(".html") ? [path] : [];
  }));
  return nested.flat();
}

for (const path of await htmlFiles(dist)) {
  const html = await readFile(path, "utf8");
  // Vite's React entry already initialises GA4. Only static documents need the
  // shared bootstrap, otherwise a page view would be sent twice.
  if (html.includes(marker) || /\/assets\/index-[^"']+\.js/.test(html)) continue;
  if (!/<\/head>/i.test(html)) throw new Error(`Static HTML is missing </head>: ${path}`);
  await writeFile(path, html.replace(/<\/head>/i, `    ${marker}\n  </head>`), "utf8");
}

console.log("Injected GA4 bootstrap into static HTML pages.");
