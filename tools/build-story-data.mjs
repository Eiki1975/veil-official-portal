import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const root = process.cwd();
const sourcePath = join(root, "src", "content", "serial-stories.json");
const outputDir = join(root, "public", "story-data");
const indexPath = join(root, "src", "content", "serial-stories-index.json");

function canonicalBody(markdown) {
  const match = markdown.match(/^## 本文\s*$([\s\S]*)$/m);
  if (!match) throw new Error("Canonical story source is missing a 本文 section.");
  const lines = match[1].trim().split("\n");
  const titleIndex = lines.findIndex((line) => line.trim());
  if (titleIndex >= 0 && /^第\d+話/.test(lines[titleIndex].trim())) lines.splice(titleIndex, 1);
  const body = lines.join("\n").trim();
  if (!body) throw new Error("Canonical story source has no body text.");
  return body;
}

async function hydrateStory(value) {
  if (!value || typeof value !== "object") return value;
  const story = value;
  if (typeof story.body === "string") return story;
  const bodySource = typeof story.bodySource === "string" ? story.bodySource : "";
  if (!/^src\/content\/[A-Za-z0-9._/-]+\.md$/.test(bodySource) || bodySource.includes("..")) return story;
  const markdown = await readFile(join(root, bodySource), "utf8");
  const { bodySource: _bodySource, ...withoutBodySource } = story;
  return { ...withoutBodySource, body: canonicalBody(markdown) };
}

function assertStory(value) {
  if (!value || typeof value !== "object") throw new Error("Story data must be an object.");
  const story = value;
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,119}$/.test(String(story.id || ""))) throw new Error("Story data has an invalid id.");
  if (!String(story.memberSlug || "") || !String(story.title || "") || !String(story.body || "")) throw new Error(`Story ${story.id} is missing required text.`);
  if (!Array.isArray(story.images)) throw new Error(`Story ${story.id} is missing images.`);
  return story;
}

const source = JSON.parse(await readFile(sourcePath, "utf8"));
if (!Array.isArray(source)) throw new Error("serial-stories.json must contain an array.");

await mkdir(outputDir, { recursive: true });
const index = [];
for (const value of source) {
  const story = assertStory(await hydrateStory(value));
  const outputPath = join(outputDir, `${story.id}.json`);
  await writeFile(outputPath, `${JSON.stringify(story, null, 2)}\n`, "utf8");
  index.push({
    id: story.id,
    memberSlug: story.memberSlug,
    season: story.season,
    episode: story.episode,
    title: story.title,
    updatedAt: story.updatedAt,
    contentUrl: `/story-data/${story.id}.json`,
  });
}
await writeFile(indexPath, `${JSON.stringify(index, null, 2)}\n`, "utf8");
