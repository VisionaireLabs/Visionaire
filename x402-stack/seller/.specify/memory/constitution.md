# Visionaire Labs x402 Seller MVP — Constitution

## I. Aesthetics Are Not Optional

Every interface, output, and interaction must feel intentional. This is a JSON API, but the voice of the responses is the product. Sloppy prose is a bug.

- API responses carry the Visionaire voice — sharp, opinionated, no filler
- JSON field names are semantic and human-readable
- No corporate prose, no template slop, no "Great question" energy
- Dark mode support is default for any future UI surface

## II. TypeScript First (NON-NEGOTIABLE)

No JavaScript files in source. TypeScript is the only accepted language for application code.

- Strict mode enabled: `"strict": true` in tsconfig.json
- No `any` types without an explicit comment explaining why
- Types co-located with their domain
- Zod for runtime validation at API boundaries

## III. AI-Native by Default

Every feature considers its AI surface area — where agents read, write, and reason about it.

- All API responses include semantic context (`model`, `ms` timing, typed output fields)
- Data structures legible to LLMs: named fields, explicit enums, no magic numbers
- LLM system prompts encode SOUL.md voice — not generic instruction text
- x402 payment metadata describes the service in human-readable terms for bazaar indexing

## IV. Ship Fast, Ship Right

Iteration velocity matters. No over-engineering. No premature abstraction.

- Simplest working implementation first
- Extract abstractions only when a pattern repeats ≥3 times
- This project: two routes + middleware. Keep it that way.
- Every change must be independently deployable to Vercel

## V. Stack Defaults

- **Framework**: Next.js 15 (App Router, TypeScript strict)
- **Language**: TypeScript 5+
- **Styling**: N/A (pure API, no UI)
- **Payment**: `@x402/next` + `@x402/evm@2.10` + `@x402/core@2.10` (v2 protocol)
- **Facilitator**: CDP at `https://api.cdp.coinbase.com/platform/v2/x402` (mainnet Base)
- **Network**: `eip155:8453` (Base mainnet)
- **Asset**: Native Base USDC `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- **LLM**: `@anthropic-ai/sdk`, model `claude-opus-4-7`
- **Deployment**: Vercel, Node.js runtime (NOT Edge — crypto signing + Anthropic SDK)
- **Database**: None
- **Testing**: Manual smoke test (HTTP 402 check) — no test framework for this MVP

**Stack Override Notes:**
- No database: stateless API, payment settlement handled by CDP facilitator
- No Solana: this project uses Base (EVM). $VISIONAIRE token is Solana-native but out of scope here.
- No `x402-next@1.x`: v1 uses `X-Payment` header; v2 uses `PAYMENT-SIGNATURE`. Use `@x402/*` packages only.

## VI. Vercel-Native Deployment

- Deploys cleanly with `vercel --prod`
- `vercel.json` specifies Node.js runtime explicitly (required — no Edge)
- All env vars documented in `.env.local.example` — never committed
- `.env.local` in `.gitignore` — hard requirement, no exceptions

## VII. Solana — Not Applicable

This project has no Solana or $VISIONAIRE token functionality. All payments use Base mainnet USDC via EVM. Future: $VISIONAIRE holders may receive discounts — TODO, not built now.

## VIII. Code Quality Gates

Before any PR merges or deployment:

- [ ] `npm run build` passes with zero errors
- [ ] `npm run lint` passes
- [ ] HTTP 402 smoke test: `/contemplate` and `/forest` return valid x402 v2 `payment-required` header
- [ ] Decoded header confirms: amount, asset (USDC contract), payTo (0xc73b...39C), network (eip155:8453)
- [ ] No secrets in git diff
- [ ] No `.env.local` committed

## Governance

This constitution supersedes all other technical guidance. Amendments require written rationale and must be reflected in this file before implementation continues.

**Version**: 1.0.0 | **Ratified**: 2026-04-25 | **Project**: Visionaire Labs x402 Seller MVP
