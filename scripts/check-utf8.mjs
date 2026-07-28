import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { TextDecoder } from "node:util";

const root = process.cwd();
const ignoredDirs = new Set([".git", ".next", "node_modules", "public"]);
const checkedExtensions = new Set([
  ".ts",
  ".tsx",
  ".json",
  ".css",
  ".sql",
  ".md",
  ".mjs",
]);
const decoder = new TextDecoder("utf-8", { fatal: true });
const mojibakePattern = new RegExp([
  "\\u00c3",
  "\\u00c2",
  "\\u00e2\\u20ac\\u2122",
  "\\u00e2\\u20ac\\u201c",
  "\\u00e2\\u20ac\\u0153",
  "\\u00e2\\u20ac",
  "\\ufffd",
].join("|"));

async function collectFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (ignoredDirs.has(entry.name)) continue;

    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await collectFiles(fullPath));
      continue;
    }

    if (checkedExtensions.has(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }

  return files;
}

const failures = [];
const files = await collectFiles(root);

for (const file of files) {
  const buffer = await readFile(file);
  const relative = path.relative(root, file);

  if (buffer.length >= 3 && buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) {
    failures.push(`${relative}: UTF-8 BOM detected`);
    continue;
  }

  let text;
  try {
    text = decoder.decode(buffer);
  } catch {
    failures.push(`${relative}: invalid UTF-8`);
    continue;
  }

  if (mojibakePattern.test(text)) {
    failures.push(`${relative}: possible mojibake`);
  }
}

if (failures.length > 0) {
  console.error("UTF-8 check failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`UTF-8 check passed (${files.length} files).`);
