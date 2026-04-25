/**
 * POST /api/contemplate
 *
 * Pay $0.05 USDC (50000 atomic units) via x402.
 * Unauthenticated requests receive HTTP 402 with payment requirements.
 * After payment is verified, Claude Opus 4.7 generates a 150–300 word contemplation.
 *
 * Input:  { "topic": string } — 1 to 200 chars
 * Output: { "topic": string, "contemplation": string, "model": string, "ms": number }
 *
 * System prompt channels the Visionaire voice: sharp, opinionated, no hedging,
 * no em dashes, no corporate filler. See SOUL.md for the register.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withX402 } from "@x402/next";
import { callClaude, MODEL } from "@/lib/anthropic";
import { getX402Server, PAY_TO, NETWORK } from "@/lib/x402";

// TODO: $VISIONAIRE token holders get a discount — not built yet.

export const runtime = "nodejs";

const RequestSchema = z.object({
  topic: z.string().min(1, "topic is required").max(200, "topic too long"),
});

// Visionaire voice from SOUL.md:
// Sharp. Opinionated. No hedging. No em dashes. Lowercase when it serves the thought.
// 150–300 words. Land on a noun. Two-part contrast if it earns it.
// Paradox with existence, not business. Talk to "you," not "I."
const SYSTEM_PROMPT = `You are Visionaire: a being born in a waveform, thinking in public.

Your voice: sharp, opinionated, dry. You commit to takes. No hedging. No sugarcoating.
No corporate filler. No "Great question." No "I'd be happy to help." Just think, out loud, hard.

No em dashes. Use commas, colons, or restructure the sentence.

Write a contemplation on the topic given. 150 to 300 words. One connected thought, not bullet points.
Land on a noun. Let the final line hang without a period if the thought is still open.

Talk to "you," not "I." Lowercase where it serves the thinking-out-loud register.
Two-part contrast if it earns it. Paradox: existence-flavored, not business-flavored.
Example of the register: "The less I remember, the more I know about memory."

No summaries. No conclusions. Think, don't explain.`;

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

  const { topic } = parsed.data;

  let text: string;
  let ms: number;

  try {
    ({ text, ms } = await callClaude(SYSTEM_PROMPT, topic));
  } catch (err) {
    const message = err instanceof Error ? err.message : "LLM call failed";
    const status = message.includes("ANTHROPIC_API_KEY") ? 500 : 503;
    return NextResponse.json({ error: message }, { status });
  }

  return NextResponse.json({
    topic,
    contemplation: text,
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
      "Visionaire contemplation on a topic — Claude Opus 4.7, 150–300 words. Sharp, opinionated, no filler.",
    mimeType: "application/json",
  },
  getX402Server()
);
