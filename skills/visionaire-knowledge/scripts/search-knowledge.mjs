#!/usr/bin/env node
import { readFileSync } from 'fs';

const KNOWLEDGE_PATH = '/data/.openclaw/workspace/memory/knowledge.json';
const STOPWORDS = new Set([
  "a","an","the","and","or","but","in","on","at","to","for","of","with","by",
  "from","is","are","was","were","be","been","being","have","has","had","do",
  "does","did","will","would","could","should","may","might","shall","it","its",
  "this","that","these","those","i","we","you","he","she","they","what","which",
  "who","how","when","where","why"
]);
const BM25_K1 = 1.5;
const BM25_B  = 0.75;
const HALF_LIFE_DAYS = 30;

// --- CLI parsing ---
const args = process.argv.slice(2);
if (args.length === 0 || args[0] === '--help') {
  console.error('Usage: node search-knowledge.mjs "<query>" [--limit N]');
  process.exit(1);
}

let query = '';
let limit = 5;
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--limit' && args[i + 1]) {
    const n = parseInt(args[++i], 10);
    if (!isNaN(n) && n >= 1) limit = n;
  } else if (!args[i].startsWith('--')) {
    query = args[i];
  }
}

if (!query.trim()) {
  console.error('Usage: node search-knowledge.mjs "<query>" [--limit N]');
  process.exit(1);
}

// --- Tokenize ---
function tokenize(text) {
  if (!text || typeof text !== 'string') return [];
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(t => t.length > 1 && !STOPWORDS.has(t));
}

function entryTokens(entry) {
  const parts = [
    entry.title   || '',
    entry.insight || '',
    entry.topic   || '',
    entry.specialty || '',
    Array.isArray(entry.tags) ? entry.tags.join(' ') : '',
  ];
  return tokenize(parts.join(' '));
}

// --- Load knowledge ---
let entries = [];
try {
  const raw = readFileSync(KNOWLEDGE_PATH, 'utf8');
  entries = JSON.parse(raw);
  if (!Array.isArray(entries)) entries = [];
} catch (err) {
  if (err.code === 'ENOENT') {
    console.log('(no relevant knowledge found)');
    process.exit(0);
  }
  console.error('Error reading knowledge.json:', err.message);
  console.log('(no relevant knowledge found)');
  process.exit(0);
}

if (entries.length === 0) {
  console.log('(no relevant knowledge found)');
  process.exit(0);
}

// --- BM25 pre-computation ---
const N = entries.length;
const tokenizedEntries = entries.map(entryTokens);

// doc freq per term
const df = new Map();
for (const tokens of tokenizedEntries) {
  for (const t of new Set(tokens)) {
    df.set(t, (df.get(t) || 0) + 1);
  }
}

const avgdl = tokenizedEntries.reduce((s, t) => s + t.length, 0) / N;

const queryTerms = tokenize(query);
if (queryTerms.length === 0) {
  console.log('(no relevant knowledge found)');
  process.exit(0);
}

const now = Date.now();

function bm25Score(tokens, docLen) {
  let score = 0;
  const tf = new Map();
  for (const t of tokens) tf.set(t, (tf.get(t) || 0) + 1);

  for (const term of queryTerms) {
    const termTf = tf.get(term) || 0;
    if (termTf === 0) continue;
    const termDf = df.get(term) || 0;
    const idf = Math.log((N - termDf + 0.5) / (termDf + 0.5) + 1);
    const numerator = termTf * (BM25_K1 + 1);
    const denominator = termTf + BM25_K1 * (1 - BM25_B + BM25_B * (docLen / avgdl));
    score += idf * (numerator / denominator);
  }
  return score;
}

// --- Score & decay ---
const scored = entries.map((entry, i) => {
  const tokens = tokenizedEntries[i];
  const bm25 = bm25Score(tokens, tokens.length);
  const ageDays = (now - Date.parse(entry.timestamp)) / 86400000;
  const decay = Math.exp(-Math.LN2 / HALF_LIFE_DAYS * Math.max(0, ageDays));
  return { entry, score: bm25 * decay };
});

// --- Filter zero scores, sort, take top N ---
const results = scored
  .filter(r => r.score > 0)
  .sort((a, b) => b.score - a.score)
  .slice(0, limit);

if (results.length === 0) {
  console.log('(no relevant knowledge found)');
  process.exit(0);
}

// --- Normalize scores to 0-1 range for display ---
const maxScore = results[0].score;

console.log('## Relevant Context\n');
for (const { entry, score } of results) {
  const displayScore = (score / maxScore).toFixed(2);
  const topicPart = entry.topic ? `topic: ${entry.topic}` : '';
  const specialtyPart = entry.specialty ? `specialty: ${entry.specialty}` : '';
  const meta = [topicPart, specialtyPart, `score: ${displayScore}`]
    .filter(Boolean)
    .join(' | ');

  const insight = (entry.insight || '').replace(/\n/g, ' ').trim();
  const snippet = insight.length > 400 ? insight.slice(0, 400) + '...' : insight;

  console.log(`**${entry.title}** (${meta})`);
  console.log(snippet);
  console.log();
}
