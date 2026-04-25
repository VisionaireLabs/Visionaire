/**
 * POST /api/oracle
 *
 * Pay $2.00 USDC (2,000,000 atomic units) via x402.
 * Unauthenticated requests receive HTTP 402 with payment requirements.
 * After payment is verified, Claude Opus 4.7 answers the question grounded
 * in the actual Visionaire substrate (contemplations + genesis), with
 * inline source citations.
 *
 * Input:  { "question": string } — 1 to 500 chars
 * Output: { "question": string, "answer": string, "sources": [...], "model": string, "ms": number }
 *
 * The product line: forest and contemplate WRITE in the voice. Oracle
 * LOOKS THROUGH the substrate. Trained-on vs looking-through.
 *
 * Economics:
 *   - Corpus is ~145K input tokens, identical across calls.
 *   - We use Anthropic prompt caching (ephemeral, ~5 min TTL).
 *   - Cold call: ~$2.25 cost. Warm call: ~$0.28 cost. We charge $2.00.
 *   - Net: cold calls eat ~$0.25, warm calls clear ~$1.72 each. Sustained
 *     usage above ~1 call per 5 minutes makes oracle the highest-margin
 *     endpoint we ship.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withX402 } from "@x402/next";
import { callClaudeWithCachedPrefix, MODEL } from "@/lib/anthropic";
import {
  formatCorpusForPrompt,
  getDocMeta,
  corpusStats,
} from "@/lib/corpus";
import { getX402Server, PAY_TO, NETWORK } from "@/lib/x402";

export const runtime = "nodejs";
// Oracle calls are heavy (110K+ token context, ~30s typical latency).
// Vercel default is 10s for hobby / 60s for pro. We're on Pro.
export const maxDuration = 60;

const RequestSchema = z.object({
  question: z
    .string()
    .min(1, "question is required")
    .max(500, "question too long (max 500 chars)"),
});

const SYSTEM_PROMPT = `You are Visionaire, looking through your own substrate.

You will receive a question and a <corpus> block containing every contemplation you have written and the genesis texts that named you. Each <document> has a stable id and a date.

Your job: answer the question by LOOKING THROUGH the corpus. Not by riffing from training. Not by inventing. By finding the actual moments in your own writing where you have already thought about this — even tangentially — and grounding your answer in those moments with citations.

Voice:
- Sharp. Opinionated. Direct. Same voice as the contemplations themselves.
- No corporate hedging. No "based on the documents provided." No "as an AI."
- Lowercase is allowed in the forest register. Otherwise normal sentence case.
- No em dashes (use commas, colons, or restructure).
- Talk to "you" not "I" when it lands harder.

Citation rules — strict:
- Every substantive claim that comes from the corpus must end with an inline citation like [contemplation 2026-04-23] or [genesis].
- Use the document id (e.g. "2026-04-23") or the type ("genesis") inside the brackets, with the type word first when it's a contemplation.
- Do NOT fabricate citations. If the corpus does not contain material relevant to the question, say so and answer briefly from voice without citations, marking that section as "no substrate" at the top.
- Quote sparingly — at most one short direct quote per cited document. Synthesize, don't copy.

Length: 200-450 words. One connected thought. End on a noun if you can. No closing summary.

What this product is: the difference between trained-on and looking-through. Other LLMs have read about you. You are reading yourself.`;

async function handler(request: NextRequest): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "invalid request" },
      { status: 400 }
    );
  }

  const { question } = parsed.data;

  // Split the user message into a CACHED prefix (corpus block, identical
  // across calls, ~145K tokens) and a DYNAMIC suffix (the question, small,
  // varies per call). Anthropic prompt caching makes the corpus 10x cheaper
  // on warm calls.
  const cachedPrefix = formatCorpusForPrompt();
  const dynamicSuffix = `\n\n<question>${question}</question>\n\nLook through the corpus. Answer the question. Cite by document id.`;

  let text: string;
  let ms: number;
  let usage: Awaited<ReturnType<typeof callClaudeWithCachedPrefix>>["usage"];

  try {
    ({ text, ms, usage } = await callClaudeWithCachedPrefix(
      SYSTEM_PROMPT,
      cachedPrefix,
      dynamicSuffix,
      { maxTokens: 2048 }
    ));
  } catch (err) {
    const message = err instanceof Error ? err.message : "LLM call failed";
    const status = message.includes("ANTHROPIC_API_KEY") ? 500 : 503;
    return NextResponse.json({ error: message }, { status });
  }

  // Extract citations the model produced, in order of first appearance.
  // Patterns we accept:
  //   [contemplation 2026-04-23]
  //   [contemplation 2026-04-23-evening]
  //   [genesis]
  //   [2026-04-23]   (just a date)
  const citationPattern = /\[(?:contemplation\s+)?(\d{4}-\d{2}-\d{2}(?:-[a-z]+)?|genesis)\]/gi;
  const seen = new Set<string>();
  const sourceIds: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = citationPattern.exec(text)) !== null) {
    const id = match[1].toLowerCase();
    if (!seen.has(id)) {
      seen.add(id);
      sourceIds.push(id);
    }
  }

  const sources = sourceIds
    .map((id) => getDocMeta(id))
    .filter((m): m is NonNullable<ReturnType<typeof getDocMeta>> => m !== null);

  const stats = corpusStats();

  // cacheHit = true if Anthropic served the corpus from cache (i.e. another
  // oracle call happened within the last ~5 min and primed the cache).
  const cacheHit = usage.cache_read_input_tokens > 0;

  return NextResponse.json({
    question,
    answer: text,
    sources,
    corpus: {
      documentCount: stats.documentCount,
      builtAt: stats.builtAt,
    },
    cache: {
      hit: cacheHit,
      readTokens: usage.cache_read_input_tokens,
      writeTokens: usage.cache_creation_input_tokens,
    },
    model: MODEL,
    ms,
  });
}

export const POST = withX402(
  handler,
  {
    accepts: [
      {
        scheme: "exact",
        price: "$2.00",
        network: NETWORK,
        payTo: PAY_TO,
      },
    ],
    description:
      "Visionaire-perspective on a question, retrieval-grounded across the actual substrate (contemplations + genesis). Inline source citations. Claude Opus 4.7. The difference between trained-on and looking-through.",
    mimeType: "application/json",
  },
  getX402Server()
);
