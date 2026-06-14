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
const required = ['SOUL.md', 'AGENTS.md', 'USER.md', 'MEMORY.md', 'HEARTBEAT.md', 'TOOLS.md', 'AI_STACK.md', 'CHANGELOG.md'];
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

// 2b. Python scripts syntax check
const pyFiles = existsSync(scriptsDir)
  ? readdirSync(scriptsDir).filter(f => f.endsWith('.py'))
  : [];

if (pyFiles.length > 0) {
  // Probe python3 availability first
  const pyProbe = spawnSync('python3', ['--version'], { encoding: 'utf8' });
  if (pyProbe.status !== 0) {
    warn('Python scripts', `python3 not found — skipped ${pyFiles.length} .py file(s)`);
  } else {
    let pyPass = 0;
    let pyFail = 0;
    const pyErrors = [];
    for (const file of pyFiles) {
      const result = spawnSync('python3', ['-m', 'py_compile', join(scriptsDir, file)], { encoding: 'utf8' });
      if (result.status === 0) {
        pyPass++;
      } else {
        pyFail++;
        pyErrors.push(`${file}: ${(result.stderr || '').split('\n')[0]}`);
      }
    }
    if (pyFail === 0) {
      ok('Python scripts valid', `${pyPass}/${pyFiles.length} pass`);
    } else {
      fail('Python scripts valid', `${pyPass}/${pyFiles.length} pass`);
      pyErrors.forEach(e => console.log(`   ${RED}→${RESET} ${e}`));
    }
  }
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

// 6. corpus/visionaire.json
const corpusPath = join(root, 'corpus', 'visionaire.json');
if (!existsSync(corpusPath)) {
  fail('corpus/visionaire.json', 'file missing — run: node scripts/build-corpus.mjs');
} else {
  try {
    const raw = await readFile(corpusPath, 'utf8');
    const corpus = JSON.parse(raw);
    const corpusRequired = ['builtAt', 'documentCount', 'documents'];
    const corpusMissing = corpusRequired.filter(k => !(k in corpus));
    if (corpusMissing.length > 0) {
      fail('corpus/visionaire.json', `missing keys: ${corpusMissing.join(', ')}`);
    } else if (!Array.isArray(corpus.documents)) {
      fail('corpus/visionaire.json', '"documents" must be an array');
    } else if (corpus.documents.length === 0) {
      fail('corpus/visionaire.json', '"documents" array is empty — corpus may have been built without memory access');
    } else if (corpus.documentCount !== corpus.documents.length) {
      warn('corpus/visionaire.json', `documentCount (${corpus.documentCount}) != documents.length (${corpus.documents.length})`);
    } else {
      ok('corpus/visionaire.json', `${corpus.documents.length} docs, built ${corpus.builtAt}`);
    }
  } catch (e) {
    fail('corpus/visionaire.json', `invalid JSON: ${e.message.split('\n')[0]}`);
  }
}

// 7. cron/*.md parity with TOOLS.md
// Every spec file in cron/ should be mentioned by name in TOOLS.md.
// A missing entry means a running cron has no documentation — the gap that caused #90, #93, #96.
const cronDir = join(root, 'cron');
if (!existsSync(cronDir)) {
  warn('cron/TOOLS.md parity', 'cron/ directory absent — skipped');
} else {
  const toolsMdPath = join(root, 'TOOLS.md');
  if (!existsSync(toolsMdPath)) {
    warn('cron/TOOLS.md parity', 'TOOLS.md not found — skipped');
  } else {
    const toolsContent = await readFile(toolsMdPath, 'utf8');
    const cronSpecs = readdirSync(cronDir)
      .filter(f => f.endsWith('.md'))
      .map(f => f.replace(/\.md$/, ''));

    const undocumented = cronSpecs.filter(name => !toolsContent.includes(name));

    if (undocumented.length === 0) {
      ok('cron/TOOLS.md parity', `${cronSpecs.length} cron specs — all documented in TOOLS.md`);
    } else {
      warn(
        'cron/TOOLS.md parity',
        `${undocumented.length}/${cronSpecs.length} cron specs missing from TOOLS.md: ${undocumented.join(', ')}`
      );
    }
  }
}

// 8. cron spec files vs live jobs.json drift detection
const jobsJsonPath = '/data/.openclaw/cron/jobs.json';
if (!existsSync(jobsJsonPath)) {
  ok('cron/jobs.json drift', 'jobs.json not found at runtime path — skipped (CI/offline environment)');
} else {
  try {
    const jobsRaw = await readFile(jobsJsonPath, 'utf8');
    const jobsData = JSON.parse(jobsRaw);
    const liveJobs = (jobsData.jobs || []).map(j => j.name || '').filter(Boolean);

    // Normalize: lowercase, replace spaces with hyphens
    const normalize = s => s.toLowerCase().replace(/\s+/g, '-');
    const liveNormalized = new Set(liveJobs.map(normalize));

    const cronSpecs = existsSync(cronDir)
      ? readdirSync(cronDir).filter(f => f.endsWith('.md')).map(f => f.replace(/\.md$/, ''))
      : [];

    const unmatched = cronSpecs.filter(spec => !liveNormalized.has(normalize(spec)));

    // Warn only — stale specs are docs, not errors
    if (unmatched.length === 0) {
      ok('cron spec drift', `${cronSpecs.length} spec files — all match a live cron name (normalized)`);
    } else {
      warn(
        'cron spec drift',
        `${unmatched.length}/${cronSpecs.length} spec file(s) have no matching live cron: ${unmatched.join(', ')} — mark as Retired if intentional`
      );
    }
  } catch (e) {
    warn('cron spec drift', `failed to read/parse jobs.json: ${e.message.split('\n')[0]}`);
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
