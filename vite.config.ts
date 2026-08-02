import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { randomUUID } from "node:crypto";
import { copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";

type DraftImage = { id: string; filename?: string; source?: string; alt: string; caption: string };
type DraftStory = { id: string; sourceStoryId?: string; memberSlug: string; season: number; episode: number; title: string; body: string; images: DraftImage[]; updatedAt: string };

const rootDir = process.cwd();
const privateDir = join(rootDir, ".veil-admin");
const privateImagesDir = join(privateDir, "images");
const revisionsDir = join(privateDir, "revisions");
const draftsPath = join(privateDir, "story-drafts.json");
const publishedPath = join(rootDir, "src", "content", "serial-stories.json");
const publishedIndexPath = join(rootDir, "src", "content", "serial-stories-index.json");
const publicImagesDir = join(rootDir, "public", "images", "stories");
const storyDataDir = join(rootDir, "public", "story-data");

async function ensureAdminFolders() {
  await Promise.all([
    mkdir(privateImagesDir, { recursive: true }),
    mkdir(revisionsDir, { recursive: true }),
    mkdir(publicImagesDir, { recursive: true }),
    mkdir(storyDataDir, { recursive: true }),
  ]);
}

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await readFile(file, "utf8")) as T;
  } catch {
    return fallback;
  }
}

async function readBody(req: import("node:http").IncomingMessage) {
  const chunks: Buffer[] = [];
  let total = 0;
  for await (const chunk of req) {
    const next = Buffer.from(chunk);
    total += next.length;
    if (total > 42 * 1024 * 1024) throw new Error("画像ファイルが大きすぎます（40MB以下にしてください）。");
    chunks.push(next);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8")) as Record<string, unknown>;
}

function send(res: import("node:http").ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

function safeText(value: unknown, max = 30000) {
  return typeof value === "string" ? value.slice(0, max) : "";
}

const localAdminMethods = new Set(["GET", "POST"]);

function localAdminOrigin(hostHeader: string | undefined) {
  const host = safeText(hostHeader, 100).toLowerCase();
  if (!/^(?:localhost|127\.0\.0\.1)(?::\d{1,5})?$/.test(host)) return "";
  try {
    return new URL(`http://${host}`).origin;
  } catch {
    return "";
  }
}

function isLoopbackSocket(address: string | undefined) {
  return address === "127.0.0.1" || address === "::1" || address === "::ffff:127.0.0.1";
}

function isAllowedLocalAdminRequest(req: import("node:http").IncomingMessage) {
  const expectedOrigin = localAdminOrigin(req.headers.host);
  if (!expectedOrigin || !isLoopbackSocket(req.socket.remoteAddress)) return false;
  const origin = req.headers.origin;
  if (!origin) return req.method !== "POST";
  try {
    return new URL(origin).origin === expectedOrigin;
  } catch {
    return false;
  }
}

function isJsonRequest(req: import("node:http").IncomingMessage) {
  return /^application\/json(?:;|$)/i.test(req.headers["content-type"] || "");
}

function safeId(value: unknown) {
  const id = safeText(value, 120);
  return /^[A-Za-z0-9][A-Za-z0-9._-]{0,119}$/.test(id) ? id : "";
}

function safeFilename(value: unknown) {
  const filename = safeText(value, 180);
  return /^[A-Za-z0-9._-]+$/.test(filename) ? filename : "";
}

function safeImageSource(value: unknown) {
  const source = safeText(value, 240);
  return /^\/images\/[A-Za-z0-9._/-]+(?:\?v=[A-Za-z0-9._-]{1,80})?$/.test(source) && !source.includes("..") ? source : "";
}

function normalizeStories(value: unknown): DraftStory[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item): DraftStory[] => {
    if (!item || typeof item !== "object") return [];
    const story = item as Partial<DraftStory>;
    const id = safeId(story.id);
    if (!id) return [];
    const sourceStoryId = safeId(story.sourceStoryId);
    const images = Array.isArray(story.images) ? story.images.flatMap((image): DraftImage[] => {
      if (!image || typeof image !== "object") return [];
      const entry = image as Partial<DraftImage>;
      const imageId = safeId(entry.id);
      const filename = safeFilename(entry.filename);
      const source = safeImageSource(entry.source);
      if (!imageId || (!filename && !source)) return [];
      return [{ id: imageId, ...(filename ? { filename } : {}), ...(source ? { source } : {}), alt: safeText(entry.alt, 240), caption: safeText(entry.caption, 500) }];
    }) : [];
    return [{
      id,
      ...(sourceStoryId ? { sourceStoryId } : {}),
      memberSlug: safeText(story.memberSlug, 80),
      season: Math.max(1, Math.min(99, Number(story.season) || 1)),
      episode: Math.max(1, Math.min(99, Number(story.episode) || 1)),
      title: safeText(story.title, 160),
      body: safeText(story.body, 120000),
      images,
      updatedAt: safeText(story.updatedAt, 80) || new Date().toISOString(),
    }];
  });
}

function visualInsertIndexes(body: string, imageCount: number) {
  const candidates = body.replace(/\f/g, "").split("\n").map((line, index) => ({ value: line.trim(), index })).filter(({ value }) => value && value !== "PROLOGUE" && !value.endsWith("編") && !/^第[一二三四五六七八九十]+章/.test(value));
  return Array.from({ length: imageCount }, (_, index) => candidates[Math.min(candidates.length - 1, Math.floor(((index + 1) * candidates.length) / (imageCount + 1)))]?.index).filter((index): index is number => typeof index === "number");
}

function storyIndex(stories: Array<Record<string, unknown>>) {
  return stories.map((story) => ({
    id: safeId(story.id),
    memberSlug: safeText(story.memberSlug, 80),
    season: Math.max(1, Math.min(99, Number(story.season) || 1)),
    episode: Math.max(1, Math.min(99, Number(story.episode) || 1)),
    title: safeText(story.title, 160),
    updatedAt: safeText(story.updatedAt, 80),
    contentUrl: `/story-data/${safeId(story.id)}.json`,
  })).filter((story) => story.id && story.memberSlug && story.title);
}

function localAdminPlugin() {
  return {
    name: "veil-local-admin",
    configureServer(server: import("vite").ViteDevServer) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url || "/", "http://localhost");
        if (!url.pathname.startsWith("/__veil-admin/")) return next();
        if (!isAllowedLocalAdminRequest(req)) return send(res, 403, { error: "この編集機能はこのMac内の同一画面からのみ利用できます。" });
        if (!localAdminMethods.has(req.method || "")) {
          res.setHeader("Allow", "GET, POST");
          return send(res, 405, { error: "GETまたはPOSTのみ利用できます。" });
        }
        if (req.method === "POST" && !isJsonRequest(req)) return send(res, 415, { error: "JSON形式のリクエストのみ利用できます。" });
        try {
          await ensureAdminFolders();
          if (req.method === "GET" && url.pathname === "/__veil-admin/drafts") return send(res, 200, { stories: await readJson<DraftStory[]>(draftsPath, []) });
          if (req.method === "POST" && url.pathname === "/__veil-admin/drafts") {
            const payload = await readBody(req);
            const stories = normalizeStories(payload.stories);
            await writeFile(draftsPath, `${JSON.stringify(stories, null, 2)}\n`, "utf8");
            return send(res, 200, { stories });
          }
          if (req.method === "POST" && url.pathname === "/__veil-admin/image") {
            const payload = await readBody(req);
            const dataUrl = safeText(payload.dataUrl, 56 * 1024 * 1024);
            const match = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
            if (!match) return send(res, 400, { error: "PNG、JPEG、WebP画像を選んでください。" });
            const extension = extname(safeText(payload.name, 180)).toLowerCase() || (match[1] === "jpeg" ? ".jpg" : `.${match[1]}`);
            if (![".png", ".jpg", ".jpeg", ".webp"].includes(extension)) return send(res, 400, { error: "対応していない画像形式です。" });
            const filename = `${new Date().toISOString().slice(0, 10)}-${randomUUID()}${extension === ".jpeg" ? ".jpg" : extension}`;
            await writeFile(join(privateImagesDir, filename), Buffer.from(match[2], "base64"));
            return send(res, 200, { image: { id: randomUUID(), filename, alt: "", caption: "", preview: `/__veil-admin/media/${filename}` } });
          }
          if (req.method === "GET" && url.pathname.startsWith("/__veil-admin/media/")) {
            const filename = url.pathname.slice("/__veil-admin/media/".length);
            if (!/^[a-zA-Z0-9._-]+$/.test(filename)) return send(res, 400, { error: "画像名が不正です。" });
            const image = await readFile(join(privateImagesDir, filename));
            const type = filename.endsWith(".png") ? "image/png" : filename.endsWith(".webp") ? "image/webp" : "image/jpeg";
            res.statusCode = 200;
            res.setHeader("Content-Type", type);
            return res.end(image);
          }
          if (req.method === "POST" && url.pathname === "/__veil-admin/publish") {
            const payload = await readBody(req);
            const storyId = safeId(payload.storyId);
            const drafts = await readJson<DraftStory[]>(draftsPath, []);
            const story = drafts.find((entry) => entry.id === storyId);
            if (!story || !story.title.trim() || !story.body.trim()) return send(res, 400, { error: "タイトルと本文を入力してから公開用に反映してください。" });
            const publishedId = safeId(story.sourceStoryId) || story.id;
            const insertIndexes = visualInsertIndexes(story.body, story.images.length);
            const publicStory = {
              id: publishedId,
              memberSlug: story.memberSlug,
              season: story.season,
              episode: story.episode,
              title: story.title,
              body: story.body,
              images: story.images.map((image, index) => ({
                id: image.id,
                alt: image.alt,
                caption: image.caption,
                image: image.source || `/images/stories/${image.filename}`,
                ...(insertIndexes[index] === undefined ? {} : { afterIndex: insertIndexes[index] }),
              })),
              updatedAt: new Date().toISOString(),
            };
            const published = await readJson<Record<string, unknown>[]>(publishedPath, []);
            const previous = published.find((entry) => entry.id === publishedId) || null;
            for (const image of story.images) {
              if (image.filename) await copyFile(join(privateImagesDir, image.filename), join(publicImagesDir, image.filename));
            }
            const revisionFolder = join(revisionsDir, publishedId);
            await mkdir(revisionFolder, { recursive: true });
            const revisionName = `${new Date().toISOString().replace(/[:.]/g, "-")}-${randomUUID().slice(0, 8)}.json`;
            await writeFile(join(revisionFolder, revisionName), `${JSON.stringify({ savedAt: new Date().toISOString(), storyId: publishedId, previous, next: publicStory }, null, 2)}\n`, "utf8");
            const next = [...published.filter((entry) => entry.id !== publishedId), publicStory].sort((a, b) => String(a.memberSlug).localeCompare(String(b.memberSlug)) || Number(a.season) - Number(b.season) || Number(a.episode) - Number(b.episode));
            await writeFile(publishedPath, `${JSON.stringify(next, null, 2)}\n`, "utf8");
            await writeFile(join(storyDataDir, `${publishedId}.json`), `${JSON.stringify(publicStory, null, 2)}\n`, "utf8");
            await writeFile(publishedIndexPath, `${JSON.stringify(storyIndex(next), null, 2)}\n`, "utf8");
            return send(res, 200, { story: publicStory });
          }
          return send(res, 404, { error: "見つかりません。" });
        } catch (error) {
          return send(res, 500, { error: error instanceof Error ? error.message : "保存に失敗しました。" });
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), localAdminPlugin()],
  server: { host: "127.0.0.1" },
  preview: { host: "127.0.0.1" },
  base: "/",
});
