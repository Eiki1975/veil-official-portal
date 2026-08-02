import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const root = process.cwd();
const sourcePath = join(root, "src", "content", "serial-stories.json");
const outputDir = join(root, "public", "story-data");
const indexPath = join(root, "src", "content", "serial-stories-index.json");

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
  const story = assertStory(value);
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
