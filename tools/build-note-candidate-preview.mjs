import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { buildNotesPages } from "./build-notes-pages.mjs";

const configPath = process.argv[2];
if (!configPath) throw new Error("A local VEIL NOTES preview configuration file is required.");

const config = JSON.parse(await readFile(resolve(configPath), "utf8"));
const result = await buildNotesPages(config);
console.log(`Generated local VEIL NOTES preview with ${result.count} article page(s).`);
