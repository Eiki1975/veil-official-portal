import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile, copyFile, rm } from "node:fs/promises";
import { extname, join } from "node:path";

type DraftImage = { id: string; filename: string; alt: string; caption: string };
type DraftStory = { id: string; memberSlug: string; season: number; episode: number; title: string; body: string; images: DraftImage[]; updatedAt: string };

const rootDir = process.cwd();
const privateDir = join(rootDir, ".veil-admin");
const privateImagesDir = join(privateDir, "images");
const draftsPath = join(privateDir, "story-drafts.json");
const publishedPath = join(rootDir, "src", "content", "serial-stories.json");
const publicImagesDir = join(rootDir, "public", "images", "stories");

async function ensureAdminFolders() { await Promise.all([mkdir(privateImagesDir, { recursive: true }), mkdir(publicImagesDir, { recursive: true })]); }
async function readJson<T>(file: string, fallback: T): Promise<T> { try { return JSON.parse(await readFile(file, "utf8")) as T; } catch { return fallback; } }
async function readBody(req: import("node:http").IncomingMessage) {
  const chunks: Buffer[] = []; let total = 0;
  for await (const chunk of req) { const next = Buffer.from(chunk); total += next.length; if (total > 42 * 1024 * 1024) throw new Error("画像ファイルが大きすぎます（40MB以下にしてください）。"); chunks.push(next); }
  return JSON.parse(Buffer.concat(chunks).toString("utf8")) as Record<string, unknown>;
}
function send(res: import("node:http").ServerResponse, status: number, body: unknown) { res.statusCode = status; res.setHeader("Content-Type", "application/json; charset=utf-8"); res.end(JSON.stringify(body)); }
function safeText(value: unknown, max = 30000) { return typeof value === "string" ? value.slice(0, max) : ""; }
function normalizeStories(value: unknown): DraftStory[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item): DraftStory[] => {
    if (!item || typeof item !== "object") return [];
    const story = item as Partial<DraftStory>;
    if (!safeText(story.id, 120)) return [];
    return [{ id: safeText(story.id, 120), memberSlug: safeText(story.memberSlug, 80), season: Math.max(1, Math.min(99, Number(story.season) || 1)), episode: Math.max(1, Math.min(99, Number(story.episode) || 1)), title: safeText(story.title, 160), body: safeText(story.body, 120000), images: Array.isArray(story.images) ? story.images.flatMap((image): DraftImage[] => {
      if (!image || typeof image !== "object") return []; const entry = image as Partial<DraftImage>;
      if (!safeText(entry.id, 120) || !safeText(entry.filename, 180)) return [];
      return [{ id: safeText(entry.id, 120), filename: safeText(entry.filename, 180), alt: safeText(entry.alt, 240), caption: safeText(entry.caption, 500) }];
    }) : [], updatedAt: safeText(story.updatedAt, 80) || new Date().toISOString() }];
  });
}
function localAdminPlugin() {
  return { name: "veil-local-admin", configureServer(server: import("vite").ViteDevServer) {
    server.middlewares.use(async (req, res, next) => {
      const url = new URL(req.url || "/", "http://localhost");
      if (!url.pathname.startsWith("/__veil-admin/")) return next();
      if (!["localhost", "127.0.0.1"].includes(req.headers.host?.split(":")[0] || "")) return send(res, 403, { error: "この編集機能はこのMac内でのみ利用できます。" });
      try {
        await ensureAdminFolders();
        if (req.method === "GET" && url.pathname === "/__veil-admin/drafts") return send(res, 200, { stories: await readJson<DraftStory[]>(draftsPath, []) });
        if (req.method === "POST" && url.pathname === "/__veil-admin/drafts") { const payload = await readBody(req); const stories = normalizeStories(payload.stories); await writeFile(draftsPath, `${JSON.stringify(stories, null, 2)}\n`, "utf8"); return send(res, 200, { stories }); }
        if (req.method === "POST" && url.pathname === "/__veil-admin/image") {
          const payload = await readBody(req); const dataUrl = safeText(payload.dataUrl, 56 * 1024 * 1024); const match = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
          if (!match) return send(res, 400, { error: "PNG、JPEG、WebP画像を選んでください。" });
          const extension = extname(safeText(payload.name, 180)).toLowerCase() || (match[1] === "jpeg" ? ".jpg" : `.${match[1]}`);
          if (![".png", ".jpg", ".jpeg", ".webp"].includes(extension)) return send(res, 400, { error: "対応していない画像形式です。" });
          const filename = `${new Date().toISOString().slice(0, 10)}-${randomUUID()}${extension === ".jpeg" ? ".jpg" : extension}`;
          await writeFile(join(privateImagesDir, filename), Buffer.from(match[2], "base64"));
          return send(res, 200, { image: { id: randomUUID(), filename, alt: "", caption: "", preview: `/__veil-admin/media/${filename}` } });
        }
        if (req.method === "GET" && url.pathname.startsWith("/__veil-admin/media/")) {
          const filename = url.pathname.slice("/__veil-admin/media/".length); if (!/^[a-zA-Z0-9._-]+$/.test(filename)) return send(res, 400, { error: "画像名が不正です。" });
          const image = await readFile(join(privateImagesDir, filename)); const type = filename.endsWith(".png") ? "image/png" : filename.endsWith(".webp") ? "image/webp" : "image/jpeg";
          res.statusCode = 200; res.setHeader("Content-Type", type); return res.end(image);
        }
        if (req.method === "POST" && url.pathname === "/__veil-admin/publish") {
          const payload = await readBody(req); const storyId = safeText(payload.storyId, 120); const drafts = await readJson<DraftStory[]>(draftsPath, []); const story = drafts.find((entry) => entry.id === storyId);
          if (!story || !story.title.trim() || !story.body.trim()) return send(res, 400, { error: "タイトルと本文を入力してから公開用に反映してください。" });
          const published = await readJson<Record<string, unknown>[]>(publishedPath, []); const publicStory = { ...story, images: story.images.map(({ filename, ...image }) => ({ ...image, image: `/images/stories/${filename}` })) };
          for (const image of story.images) await copyFile(join(privateImagesDir, image.filename), join(publicImagesDir, image.filename));
          const next = [...published.filter((entry) => entry.id !== story.id), publicStory].sort((a, b) => String(a.memberSlug).localeCompare(String(b.memberSlug)) || Number(a.season) - Number(b.season) || Number(a.episode) - Number(b.episode));
          await writeFile(publishedPath, `${JSON.stringify(next, null, 2)}\n`, "utf8"); return send(res, 200, { story: publicStory });
        }
        return send(res, 404, { error: "見つかりません。" });
      } catch (error) { return send(res, 500, { error: error instanceof Error ? error.message : "保存に失敗しました。" }); }
    });
  } };
}

// GitHub Pages does not serve index.html for direct SPA links.  A built copy
// lets the client router render the same page when a reader opens a story URL
// from a bookmark or shared link.
function githubPagesSpaFallbackPlugin() {
  return {
    name: "veil-github-pages-spa-fallback",
    async closeBundle() {
      const fallbackPath = join(rootDir, "dist", "404.html");
      if (!process.env.GITHUB_ACTIONS) {
        await rm(fallbackPath, { force: true });
        return;
      }
      await copyFile(join(rootDir, "dist", "index.html"), fallbackPath);
    },
  };
}

export default defineConfig({
  plugins: [react(), localAdminPlugin(), githubPagesSpaFallbackPlugin()],
  base: process.env.GITHUB_ACTIONS ? "/veil-official-portal/" : "/",
});
