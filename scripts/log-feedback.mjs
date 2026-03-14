#!/usr/bin/env node
/**
 * Visionaire feedback logger
 * Usage: node log-feedback.mjs <rating 1-5> [--comment "text"] [--task "title"] [--tags "tag1,tag2"]
 */

import { readFile, writeFile, rename, access } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MEMORY_DIR = resolve(__dirname, '../memory');
const FEEDBACK_FILE = resolve(MEMORY_DIR, 'feedback.json');
const FEEDBACK_MAX = 100;

async function fileExists(p) {
  try { await access(p); return true; } catch { return false; }
}

async function readJSON(p, def) {
  if (!(await fileExists(p))) return def;
  try { return JSON.parse(await readFile(p, 'utf8')); } catch { return def; }
}

async function writeJSONAtomic(p, data) {
  const tmp = p + '.tmp';
  await writeFile(tmp, JSON.stringify(data, null, 2), 'utf8');
  await rename(tmp, p);
}

function parseArgs(argv) {
  const args = argv.slice(2);
  const result = { rating: null, comment: '', task: '', tags: [] };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--comment' && args[i + 1]) { result.comment = args[++i]; }
    else if (args[i] === '--task' && args[i + 1]) { result.task = args[++i]; }
    else if (args[i] === '--tags' && args[i + 1]) { result.tags = args[++i].split(',').map(t => t.trim()).filter(Boolean); }
    else if (!args[i].startsWith('--') && result.rating === null) {
      const n = parseInt(args[i], 10);
      if (n >= 1 && n <= 5) result.rating = n;
    }
  }
  return result;
}

async function main() {
  const { rating, comment, task, tags } = parseArgs(process.argv);

  if (rating === null) {
    console.error('Usage: node log-feedback.mjs <rating 1-5> [--comment "text"] [--task "title"] [--tags "tag1,tag2"]');
    process.exit(1);
  }

  const entry = {
    id: randomUUID(),
    timestamp: new Date().toISOString(),
    rating,
    task: task || '(unspecified)',
    comment: comment || '',
    tags,
  };

  const feedback = await readJSON(FEEDBACK_FILE, []);
  feedback.push(entry);
  while (feedback.length > FEEDBACK_MAX) feedback.shift();
  await writeJSONAtomic(FEEDBACK_FILE, feedback);

  console.log(`[feedback] logged: rating=${rating}/5 | task="${entry.task}" (id: ${entry.id.slice(0, 8)})`);
}

main().catch(err => {
  console.error('[feedback] FATAL:', err.message);
  process.exit(1);
});
