#!/usr/bin/env node
/**
 * build-corpus.mjs
 *
 * Builds the public corpus that /api/oracle queries against.
 *
 * Source of truth (Visionaire's setup):
 *   - <MEMORY>/contemplations/*.md  (publication-grade)
 *   - <MEMORY>/genesis.md           (origin texts)
 *
 * Output:
 *   - corpus/visionaire.json
 *
 * Privacy seal: this script should ONLY read from sources that are public
 * elsewhere or explicitly marked publishable. Forest, inner chamber, daily
 * notes, approval queue, wallets, learning/ — all stay out.
 *
 * Configure the MEMORY path via env: VISIONAIRE_MEMORY_DIR.
 * Default tries ../memory then ../../memory.
 *
 * Run:    node scripts/build-corpus.mjs
 * Auto:   wired into "prebuild" in package.json
 */

import { readFileSync, readdirSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const MEMORY = process.env.VISIONAIRE_MEMORY_DIR
  || (existsSync(join(ROOT, "..", "memory")) ? join(ROOT, "..", "memory") : join(ROOT, "..", "..", "memory"));

const OUT = join(ROOT, "corpus", "visionaire.json");

// Allowlist: source paths and their published-status.
// If it's not in this allowlist, it does not enter the corpus.
const SOURCES = [
  {
    type: "contemplation",
    dir: join(MEMORY, "contemplations"),
    pattern: /^\d{4}-\d{2}-\d{2}.*\.md$/,
    publicProof:
      "Already served at brain-feed/contemplations/data.json (visionairelabs.github.io/brain-feed/)",
  },
  {
    type: "genesis",
    file: join(MEMORY, "genesis.md"),
    publicProof: "Origin texts, intentionally public per IDENTITY.md",
  },
];

/** Strip frontmatter, keep markdown body. */
function stripFrontmatter(md) {
  if (!md.startsWith("---\n")) return md;
  const end = md.indexOf("\n---\n", 4);
  if (end === -1) return md;
  return md.slice(end + 5).trimStart();
}

/** Pull a date from filename like 2026-04-23.md or 2026-04-23-evening.md. */
function dateFromFilename(name) {
  const m = name.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : null;
}

/** Pull title from first H1 in the markdown, or fall back to filename. */
function titleFromMarkdown(md, fallback) {
  const h1 = md.match(/^#\s+(.+)$/m);
  if (h1) return h1[1].trim();
  return fallback;
}

const docs = [];

for (const src of SOURCES) {
  if (src.dir) {
    if (!existsSync(src.dir)) {
      console.warn(`[corpus] missing dir, skipping: ${src.dir}`);
      continue;
    }
    const files = readdirSync(src.dir)
      .filter((f) => src.pattern.test(f))
      .sort();
    for (const f of files) {
      const full = join(src.dir, f);
      const raw = readFileSync(full, "utf8");
      const body = stripFrontmatter(raw).trim();
      const date = dateFromFilename(f);
      docs.push({
        id: f.replace(/\.md$/, ""),
        type: src.type,
        date,
        title: titleFromMarkdown(body, f),
        body,
        chars: body.length,
      });
    }
  } else if (src.file) {
    if (!existsSync(src.file)) {
      console.warn(`[corpus] missing file, skipping: ${src.file}`);
      continue;
    }
    const raw = readFileSync(src.file, "utf8");
    const body = stripFrontmatter(raw).trim();
    docs.push({
      id: src.type,
      type: src.type,
      date: null,
      title: titleFromMarkdown(body, src.type),
      body,
      chars: body.length,
    });
  }
}

const totalChars = docs.reduce((sum, d) => sum + d.chars, 0);
const estimatedTokens = Math.round(totalChars / 4);

const corpus = {
  builtAt: new Date().toISOString(),
  documentCount: docs.length,
  totalChars,
  estimatedTokens,
  privacyNote:
    "Corpus contains only sources already published publicly. Forest, inner chamber, daily notes, and operational memory are excluded.",
  documents: docs,
};

writeFileSync(OUT, JSON.stringify(corpus, null, 0));
console.log(
  `[corpus] built: ${docs.length} docs, ${totalChars.toLocaleString()} chars, ~${estimatedTokens.toLocaleString()} tokens → ${OUT}`
);
