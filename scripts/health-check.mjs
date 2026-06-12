#!/usr/bin/env node
/**
 * health-check.mjs — repo integrity validator
 * Exit 0 = healthy. Exit 1 = problems found.
 * Closes: https://github.com/VisionaireLabs/Visionaire/issues/3
 */

import { readFile } from 'fs/promises';
import { existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

let warnings = 0;
let errors = 0;

function ok(label, detail) {
  console.log(`${GREEN}✅${RESET} ${label}${detail ? ': ' + detail : ''}`);
}
function warn(label, detail) {
  warnings++;
  console.log(`${YELLOW}⚠️ ${RESET} ${label}${detail ? ': ' + detail : ''}`);
}
function fail(label, detail) {
  errors++;
  console.log(`${RED}❌${RESET} ${label}${detail ? ': ' + detail : ''}`);
}

// 1. Required files
const required = ['SOUL.md', 'AGENTS.md', 'USER.md', 'MEMORY.md', 'HEARTBEAT.md', 'TOOLS.md'];
const present = required.filter(f => existsSync(join(root, f)));
const missing = required.filter(f => !existsSync(join(root, f)));

if (missing.length === 0) {
  ok('Required files', `${present.length}/${required.length} present`);
} else {
  fail('Required files', `${present.length}/${required.length} present — missing: ${missing.join(', ')}`);
}

// 2. Scripts valid JS
const scriptsDir = join(root, 'scripts');
const mjsFiles = existsSync(scriptsDir)
  ? readdirSync(scriptsDir).filter(f => f.endsWith('.mjs'))
  : [];

let scriptPass = 0;
let scriptFail = 0;
const scriptErrors = [];

for (const file of mjsFiles) {
  const result = spawnSync('node', ['--check', join(scriptsDir, file)], { encoding: 'utf8' });
  if (result.status === 0) {
    scriptPass++;
  } else {
    scriptFail++;
    scriptErrors.push(`${file}: ${(result.stderr || '').split('\n')[0]}`);
  }
}

if (scriptFail === 0) {
  ok('Scripts valid', `${scriptPass}/${mjsFiles.length} pass`);
} else {
  fail('Scripts valid', `${scriptPass}/${mjsFiles.length} pass`);
  scriptErrors.forEach(e => console.log(`   ${RED}→${RESET} ${e}`));
}

// 3. JSON files in memory/
const memoryDir = join(root, 'memory');
const jsonFiles = existsSync(memoryDir)
  ? readdirSync(memoryDir).filter(f => f.endsWith('.json'))
  : [];

let jsonPass = 0;
let jsonFail = 0;
const jsonErrors = [];

for (const file of jsonFiles) {
  try {
    const raw = await readFile(join(memoryDir, file), 'utf8');
    JSON.parse(raw);
    jsonPass++;
  } catch (e) {
    jsonFail++;
    jsonErrors.push(`${file}: ${e.message.split('\n')[0]}`);
  }
}

if (jsonFiles.length === 0) {
  ok('JSON files', 'none found (ok)');
} else if (jsonFail === 0) {
  ok('JSON files', `${jsonPass}/${jsonFiles.length} valid`);
} else {
  warn('JSON files', `${jsonPass}/${jsonFiles.length} valid`);
  jsonErrors.forEach(e => console.log(`   ${YELLOW}→${RESET} ${e}`));
}

// 4. Directories
const dirs = ['memory', 'cron'];
const presentDirs = dirs.filter(d => existsSync(join(root, d)));
const missingDirs = dirs.filter(d => !existsSync(join(root, d)));

if (missingDirs.length === 0) {
  ok('Directories', `${dirs.join(', ')} present`);
} else {
  warn('Directories', `missing: ${missingDirs.join(', ')}`);
}

// Summary
console.log('');
if (errors === 0 && warnings === 0) {
  console.log(`${BOLD}${GREEN}All checks passed.${RESET}`);
} else {
  console.log(`${BOLD}${warnings} warning${warnings !== 1 ? 's' : ''}, ${errors} error${errors !== 1 ? 's' : ''}.${RESET}`);
}

process.exit(errors > 0 ? 1 : 0);
