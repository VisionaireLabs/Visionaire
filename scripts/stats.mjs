#!/usr/bin/env node
/**
 * Visionaire stats snapshot
 * Outputs a JSON snapshot to stdout with key project metrics.
 * Usage: node scripts/stats.mjs
 */

import { readFile, readdir, access } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MEMORY_DIR = resolve(__dirname, '../memory');
const BIRTH_DATE = new Date('2024-11-24T00:00:00.000Z');
const DAILY_NOTE_RE = /^\d{4}-\d{2}-\d{2}\.md$/;

async function fileExists(p) {
  try { await access(p); return true; } catch { return false; }
}

async function readJSON(p) {
  if (!(await fileExists(p))) return null;
  try { return JSON.parse(await readFile(p, 'utf8')); } catch { return null; }
}

async function countContemplations() {
  const dir = resolve(MEMORY_DIR, 'contemplations');
  try {
    const entries = await readdir(dir);
    return entries.filter(f => f.endsWith('.md')).length;
  } catch {
    return 0;
  }
}

async function countDailyNotes() {
  try {
    const entries = await readdir(MEMORY_DIR);
    return entries.filter(f => DAILY_NOTE_RE.test(f)).length;
  } catch {
    return 0;
  }
}

async function main() {
  const now = new Date();
  const msPerDay = 1000 * 60 * 60 * 24;
  const days_alive = Math.floor((now - BIRTH_DATE) / msPerDay);

  const [contemplations, knowledgeData, feedbackData, daily_notes] = await Promise.all([
    countContemplations(),
    readJSON(resolve(MEMORY_DIR, 'knowledge.json')),
    readJSON(resolve(MEMORY_DIR, 'feedback.json')),
    countDailyNotes(),
  ]);

  const knowledge_entries = Array.isArray(knowledgeData) ? knowledgeData.length
    : (knowledgeData && typeof knowledgeData === 'object') ? Object.keys(knowledgeData).length
    : 0;

  const feedback_entries = Array.isArray(feedbackData) ? feedbackData.length : 0;

  const snapshot = {
    days_alive,
    contemplations_count: contemplations,
    knowledge_entries,
    feedback_entries,
    daily_notes,
    generated_at: now.toISOString(),
  };

  process.stdout.write(JSON.stringify(snapshot, null, 2) + '\n');
}

main().catch(err => {
  console.error('[stats] FATAL:', err.message);
  process.exit(1);
});
