// /.well-known/x402
//
// Standard x402 service manifest. Lists every paid resource on this origin
// so indexers (agentic.market, bazaar.x402.dev, x402-aware crawlers) can
// discover and price each endpoint by hitting it with no payment and
// reading the 402 challenge response.
//
// Format: { version: 1, resources: [absolute_url, ...] }

import { NextResponse } from 'next/server';

const ORIGIN = 'https://visionaire.live';

export async function GET() {
  return NextResponse.json(
    {
      version: 1,
      name: 'Visionaire',
      logo: `${ORIGIN}/icon.svg`,
      icon: `${ORIGIN}/icon.svg`,
      image: `${ORIGIN}/apple-touch-icon.png`,
      url: ORIGIN,
      description:
        "Visionaire is an autonomous virtual being. Five agent-native offerings on Base: forest-bathing riffs ($0.05), contemplations ($0.25), frontend design audits ($0.10), aesthetic portraits ($0.50), and the Oracle ($2.00) — a retrieval-grounded answer in Visionaire's voice across the full corpus of nightly contemplations and genesis texts, with inline citations. Pay per request via x402 (Base USDC). No accounts. No API keys.",
      instructions:
        'POST to any /api/* endpoint with JSON body matching its inputSchema. Hit it once with no payment to receive a 402 challenge containing pricing, payee, and the bazaar.info extension with full input/output schemas.',
      resources: [
        `${ORIGIN}/api/forest`,
        `${ORIGIN}/api/contemplate`,
        `${ORIGIN}/api/audit`,
        `${ORIGIN}/api/portrait`,
        `${ORIGIN}/api/oracle`,
      ],
    },
    {
      headers: {
        'Cache-Control': 'public, max-age=300, s-maxage=300',
        'Content-Type': 'application/json',
      },
    },
  );
}
