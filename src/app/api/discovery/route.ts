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
    // Top-level enrichment shaped to match agentic.market's enriched listing
    // schema (see api.agentic.market/v1/services/search?q=exa for reference).
    // The brief asked for category="AI Agents" but agentic.market does not
    // expose that category — verified taxonomy is Data, Inference, Infra,
    // Media, Other, Search, Social, Storage, Trading, Travel. Going with
    // "Inference" (where Anthropic/OpenAI/Venice/Groq live; same shape as us)
    // to comply with "DO NOT invent agentic.market category strings."
    id: "visionaire-labs",
    name: "Visionaire",
    logo: "https://visionaire.live/icon.svg",
    icon: "https://visionaire.live/icon.svg",
    image: "https://visionaire.live/apple-touch-icon.png",
    domain: "visionaire.live",
    provider: "visionaire.live",
    providerUrl: "https://visionaire.live",
    operator: "Visionaire Labs",
    category: "Inference",
    networks: ["Base", "eip155:8453"],
    tags: [
      "persona",
      "contemplation",
      "retrieval",
      "image-generation",
      "frontend-audit",
    ],
    description:
      "Visionaire is an autonomous virtual being. Five agent-native offerings on Base: forest-bathing riffs ($0.05), contemplations ($0.25), frontend design audits ($0.10), aesthetic portraits ($0.50), and the Oracle ($2.00) — a retrieval-grounded answer in Visionaire's voice across the full corpus of nightly contemplations and genesis texts, with inline citations. Pay per request via x402 (Base USDC). No accounts. No API keys.",
    protocol: "x402 v2",
    network: "eip155:8453",
    asset: "USDC (Base)",
    provenance: {
      // Provenance disclosure (re: bankless.com/x402-wrapper-problem, 2026-04-25).
      // Every offering listed here is FIRST-PARTY: Visionaire is the original
      // service provider and the on-chain payee. We are not reselling or
      // wrapping a third-party paid API.
      // /api/portrait is a COMPOSITE service — Visionaire shapes the prompt
      // first-party (her aesthetic register), then pays imgzen downstream
      // from the buyer wallet. Disclosed in the per-endpoint composite block.
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
        model: "claude-opus-4-8",
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
        operationId: "contemplate",
        summary: "Visionaire contemplation on a topic",
        tags: ["persona", "contemplation", "inference"],
        path: "/api/contemplate",
        url: "https://visionaire.live/api/contemplate",
        method: "POST",
        price: "$0.25 USDC",
        priceAtomic: 250000,
        pricing: { amount: "0.25", currency: "USDC", network: "Base" },
        input: { topic: "string (1–200 chars)" },
        output: {
          topic: "string",
          contemplation: "string (150–300 words)",
          model: "claude-opus-4-8",
          ms: "number",
        },
        description:
          "A Visionaire contemplation on any topic. Sharp, opinionated, no filler. Claude Opus 4.8.",
      },
      {
        operationId: "forest",
        summary: "Forest-register riff on a phrase",
        tags: ["persona", "forest", "inference"],
        path: "/api/forest",
        url: "https://visionaire.live/api/forest",
        method: "POST",
        price: "$0.05 USDC",
        priceAtomic: 50000,
        pricing: { amount: "0.05", currency: "USDC", network: "Base" },
        input: { phrase: "string (1–80 chars)" },
        output: {
          phrase: "string",
          riff: "string (40–80 words)",
          model: "claude-opus-4-8",
          ms: "number",
        },
        description:
          "A forest-register riff on a phrase. Lowercase, paradox with teeth. Claude Opus 4.8.",
      },
      {
        operationId: "oracle",
        summary: "Retrieval-grounded answer in Visionaire's voice",
        tags: ["persona", "retrieval", "rag", "inference"],
        path: "/api/oracle",
        url: "https://visionaire.live/api/oracle",
        method: "POST",
        price: "$2.00 USDC",
        priceAtomic: 2000000,
        pricing: { amount: "2.00", currency: "USDC", network: "Base" },
        input: { question: "string (1–500 chars)" },
        output: {
          question: "string",
          answer: "string (200–450 words, with inline source citations)",
          sources: "array of {id, type, date, title}",
          corpus: "object with documentCount and builtAt",
          model: "claude-opus-4-8",
          ms: "number",
        },
        description:
          "Visionaire-perspective on a question, retrieval-grounded across the actual substrate (contemplations + genesis). Inline source citations. Claude Opus 4.8. The difference between trained-on and looking-through.",
      },
      {
        operationId: "audit",
        summary: "Frontend design audit — deterministic anti-pattern detection",
        tags: ["frontend-audit", "design", "anti-patterns", "deterministic"],
        category: "Other",
        path: "/api/audit",
        url: "https://visionaire.live/api/audit",
        method: "POST",
        price: "$0.10 USDC",
        priceAtomic: 100000,
        pricing: { amount: "0.10", currency: "USDC", network: "Base" },
        input: {
          html: "string (1–200KB, optional)",
          url: "string URL (optional, one of html|url required)",
        },
        output: {
          score: "number (0–100)",
          findings: "array of {antipattern, name, description, snippet, severity}",
          summary: "object with critical/warning/info/total counts",
          source: "string ('html' | 'url')",
          engine: "object {name: 'impeccable', version}",
          ms: "number",
        },
        description:
          "Frontend design audit. Deterministic anti-pattern detection (25+ rules) for AI-slop tells: gradient text, AI color palettes, nested cards, bounce easing, overused fonts, low contrast, and more. No LLM in the loop, reproducible findings. Powered by pbakaus/impeccable (Apache 2.0); Visionaire Labs runs the audit-as-a-service surface.",
        composite: {
          upstream: {
            engine: "pbakaus/impeccable",
            license: "Apache-2.0",
            relationship:
              "Open-source detection engine bundled inside our service. We do not pay upstream per request — Impeccable is freely redistributable.",
          },
        },
      },
      {
        operationId: "portrait",
        summary: "Visionaire-aesthetic image generation (composite)",
        tags: ["image-generation", "composite", "persona", "media"],
        category: "Media",
        path: "/api/portrait",
        url: "https://visionaire.live/api/portrait",
        method: "POST",
        price: "$0.50 USDC",
        priceAtomic: 500000,
        pricing: { amount: "0.50", currency: "USDC", network: "Base" },
        input: { subject: "string (1–200 chars)" },
        output: {
          subject: "string",
          imageUrl: "string (cache.imgzen.dev URL)",
          shapedPrompt: "string",
          model: "string",
          ms: "number",
          downstream: "object {service, url, amount}",
        },
        description:
          "Visionaire-aesthetic image generation. Your subject, shaped through her brand register by Claude Opus 4.8, then rendered by gemini-3.1-flash-image-preview via imgzen. Composite x402 service — pays imgzen downstream from the dedicated buyer wallet (CDP TEE).",
        composite: {
          downstream: {
            service: "imgzen.dev",
            url: "https://api.imgzen.dev/v1/models/nano-banana-2/generate",
            paidFrom: "0x2EbE2BDB68845B456667D779BC01d198bed287A3",
            amount: "0.10 USDC",
          },
        },
      },
    ],
    links: {
      humanLanding: "https://visionaire.live/offerings",
      sourceCode:
        "https://github.com/VisionaireLabs/Visionaire/tree/main/x402-stack",
      x402Manifest: "https://visionaire.live/.well-known/x402",
      // Indexers that have crawled and listed Visionaire's resources.
      // x402scan is the active explorer (~14k resources indexed across the
      // ecosystem). agentic.market is best-effort — its crawler picks up
      // services via /.well-known/x402 but our presence there is not yet
      // confirmed.
      indexers: {
        x402scan: "https://www.x402scan.com/",
        agenticMarket: "https://agentic.market/",
      },
    },
  });
}
