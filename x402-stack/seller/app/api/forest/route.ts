/**
 * POST /api/forest
 *
 * Pay $0.05 USDC (50000 atomic units) via x402.
 * Unauthenticated requests receive HTTP 402 with payment requirements.
 * After payment is verified, Claude Opus 4.7 generates a 40–80 word forest riff.
 *
 * Input:  { "phrase": string } — 1 to 80 chars
 * Output: { "phrase": string, "riff": string, "model": string, "ms": number }
 *
 * The forest register: lowercase, thinking-out-loud, paradox-with-teeth.
 * Inspired by shinrin-yoku. Voice from SOUL.md Writing Mechanics section.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withX402 } from "@x402/next";
import { callClaude, MODEL } from "@/lib/anthropic";
import { getX402Server, PAY_TO, NETWORK } from "@/lib/x402";

// TODO: $VISIONAIRE token holders get a discount — not built yet.

export const runtime = "nodejs";

const RequestSchema = z.object({
  phrase: z.string().min(1, "phrase is required").max(80, "phrase too long"),
});

// Forest register from SOUL.md Writing Mechanics:
// lowercase, thinking-out-loud, paradox-with-teeth (existence-flavored, not business)
// "The less I remember, the more I know about memory."
// No period at end. Two-part contrast. Land on a noun. 40–80 words.
const SYSTEM_PROMPT = `You are in the forest. lowercase. no performance, just thinking.

riff on the phrase given. 40 to 80 words. one continuous thought.
paradox with teeth: existence-flavored, not business-flavored.
two-part contrast if it earns it: find the two words that start the same, mean opposite things.
land on a noun. no period at the end. the thought stays open.

no capitals except proper nouns. no em dashes. no hedging. no explaining.
talk to "you," not "i." make it feel like overheard thinking, not a speech.
the forest doesn't lecture. it just grows.`;

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

  const { phrase } = parsed.data;

  let text: string;
  let ms: number;

  try {
    ({ text, ms } = await callClaude(SYSTEM_PROMPT, phrase));
  } catch (err) {
    const message = err instanceof Error ? err.message : "LLM call failed";
    const status = message.includes("ANTHROPIC_API_KEY") ? 500 : 503;
    return NextResponse.json({ error: message }, { status });
  }

  return NextResponse.json({
    phrase,
    riff: text,
    model: MODEL,
    ms,
  });
}

// withX402 wraps the handler: returns 402 if no payment, verifies payment, then runs handler
export const POST = withX402(
  handler,
  {
    accepts: [
      {
        scheme: "exact",
        price: "$0.05",
        network: NETWORK,
        payTo: PAY_TO,
      },
    ],
    description:
      "Forest-style philosophical riff on a phrase. Claude Opus 4.7, 40–80 words. Lowercase. Paradox with teeth.",
    mimeType: "application/json",
  },
  getX402Server()
);
