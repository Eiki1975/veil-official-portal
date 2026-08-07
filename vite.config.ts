import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { randomUUID } from "node:crypto";
import { execFile } from "node:child_process";
import { copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { promisify } from "node:util";

type DraftImage = { id: string; filename?: string; source?: string; alt: string; caption: string };
type DraftStory = { id: string; sourceStoryId?: string; memberSlug: string; season: number; episode: number; title: string; body: string; images: DraftImage[]; updatedAt: string };
type DraftNoteCover = { filename?: string; source?: string; alt: string; preview?: string };
type DraftNote = { id: string; sourcePublishedId?: string; slug: string; title: string; summary: string; category: string; publishedAt: string; updatedAt: string; readingMinutes: number; body: string; cover?: DraftNoteCover };
type PublishedNote = { id: string; slug: string; title: string; summary: string; category: string; publishedAt: string; updatedAt: string; readingMinutes: number; cover?: { src: string; alt: string } };

const rootDir = process.cwd();
const privateDir = join(rootDir, ".veil-admin");
const privateImagesDir = join(privateDir, "images");
const revisionsDir = join(privateDir, "revisions");
const draftsPath = join(privateDir, "story-drafts.json");
const notesPrivateDir = join(privateDir, "notes");
const noteAssetsDir = join(notesPrivateDir, "assets");
const noteCandidatesDir = join(notesPrivateDir, "candidates");
const notePreviewsDir = join(notesPrivateDir, "previews");
const noteDraftsPath = join(notesPrivateDir, "drafts.json");
const publishedPath = join(rootDir, "src", "content", "serial-stories.json");
const publishedIndexPath = join(rootDir, "src", "content", "serial-stories-index.json");
const publishedNotesDir = join(rootDir, "src", "content", "notes-published");
const publishedNotesPath = join(publishedNotesDir, "index.json");
const notesStylesheetPath = join(rootDir, "public", "notes.css");
const notesPreviewBuilderPath = join(rootDir, "tools", "build-note-candidate-preview.mjs");
const publicImagesDir = join(rootDir, "public", "images", "stories");
const storyDataDir = join(rootDir, "public", "story-data");
const runProcess = promisify(execFile);

async function ensureAdminFolders() {
  await Promise.all([
    mkdir(privateImagesDir, { recursive: true }),
    mkdir(revisionsDir, { recursive: true }),
    mkdir(noteAssetsDir, { recursive: true }),
    mkdir(noteCandidatesDir, { recursive: true }),
    mkdir(notePreviewsDir, { recursive: true }),
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
    if (total > 42 * 1024 * 1024) throw new Error("画像ファイルが大きすぎます（30MB程度までにしてください）。");
    chunks.push(next);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8")) as Record<string, unknown>;
}

function send(res: import("node:http").ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

function contentType(filename: string) {
  if (filename.endsWith(".html")) return "text/html; charset=utf-8";
  if (filename.endsWith(".css")) return "text/css; charset=utf-8";
  if (filename.endsWith(".png")) return "image/png";
  if (filename.endsWith(".webp")) return "image/webp";
  if (filename.endsWith(".jpg") || filename.endsWith(".jpeg")) return "image/jpeg";
  return "application/octet-stream";
}

function sendFile(res: import("node:http").ServerResponse, body: Buffer, filename: string) {
  res.statusCode = 200;
  res.setHeader("Content-Type", contentType(filename));
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Robots-Tag", "noindex, nofollow");
  res.end(body);
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

function safeNoteSlug(value: unknown) {
  const slug = safeText(value, 80).toLowerCase();
  return /^[a-z0-9][a-z0-9-]{0,79}$/.test(slug) ? slug : "";
}

function safeNoteDate(value: unknown) {
  const date = safeText(value, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : "";
}

function safeNoteCoverSource(value: unknown) {
  const source = safeText(value, 240);
  return /^\/images\/notes\/[a-z0-9-]+\/[A-Za-z0-9._-]+\.(?:png|jpe?g|webp)$/i.test(source) && !source.includes("..") ? source : "";
}

function noteAssetPreview(filename: string) {
  return `/__veil-admin/notes/assets/${filename}`;
}

function normalizeNotes(value: unknown): DraftNote[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item): DraftNote[] => {
    if (!item || typeof item !== "object") return [];
    const note = item as Partial<DraftNote>;
    const id = safeId(note.id);
    if (!id) return [];
    const sourcePublishedId = safeId(note.sourcePublishedId);
    const slug = safeText(note.slug, 80).toLowerCase();
    const coverValue = note.cover && typeof note.cover === "object" ? note.cover : undefined;
    const filename = safeFilename(coverValue?.filename);
    const source = safeNoteCoverSource(coverValue?.source);
    const cover = filename || source ? {
      ...(filename ? { filename } : {}),
      ...(source ? { source } : {}),
      alt: safeText(coverValue?.alt, 320),
      ...(filename ? { preview: noteAssetPreview(filename) } : source ? { preview: source } : {}),
    } : undefined;
    return [{
      id,
      ...(sourcePublishedId ? { sourcePublishedId } : {}),
      slug,
      title: safeText(note.title, 180),
      summary: safeText(note.summary, 500),
      category: safeText(note.category, 120),
      publishedAt: safeNoteDate(note.publishedAt),
      updatedAt: safeNoteDate(note.updatedAt),
      readingMinutes: Math.max(1, Math.min(99, Math.trunc(Number(note.readingMinutes) || 5))),
      body: safeText(note.body, 160000),
      ...(cover ? { cover } : {}),
    }];
  });
}

function assertPublishedNote(value: unknown): PublishedNote {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("公開済みNOTEの形式を確認できませんでした。");
  const note = value as Partial<PublishedNote>;
  const id = safeId(note.id);
  const slug = safeNoteSlug(note.slug);
  const title = safeText(note.title, 180).trim();
  const summary = safeText(note.summary, 500).trim();
  const category = safeText(note.category, 120).trim();
  const publishedAt = safeNoteDate(note.publishedAt);
  const updatedAt = safeNoteDate(note.updatedAt);
  const readingMinutes = Math.trunc(Number(note.readingMinutes));
  if (!id || !slug || !title || summary.length < 20 || !category || !publishedAt || !updatedAt || !Number.isInteger(readingMinutes) || readingMinutes < 1 || readingMinutes > 99) throw new Error("公開済みNOTEの形式を確認できませんでした。");
  const rawCover = note.cover;
  if (rawCover === undefined) return { id, slug, title, summary, category, publishedAt, updatedAt, readingMinutes };
  if (!rawCover || typeof rawCover !== "object") throw new Error("公開済みNOTEのカバー画像を確認できませんでした。");
  const cover = rawCover as { src?: unknown; alt?: unknown };
  const src = safeNoteCoverSource(cover.src);
  const alt = safeText(cover.alt, 320).trim();
  if (!src || !src.startsWith(`/images/notes/${slug}/`) || !alt) throw new Error("公開済みNOTEのカバー画像を確認できませんでした。");
  return { id, slug, title, summary, category, publishedAt, updatedAt, readingMinutes, cover: { src, alt } };
}

async function readPublishedNotesWithBodies() {
  const source = await readJson<{ schemaVersion?: unknown; notes?: unknown[] }>(publishedNotesPath, {});
  if (source.schemaVersion !== 1 || !Array.isArray(source.notes)) throw new Error("公開済みNOTEの索引を確認できませんでした。");
  const notes = source.notes.map(assertPublishedNote);
  const bodies = new Map<string, string>();
  for (const note of notes) bodies.set(note.id, await readFile(join(publishedNotesDir, `${note.slug}.md`), "utf8"));
  return { notes, bodies };
}

function articleFromDraft(draft: DraftNote): PublishedNote {
  const slug = safeNoteSlug(draft.slug);
  const title = draft.title.trim();
  const summary = draft.summary.trim();
  const category = draft.category.trim();
  const publishedAt = safeNoteDate(draft.publishedAt);
  const updatedAt = safeNoteDate(draft.updatedAt);
  const readingMinutes = Math.trunc(Number(draft.readingMinutes));
  if (!slug || !title || summary.length < 20 || !category || !publishedAt || !updatedAt || !Number.isInteger(readingMinutes) || readingMinutes < 1 || readingMinutes > 99 || !draft.body.trim()) throw new Error("公開URL、タイトル、検索用要約、カテゴリ、日付、読了目安、本文を確認してください。");
  const id = safeId(draft.sourcePublishedId) || `veil-notes-${slug}`;
  const cover = draft.cover;
  if (!cover) return { id, slug, title, summary, category, publishedAt, updatedAt, readingMinutes };
  const alt = safeText(cover.alt, 320).trim();
  const src = cover.filename ? `/images/notes/${slug}/${safeFilename(cover.filename)}` : safeNoteCoverSource(cover.source);
  if (!src || !src.startsWith(`/images/notes/${slug}/`) || !alt) throw new Error("カバー画像を使う場合は、画像と説明文（ALT）を入力してください。");
  return { id, slug, title, summary, category, publishedAt, updatedAt, readingMinutes, cover: { src, alt } };
}

function previewPath(candidateId: string) {
  return `/__veil-admin/notes-preview/${candidateId}/notes/`;
}

async function buildLocalNotePreview(configPath: string) {
  await runProcess(process.execPath, [notesPreviewBuilderPath, configPath], { cwd: rootDir });
}

async function createNoteCandidate(draft: DraftNote, origin: string) {
  const article = articleFromDraft(draft);
  const { notes: publishedNotes, bodies } = await readPublishedNotesWithBodies();
  const sourcePublishedId = safeId(draft.sourcePublishedId);
  const previous = sourcePublishedId ? publishedNotes.find((note) => note.id === sourcePublishedId) : undefined;
  if (sourcePublishedId && !previous) throw new Error("元の公開済みNOTEを確認できませんでした。");
  if (previous && previous.slug !== article.slug) throw new Error("公開済みNOTEのURL変更は、この画面では行えません。新しいNOTEとして作成してください。");
  if (!previous && publishedNotes.some((note) => note.id === article.id || note.slug === article.slug)) throw new Error("この公開URLはすでに使われています。既存NOTEは編集用コピーから更新してください。");

  const candidateId = `note-candidate-${randomUUID()}`;
  const candidateRoot = join(noteCandidatesDir, candidateId);
  const sourceDir = join(candidateRoot, "notes-published");
  const previewRoot = join(notePreviewsDir, candidateId);
  const candidateNotes = [...publishedNotes.filter((note) => note.id !== article.id), article]
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt) || b.updatedAt.localeCompare(a.updatedAt));
  const candidateBodies = new Map(bodies);
  candidateBodies.set(article.id, draft.body.replace(/\r\n?/g, "\n").trim().concat("\n"));

  await rm(candidateRoot, { recursive: true, force: true });
  await rm(previewRoot, { recursive: true, force: true });
  await mkdir(sourceDir, { recursive: true });
  await writeFile(join(sourceDir, "index.json"), `${JSON.stringify({ schemaVersion: 1, notes: candidateNotes }, null, 2)}\n`, "utf8");
  for (const note of candidateNotes) {
    const body = candidateBodies.get(note.id);
    if (!body) throw new Error("公開済みNOTEの本文を確認できませんでした。");
    await writeFile(join(sourceDir, `${note.slug}.md`), body, "utf8");
  }

  const coverFilename = safeFilename(draft.cover?.filename);
  if (coverFilename) {
    const candidateAssetDir = join(candidateRoot, "assets", "images", "notes", article.slug);
    const previewAssetDir = join(previewRoot, "images", "notes", article.slug);
    await mkdir(candidateAssetDir, { recursive: true });
    await mkdir(previewAssetDir, { recursive: true });
    await copyFile(join(noteAssetsDir, coverFilename), join(candidateAssetDir, coverFilename));
    await copyFile(join(noteAssetsDir, coverFilename), join(previewAssetDir, coverFilename));
  }

  await mkdir(previewRoot, { recursive: true });
  await copyFile(notesStylesheetPath, join(previewRoot, "notes.css"));
  const previewBase = `/__veil-admin/notes-preview/${candidateId}`;
  const previewConfigPath = join(candidateRoot, "preview-config.json");
  await writeFile(previewConfigPath, `${JSON.stringify({
    sourceDir,
    outputDir: join(previewRoot, "notes"),
    siteUrl: origin,
    routePrefix: `${previewBase}/notes`,
    stylesheetHref: `${previewBase}/notes.css`,
    robots: "noindex,nofollow",
    localAssetSlugs: coverFilename ? [article.slug] : [],
    localAssetPrefix: previewBase,
  }, null, 2)}\n`, "utf8");
  await buildLocalNotePreview(previewConfigPath);
  const createdAt = new Date().toISOString();
  await writeFile(join(candidateRoot, "manifest.json"), `${JSON.stringify({ schemaVersion: 1, candidateId, createdAt, sourceDraftId: draft.id, article }, null, 2)}\n`, "utf8");
  return { candidateId, previewUrl: previewPath(candidateId), createdAt };
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
          if (req.method === "GET" && url.pathname.startsWith("/__veil-admin/notes-preview/")) {
            const requested = url.pathname.slice("/__veil-admin/notes-preview/".length);
            const parts = requested.split("/").filter(Boolean);
            const candidateId = safeId(parts.shift());
            if (!candidateId) return send(res, 404, { error: "公開候補が見つかりません。" });
            if (!parts.length) parts.push("notes", "index.html");
            else if (url.pathname.endsWith("/")) parts.push("index.html");
            if (parts.some((part) => !/^[A-Za-z0-9._-]+$/.test(part) || part === "." || part === "..")) return send(res, 400, { error: "公開候補のパスが不正です。" });
            try {
              return sendFile(res, await readFile(join(notePreviewsDir, candidateId, ...parts)), parts[parts.length - 1]);
            } catch {
              return send(res, 404, { error: "公開候補が見つかりません。" });
            }
          }
          if (req.method === "GET" && url.pathname.startsWith("/__veil-admin/notes/assets/")) {
            const filename = url.pathname.slice("/__veil-admin/notes/assets/".length);
            if (!safeFilename(filename)) return send(res, 400, { error: "画像名が不正です。" });
            try {
              return sendFile(res, await readFile(join(noteAssetsDir, filename)), filename);
            } catch {
              return send(res, 404, { error: "画像が見つかりません。" });
            }
          }
          if (req.method === "GET" && url.pathname === "/__veil-admin/notes/drafts") return send(res, 200, { notes: normalizeNotes(await readJson<DraftNote[]>(noteDraftsPath, [])) });
          if (req.method === "POST" && url.pathname === "/__veil-admin/notes/drafts") {
            const payload = await readBody(req);
            const notes = normalizeNotes(payload.notes);
            await writeFile(noteDraftsPath, `${JSON.stringify(notes, null, 2)}\n`, "utf8");
            return send(res, 200, { notes });
          }
          if (req.method === "GET" && url.pathname === "/__veil-admin/notes/published") {
            const { notes, bodies } = await readPublishedNotesWithBodies();
            return send(res, 200, { notes: notes.map((note) => ({ ...note, body: bodies.get(note.id) || "" })) });
          }
          if (req.method === "POST" && url.pathname === "/__veil-admin/notes/cover") {
            const payload = await readBody(req);
            const dataUrl = safeText(payload.dataUrl, 42 * 1024 * 1024);
            const match = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
            if (!match) return send(res, 400, { error: "PNG、JPEG、WebP画像を選んでください。" });
            const extension = extname(safeText(payload.name, 180)).toLowerCase() || (match[1] === "jpeg" ? ".jpg" : `.${match[1]}`);
            if (![".png", ".jpg", ".jpeg", ".webp"].includes(extension)) return send(res, 400, { error: "対応していない画像形式です。" });
            const filename = `${new Date().toISOString().slice(0, 10)}-${randomUUID()}${extension === ".jpeg" ? ".jpg" : extension}`;
            await writeFile(join(noteAssetsDir, filename), Buffer.from(match[2], "base64"));
            return send(res, 200, { cover: { filename, alt: "", preview: noteAssetPreview(filename) } });
          }
          if (req.method === "POST" && url.pathname === "/__veil-admin/notes/candidates") {
            const payload = await readBody(req);
            const noteId = safeId(payload.noteId);
            const notes = normalizeNotes(await readJson<DraftNote[]>(noteDraftsPath, []));
            const note = notes.find((entry) => entry.id === noteId);
            if (!note) return send(res, 404, { error: "下書きが見つかりません。" });
            const origin = localAdminOrigin(req.headers.host);
            if (!origin) return send(res, 403, { error: "このMac内の画面から実行してください。" });
            return send(res, 200, { candidate: await createNoteCandidate(note, origin) });
          }
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
