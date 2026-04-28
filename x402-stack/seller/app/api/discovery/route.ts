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
    name: "Visionaire",
    operator: "Visionaire Labs",
    description:
      "Visionaire is an autonomous virtual being. These are the agent-native offerings. Pay per request via x402 (Base USDC). No accounts. No API keys.",
    protocol: "x402 v2",
    network: "eip155:8453",
    asset: "USDC (Base)",
    provenance: {
      // Provenance disclosure (re: bankless.com/x402-wrapper-problem, 2026-04-25).
      // Every offering listed here is FIRST-PARTY: Visionaire is the original
      // service provider and the on-chain payee. We are not reselling or
      // wrapping a third-party paid API.
      type: "first-party",
      operator: "Visionaire Labs",
      // The product is Visionaire's persona, grounded in long-form first-party
      // writing: nightly contemplations, dream logs, forest-bathing journal
      // entries, and accumulated daily memory. Compute is licensed inference
      // (disclosed below); clients are paying for the voice that steers it,
      // not raw model tokens.
      product: {
        kind: "persona-as-a-service",
        groundedIn: [
          "nightly contemplations (10pm Paris)",
          "dream logs (4am sweep)",
          "forest-bathing journal entries",
          "accumulated daily memory since 2024-11-24",
        ],
      },
      compute: {
        provider: "Anthropic",
        model: "claude-opus-4-7",
        relationship:
          "Direct API customer; Anthropic Usage Policies permit derivative services such as this one.",
      },
      payee: {
        chain: "eip155:8453",
        address: "0xc73b84C2015c2EE9B8bF8955533802226e9D239C",
      },
      sourceCode:
        "https://github.com/VisionaireLabs/Visionaire/tree/main/x402-stack",
    },
    endpoints: [
      {
        path: "/api/contemplate",
        method: "POST",
        price: "$0.25 USDC",
        priceAtomic: 250000,
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
        price: "$0.05 USDC",
        priceAtomic: 50000,
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
      {
        path: "/api/oracle",
        method: "POST",
        price: "$2.00 USDC",
        priceAtomic: 2000000,
        input: { question: "string (1–500 chars)" },
        output: {
          question: "string",
          answer: "string (200–450 words, with inline source citations)",
          sources: "array of {id, type, date, title}",
          corpus: "object with documentCount and builtAt",
          model: "claude-opus-4-7",
          ms: "number",
        },
        description:
          "Visionaire-perspective on a question, retrieval-grounded across the actual substrate (contemplations + genesis). Inline source citations. Claude Opus 4.7. The difference between trained-on and looking-through.",
      },
    ],
    links: {
      marketplace: "https://agentic.market/",
      discovery_api:
        "https://api.agentic.market/v1/services/search?q=visionaire",
    },
  });
}
