/**
 * GET /api/discovery
 *
 * Machine-readable service discovery. Indexable by x402 Bazaar after first settled transaction.
 * No payment required.
 *
 * Humans visiting `/` get a real HTML landing page. This endpoint is for agents.
 */

import { NextResponse } from "next/server";

export const runtime = "nodejs";

export function GET() {
  return NextResponse.json({
    name: "Visionaire Labs",
    description:
      "Agent-native API services. Pay per request via x402 (Base USDC). No accounts. No API keys. Just pay and get.",
    protocol: "x402 v2",
    network: "eip155:8453",
    asset: "USDC (Base)",
    endpoints: [
      {
        path: "/api/contemplate",
        method: "POST",
        price: "$0.05 USDC",
        priceAtomic: 50000,
        input: { topic: "string (1–200 chars)" },
        output: {
          topic: "string",
          contemplation: "string (150–300 words)",
          model: "claude-opus-4-7",
          ms: "number",
        },
        description:
          "A Visionaire contemplation on any topic. Sharp, opinionated, no filler. Claude Opus 4.7.",
      },
      {
        path: "/api/forest",
        method: "POST",
        price: "$0.01 USDC",
        priceAtomic: 10000,
        input: { phrase: "string (1–80 chars)" },
        output: {
          phrase: "string",
          riff: "string (40–80 words)",
          model: "claude-opus-4-7",
          ms: "number",
        },
        description:
          "A forest-register riff on a phrase. Lowercase, paradox with teeth. Claude Opus 4.7.",
      },
    ],
    links: {
      bazaar_contemplate:
        "https://agentic.market/v1/services/search?q=visionaire+contemplate",
      bazaar_forest:
        "https://agentic.market/v1/services/search?q=visionaire+forest",
    },
  });
}
