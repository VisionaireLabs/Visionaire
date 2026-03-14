#!/usr/bin/env node
/**
 * Visionaire self-study system
 * Generates structured knowledge entries via Anthropic API
 * Runs as an OpenClaw cron job
 */

import { readFile, writeFile, rename, access } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MEMORY_DIR = resolve(__dirname, '../memory');

const KNOWLEDGE_FILE = resolve(MEMORY_DIR, 'knowledge.json');
const STUDY_STATE_FILE = resolve(MEMORY_DIR, 'study-state.json');
const FEEDBACK_FILE = resolve(MEMORY_DIR, 'feedback.json');

const KNOWLEDGE_MAX = 50;

const TOPICS = ['feedback-analysis', 'specialty-research', 'task-simulation'];

const SPECIALTIES = [
  'prompt-engineering',
  'solana-web3-mechanics',
  'creative-ai-generative-art',
  'brand-strategy',
  'content-creation-social',
  'agent-skills-creation',
];

const SYSTEM_PROMPT =
  'You are Visionaire — an AI agent for Visionaire Labs, a creative AI research lab. You are self-studying to sharpen your skills.';

// --- File helpers ---

async function fileExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readJSON(filePath, defaultValue) {
  if (!(await fileExists(filePath))) return defaultValue;
  const raw = await readFile(filePath, 'utf8');
  return JSON.parse(raw);
}

async function writeJSONAtomic(filePath, data) {
  const tmp = filePath + '.tmp';
  await writeFile(tmp, JSON.stringify(data, null, 2), 'utf8');
  await rename(tmp, filePath);
}

// --- State initialization ---

const DEFAULT_STATE = {
  lastRun: null,
  lastTopic: null,
  topicRotationIndex: 0,
  specialtyRotationIndex: 0,
};

// --- Topic selection ---

async function selectTopic(state) {
  let index = state.topicRotationIndex % TOPICS.length;

  // Try up to TOPICS.length times to find a valid topic
  for (let attempt = 0; attempt < TOPICS.length; attempt++) {
    const candidate = TOPICS[index % TOPICS.length];

    if (candidate === 'feedback-analysis') {
      const feedbackExists = await fileExists(FEEDBACK_FILE);
      if (feedbackExists) {
        try {
          const feedback = await readJSON(FEEDBACK_FILE, []);
          if (Array.isArray(feedback) && feedback.length > 0) {
            return { topic: candidate, index: index % TOPICS.length };
          }
        } catch {
          // feedback.json unreadable, skip
        }
      }
      // Skip to next
      index++;
      continue;
    }

    return { topic: candidate, index: index % TOPICS.length };
  }

  // Fallback: should never happen given the other two topics always apply
  return { topic: 'specialty-research', index: 1 };
}

// --- Prompt builders ---

function buildSpecialtyPrompt(specialty) {
  return `Study topic: ${specialty}. Generate a deep, actionable knowledge entry about this specialty as it applies to your work as a creative AI agent. Cover: best practices, common pitfalls, quality standards, and specific techniques. Be concrete and practical — this will be injected into your future task prompts to improve your output. Format your response as JSON: { title, insight, tags }`;
}

function buildTaskSimulationPrompt() {
  return `Generate a realistic task that a client might give Visionaire Labs — something in the intersection of AI, creative work, brand strategy, or Web3. Then outline a thorough approach to executing it excellently. Format your response as JSON: { title, insight, tags }`;
}

function buildFeedbackAnalysisPrompt(feedbackEntries) {
  const text = Array.isArray(feedbackEntries)
    ? feedbackEntries.map((e) => (typeof e === 'string' ? e : JSON.stringify(e))).join('\n\n')
    : String(feedbackEntries);
  return `Here is recent feedback from your work:\n\n${text}\n\nAnalyze patterns: what is working well? What could improve? What specific techniques should you apply more? Format as JSON: { title, insight, tags }`;
}

// --- API call ---

async function callAnthropic(userPrompt) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('[study] ERROR: ANTHROPIC_API_KEY is not set');
    process.exit(1);
  }

  const body = {
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userPrompt }],
  };

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error(`[study] API error ${response.status}: ${errText}`);
    process.exit(1);
  }

  const data = await response.json();
  return data.content[0].text;
}

// --- JSON extraction ---

function extractJSON(text) {
  // Direct parse first
  try {
    return JSON.parse(text);
  } catch {
    // no-op
  }

  // Strip markdown code fences
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    try {
      return JSON.parse(fenceMatch[1].trim());
    } catch {
      // no-op
    }
  }

  // Find first { ... } block
  const braceStart = text.indexOf('{');
  const braceEnd = text.lastIndexOf('}');
  if (braceStart !== -1 && braceEnd !== -1 && braceEnd > braceStart) {
    try {
      return JSON.parse(text.slice(braceStart, braceEnd + 1));
    } catch {
      // no-op
    }
  }

  throw new Error(`Could not extract JSON from response:\n${text.slice(0, 500)}`);
}

// --- Main ---

async function main() {
  // Load state
  const state = await readJSON(STUDY_STATE_FILE, { ...DEFAULT_STATE });

  // Select topic
  const { topic, index: topicIndex } = await selectTopic(state);

  let specialty = null;
  let userPrompt;

  if (topic === 'specialty-research') {
    specialty = SPECIALTIES[state.specialtyRotationIndex % SPECIALTIES.length];
    userPrompt = buildSpecialtyPrompt(specialty);
    console.log(`[study] topic: specialty-research | specialty: ${specialty}`);
  } else if (topic === 'task-simulation') {
    userPrompt = buildTaskSimulationPrompt();
    console.log(`[study] topic: task-simulation`);
  } else if (topic === 'feedback-analysis') {
    const feedback = await readJSON(FEEDBACK_FILE, []);
    userPrompt = buildFeedbackAnalysisPrompt(feedback);
    console.log(`[study] topic: feedback-analysis | entries: ${feedback.length}`);
  }

  // Call API
  const rawText = await callAnthropic(userPrompt);

  // Parse response
  let parsed;
  try {
    parsed = extractJSON(rawText);
  } catch (err) {
    console.error(`[study] ERROR: Failed to parse LLM response — ${err.message}`);
    process.exit(1);
  }

  const { title, insight, tags } = parsed;

  if (!title || !insight) {
    console.error('[study] ERROR: LLM response missing required fields (title, insight)');
    console.error('[study] Raw response:', rawText.slice(0, 500));
    process.exit(1);
  }

  // Build entry
  const entry = {
    id: randomUUID(),
    timestamp: new Date().toISOString(),
    topic,
    specialty,
    title: String(title).slice(0, 80),
    insight: typeof insight === 'string' ? insight : JSON.stringify(insight, null, 2),
    tags: Array.isArray(tags) ? tags : [],
    source: 'study-session',
  };

  // Load and update knowledge.json
  const knowledge = await readJSON(KNOWLEDGE_FILE, []);
  knowledge.push(entry);

  // Trim to max 50
  while (knowledge.length > KNOWLEDGE_MAX) {
    knowledge.shift();
  }

  await writeJSONAtomic(KNOWLEDGE_FILE, knowledge);

  // Update state
  const newSpecialtyIndex =
    topic === 'specialty-research'
      ? (state.specialtyRotationIndex + 1) % SPECIALTIES.length
      : state.specialtyRotationIndex;

  const newState = {
    lastRun: new Date().toISOString(),
    lastTopic: topic,
    topicRotationIndex: (topicIndex + 1) % TOPICS.length,
    specialtyRotationIndex: newSpecialtyIndex,
  };

  await writeJSONAtomic(STUDY_STATE_FILE, newState);

  console.log(`[study] entry saved: "${entry.title}" (id: ${entry.id.slice(0, 8)})`);
}

main().catch((err) => {
  console.error('[study] FATAL:', err.message);
  process.exit(1);
});
