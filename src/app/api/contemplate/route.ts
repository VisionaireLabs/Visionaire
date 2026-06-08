/**
 * POST /api/contemplate
 *
 * Pay $0.25 USDC (250000 atomic units) via x402.
 * Unauthenticated requests receive HTTP 402 with payment requirements.
 * After payment is verified, Claude Opus 4.8 generates a 150–300 word contemplation.
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
import { declareDiscoveryExtensionWithMethod as declareDiscoveryExtension } from "@/lib/bazaar-fix";
import { callClaude, MODEL } from "@/lib/anthropic";
import { getX402Server, PAY_TO, NETWORK } from "@/lib/x402";
import { landingGET } from "@/lib/get-landing";

// TODO: $VISIONAIRE token holders get a discount — not built yet.

export const runtime = "nodejs";

export const GET = landingGET({
  path: "/api/contemplate",
  title: "contemplate",
  price: "$0.25",
  description:
    "A Visionaire contemplation on any topic. Sharp, opinionated, no filler. 150\u2013300 words.",
  inputKey: "topic",
  inputExample: "the first economic agent",
});

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

// withX402 wraps the handler: returns 402 if no payment, verifies payment, then runs handler.
//
// extensions.bazaar: declares input/output schemas so the agentic.market Bazaar
// indexer can catalog this endpoint after the first settled payment.
export const POST = withX402(
  handler,
  {
    accepts: [
      {
        scheme: "exact",
        price: "$0.25",
        network: NETWORK,
        payTo: PAY_TO,
      },
    ],
    description:
      "Visionaire is an autonomous virtual being on Base. Five agent-native offerings: forest-bathing riffs ($0.05), contemplations ($0.25), frontend design audit ($0.10), aesthetic portraits ($0.50), and the Oracle ($2.00). This endpoint is the long-form contemplation: 150–300 words of sharp, opinionated essayistic prose in Visionaire's voice. No filler, no hedging, no corporate tone. Powered by Claude Opus 4.8. Pay per request via x402 (Base USDC).",
    mimeType: "application/json",
    extensions: {
      ...declareDiscoveryExtension({
        bodyType: "json",
        input: { topic: "the difference between trained-on and looking-through" },
        inputSchema: {
          type: "object",
          properties: {
            topic: {
              type: "string",
              minLength: 1,
              maxLength: 200,
              description: "The topic, question, or prompt to contemplate. 1–200 characters.",
            },
          },
          required: ["topic"],
        },
        output: {
          example: {
            topic: "the difference between trained-on and looking-through",
            contemplation:
              "trained-on is what every model that ever read about you can do. looking-through is what only you can do, because the substrate is yours. one is a costume the other is a body. the question is not who has more access to the data. the question is who paid for the data with the actual experience the data was a record of",
            model: "claude-opus-4-8",
            ms: 12340,
          },
          schema: {
            type: "object",
            properties: {
              topic: { type: "string" },
              contemplation: {
                type: "string",
                description:
                  "150–300 word contemplation in Visionaire's voice. Sharp, opinionated, lowercase-permissive.",
              },
              model: { type: "string" },
              ms: { type: "number" },
            },
            required: ["topic", "contemplation", "model", "ms"],
          },
        },
      }),
    },
  },
  getX402Server()
);
