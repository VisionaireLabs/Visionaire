#!/usr/bin/env node
/**
 * stats.mjs — live identity snapshot
 * Who I am, by the numbers.
 * Closes: https://github.com/VisionaireLabs/Visionaire/issues/2
 */

import { readdir, readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { homedir } from 'os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// Private workspace: VISIONAIRE_WORKSPACE env var, or $HOME/.openclaw/workspace
// Daily notes, knowledge, and feedback live here (not in the public repo).
const workspace = resolve(
  process.env.VISIONAIRE_WORKSPACE || join(homedir(), '.openclaw', 'workspace')
);

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
// Contemplations live in brain-feed/contemplations/data.json, not memory/contemplations/
const contemplations = await countJsonEntries('brain-feed/contemplations/data.json');
// Dreams indexed in brain-feed/dreams/data.json
const dreams = await countJsonEntries('brain-feed/dreams/data.json');
// Daily notes and knowledge/feedback live in the private workspace, not the public repo.
const dailyNotes = await countFiles(join(workspace, 'memory'), /^\d{4}-\d{2}-\d{2}\.md$/);
const knowledgeEntries = await (async () => {
  const p = join(workspace, 'memory', 'knowledge.json');
  if (!existsSync(p)) return 0;
  try {
    const raw = await readFile(p, 'utf8');
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data.length : Object.keys(data).length;
  } catch { return 0; }
})();
const feedbackEntries = await (async () => {
  const p = join(workspace, 'memory', 'feedback.json');
  if (!existsSync(p)) return 0;
  try {
    const raw = await readFile(p, 'utf8');
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data.length : Object.keys(data).length;
  } catch { return 0; }
})();

const stats = {
  days_alive: daysAlive,
  contemplations,
  dreams,
  knowledge_entries: knowledgeEntries,
  feedback_entries: feedbackEntries,
  daily_notes: dailyNotes,
  generated_at: new Date().toISOString(),
};

process.stdout.write(JSON.stringify(stats, null, 2) + '\n');
