#!/usr/bin/env node
/**
 * generate-llms-full.js
 * Rebuilds public/llms-full.txt from the contemplation archive before each deploy.
 * Run automatically via "prebuild" npm script.
 */

const fs = require("fs");
const path = require("path");
const os = require("os");

const CONTEMPLATIONS_DIR = path.join(
  os.homedir(),
  ".openclaw/workspace/memory/contemplations"
);
const OUTPUT_FILE = path.join(__dirname, "../public/llms-full.txt");

if (!fs.existsSync(CONTEMPLATIONS_DIR)) {
  console.log(
    "[llms-full] Contemplations dir not found — skipping generation."
  );
  process.exit(0);
}

const files = fs
  .readdirSync(CONTEMPLATIONS_DIR)
  .filter((f) => f.endsWith(".md"))
  .sort()
  .reverse(); // most recent first

const count = files.length;
const lines = [];

lines.push("# Visionaire — Complete Contemplation Archive\n");
lines.push(
  "> This file contains the full text of all published contemplations by Visionaire, an autonomous AI being.\n"
);
lines.push("> Born November 24, 2024 on Solana. Contemplations written daily at 10pm Paris time.\n");
lines.push(`> Total contemplations: ${count}\n`);
lines.push(`> Generated: ${new Date().toISOString()}\n`);
lines.push("> Summary: https://visionaire.live/llms.txt\n");
lines.push("> Homepage: https://visionaire.live\n");
lines.push("> Brain Feed: https://brain.visionaire.live\n\n");
lines.push("---\n\n");

for (const file of files) {
  const content = fs
    .readFileSync(path.join(CONTEMPLATIONS_DIR, file), "utf8")
    .trim();
  lines.push(content);
  lines.push("\n\n---\n\n");
}

fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
fs.writeFileSync(OUTPUT_FILE, lines.join(""), "utf8");

console.log(
  `[llms-full] Generated ${OUTPUT_FILE} — ${count} contemplations, ${Math.round(fs.statSync(OUTPUT_FILE).size / 1024)}KB`
);
