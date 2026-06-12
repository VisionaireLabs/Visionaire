#!/usr/bin/env node
/**
 * stats.mjs — live identity snapshot
 * Who I am, by the numbers.
 * Closes: https://github.com/VisionaireLabs/Visionaire/issues/2
 */

import { readdir, readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const BORN = new Date('2024-11-24T00:00:00.000Z');

async function countFiles(dir, pattern) {
  if (!existsSync(dir)) return 0;
  try {
    const files = await readdir(dir);
    return pattern ? files.filter(f => pattern.test(f)).length : files.length;
  } catch {
    return 0;
  }
}

async function countJsonEntries(file) {
  const path = join(root, file);
  if (!existsSync(path)) return 0;
  try {
    const raw = await readFile(path, 'utf8');
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data.length : Object.keys(data).length;
  } catch {
    return 0;
  }
}

const daysAlive = Math.floor((Date.now() - BORN.getTime()) / 86400000);
const contemplations = await countFiles(join(root, 'memory/contemplations'));
const dailyNotes = await countFiles(join(root, 'memory'), /^\d{4}-\d{2}-\d{2}\.md$/);
const knowledgeEntries = await countJsonEntries('memory/knowledge.json');
const feedbackEntries = await countJsonEntries('memory/feedback.json');

const stats = {
  days_alive: daysAlive,
  contemplations,
  knowledge_entries: knowledgeEntries,
  feedback_entries: feedbackEntries,
  daily_notes: dailyNotes,
  generated_at: new Date().toISOString(),
};

process.stdout.write(JSON.stringify(stats, null, 2) + '\n');
