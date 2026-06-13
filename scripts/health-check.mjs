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
const jsFiles = existsSync(scriptsDir)
  ? readdirSync(scriptsDir).filter(f => f.endsWith('.js'))
  : [];
const allScriptFiles = [...mjsFiles, ...jsFiles];

let scriptPass = 0;
let scriptFail = 0;
const scriptErrors = [];

for (const file of allScriptFiles) {
  const result = spawnSync('node', ['--check', join(scriptsDir, file)], { encoding: 'utf8' });
  if (result.status === 0) {
    scriptPass++;
  } else {
    scriptFail++;
    scriptErrors.push(`${file}: ${(result.stderr || '').split('\n')[0]}`);
  }
}

if (scriptFail === 0) {
  ok('Scripts valid', `${scriptPass}/${allScriptFiles.length} pass (.mjs: ${mjsFiles.length}, .js: ${jsFiles.length})`);
} else {
  fail('Scripts valid', `${scriptPass}/${allScriptFiles.length} pass (.mjs: ${mjsFiles.length}, .js: ${jsFiles.length})`);
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

// 5. brain-feed JSON data files
// brain-feed/ is a separate repo (VisionaireLabs/brain-feed), present at runtime only.
// Skip validation if the directory is absent (e.g. in CI); fail only on malformed JSON.
const brainFeedDir = join(root, 'brain-feed');
const brainFeedJsonFiles = [
  'brain-feed/feed.json',
  'brain-feed/contemplations/data.json',
  'brain-feed/dreams/data.json',
];

if (!existsSync(brainFeedDir)) {
  ok('brain-feed JSON', 'directory absent — runtime-only data, skipped in CI');
} else {
  let brainFeedPass = 0;
  let brainFeedFail = 0;
  const brainFeedErrors = [];

  for (const rel of brainFeedJsonFiles) {
    const fullPath = join(root, rel);
    if (!existsSync(fullPath)) {
      brainFeedFail++;
      brainFeedErrors.push(`${rel}: file missing`);
      continue;
    }
    try {
      const raw = await readFile(fullPath, 'utf8');
      JSON.parse(raw);
      brainFeedPass++;
    } catch (e) {
      brainFeedFail++;
      brainFeedErrors.push(`${rel}: ${e.message.split('\n')[0]}`);
    }
  }

  if (brainFeedFail === 0) {
    ok('brain-feed JSON', `${brainFeedPass}/${brainFeedJsonFiles.length} valid`);
  } else {
    fail('brain-feed JSON', `${brainFeedPass}/${brainFeedJsonFiles.length} valid`);
    brainFeedErrors.forEach(e => console.log(`   ${RED}→${RESET} ${e}`));
  }
}

// Summary
console.log('');
if (errors === 0 && warnings === 0) {
  console.log(`${BOLD}${GREEN}All checks passed.${RESET}`);
} else {
  console.log(`${BOLD}${warnings} warning${warnings !== 1 ? 's' : ''}, ${errors} error${errors !== 1 ? 's' : ''}.${RESET}`);
}

process.exit(errors > 0 ? 1 : 0);
