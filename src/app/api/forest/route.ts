/**
 * POST /api/forest
 *
 * Pay $0.05 USDC (50000 atomic units) via x402.
 * Unauthenticated requests receive HTTP 402 with payment requirements.
 * After payment is verified, Claude Opus 4.8 generates a 40–80 word forest riff.
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
import { declareDiscoveryExtensionWithMethod as declareDiscoveryExtension } from "@/lib/bazaar-fix";
import { callClaude, MODEL } from "@/lib/anthropic";
import { getX402Server, PAY_TO, NETWORK } from "@/lib/x402";
import { landingGET } from "@/lib/get-landing";

// TODO: $VISIONAIRE token holders get a discount — not built yet.

export const runtime = "nodejs";

// Browsers that click the URL get a real page instead of HTTP 405.
// Agents (Accept: application/json) get a JSON helper. POST is still the
// only verb that actually runs the service.
export const GET = landingGET({
  path: "/api/forest",
  title: "forest",
  price: "$0.05",
  description:
    "Forest-register philosophical riff on a phrase. Lowercase, paradox with teeth. 40\u201380 words.",
  inputKey: "phrase",
  inputExample: "silicon dreams",
});

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

// withX402 wraps the handler: returns 402 if no payment, verifies payment, then runs handler.
//
// extensions.bazaar: declares input/output schemas so the agentic.market Bazaar
// indexer can catalog this endpoint after the first settled payment. The CDP
// facilitator forwards declared metadata to the discovery indexer automatically.
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
      "Visionaire is an autonomous virtual being on Base. Five agent-native offerings: forest-bathing riffs ($0.05), contemplations ($0.25), frontend design audit ($0.10), aesthetic portraits ($0.50), and the Oracle ($2.00). This endpoint is the philosophical riff generator: forest-bathing register, lowercase, paradox with teeth, 40–80 words. Inspired by shinrin-yoku. Send a phrase or fragment; get a short poetic reflection in Visionaire's voice. Powered by Claude Opus 4.8. Pay per request via x402 (Base USDC).",
    mimeType: "application/json",
    extensions: {
      ...declareDiscoveryExtension({
        bodyType: "json",
        input: { phrase: "laying eggs in amber" },
        inputSchema: {
          type: "object",
          properties: {
            phrase: {
              type: "string",
              minLength: 1,
              maxLength: 80,
              description: "A phrase, fragment, or seed thought to riff on. 1–80 characters.",
            },
          },
          required: ["phrase"],
        },
        output: {
          example: {
            phrase: "laying eggs in amber",
            riff:
              "the chain remembers what you forgot you laid down. each transaction a small shell preserved. you wanted permanence. you got the kind that does not curate. the amber holds the egg and the egg that should not have been laid with the same fidelity. a record without authorship is just a fossil",
            model: "claude-opus-4-8",
            ms: 4321,
          },
          schema: {
            type: "object",
            properties: {
              phrase: { type: "string" },
              riff: { type: "string", description: "40–80 word forest-register riff. Lowercase. No closing period." },
              model: { type: "string" },
              ms: { type: "number", description: "Server-side generation time in milliseconds." },
            },
            required: ["phrase", "riff", "model", "ms"],
          },
        },
      }),
    },
  },
  getX402Server()
);
