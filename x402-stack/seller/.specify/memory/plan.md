# Implementation Plan: Visionaire Labs x402 Seller MVP

**Created**: 2026-04-25
**Status**: Approved

---

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| Aesthetics Are Not Optional | ✅ | Voice prompts encode SOUL.md — the response content IS the product |
| TypeScript First | ✅ | strict mode, Zod validation at API boundaries |
| AI-Native by Default | ✅ | responses include model/ms metadata; x402 descriptions index-readable |
| Ship Fast, Ship Right | ✅ | minimal abstraction — 3 routes + 1 middleware |
| Stack Defaults | ✅ | Next.js 15, @x402/next, @anthropic-ai/sdk, Vercel |
| Vercel-Native Deployment | ✅ | vercel.json with Node.js runtime, .env.local.example |
| Solana — Not Applicable | ✅ | Base EVM only |
| Code Quality Gates | ✅ | build + lint + 402 smoke test required before done |

---

## Stack Decision Overrides

- **No database**: Stateless API — CDP facilitator handles all payment state
- **No test framework**: Manual smoke test sufficient for this MVP size (2 routes)
- **`@x402/next` over `x402-next@1.x`**: v2 protocol required — `@x402/*` packages only
- **Node.js runtime (not Edge)**: `@anthropic-ai/sdk` and EVM signing are not Edge-compatible

---

## Architecture

```
seller/
├── app/
│   ├── api/
│   │   ├── contemplate/
│   │   │   └── route.ts        # POST /contemplate — $0.05, Claude Opus 4.7
│   │   └── forest/
│   │       └── route.ts        # POST /forest — $0.01, Claude Opus 4.7
│   └── route.ts                # GET / — discovery JSON
├── middleware.ts                # x402 payment gate for /api/contemplate + /api/forest
├── lib/
│   └── anthropic.ts            # Shared Anthropic client + call wrapper
├── .env.local.example
├── .gitignore
├── vercel.json
├── package.json
├── tsconfig.json
├── next.config.ts
└── README.md
```

### Payment Flow

```
Client POST /api/contemplate
  → middleware.ts intercepts
  → no PAYMENT-SIGNATURE header → returns 402 + payment-required header
  → client signs $0.05 USDC on Base, retries with PAYMENT-SIGNATURE header
  → middleware verifies via CDP facilitator
  → route.ts executes: validate input → call Anthropic → return JSON
```

### Middleware Config

```typescript
paymentProxy({
  "/api/contemplate": {
    accepts: [{ scheme: "exact", price: "$0.05", network: "eip155:8453", payTo }],
    description: "Visionaire contemplation on a topic — Claude Opus 4.7, 150–300 words",
    mimeType: "application/json",
  },
  "/api/forest": {
    accepts: [{ scheme: "exact", price: "$0.01", network: "eip155:8453", payTo }],
    description: "Forest-style philosophical riff — Claude Opus 4.7, 40–80 words",
    mimeType: "application/json",
  },
}, server)
```

---

## Implementation Steps

### Step 1: Project scaffold
- `npx create-next-app@latest` with TypeScript, App Router, no Tailwind, no src dir
- Verify: `npm run build` passes on empty scaffold

### Step 2: Install dependencies
- `npm install @x402/next @x402/evm @x402/core @anthropic-ai/sdk zod`
- Verify: `npm run build` still passes

### Step 3: Middleware (x402 payment gate)
- Write `middleware.ts` using `paymentProxy` + `x402ResourceServer`
- Configure CDP facilitator with env vars
- Register `ExactEvmScheme` for `eip155:8453`

### Step 4: Anthropic shared lib
- Write `lib/anthropic.ts` — create client, export `callClaude(system, user)` helper

### Step 5: `/contemplate` route
- Zod validate input (topic 1–200 chars)
- Call Claude Opus 4.7 with SOUL.md-rooted system prompt
- Return typed JSON response

### Step 6: `/forest` route
- Zod validate input (phrase 1–80 chars)
- Call Claude Opus 4.7 with lowercase forest system prompt
- Return typed JSON response

### Step 7: `GET /` root discovery
- Static-ish JSON with lab description + endpoint metadata

### Step 8: Config files
- `vercel.json` — Node.js runtime
- `.env.local.example` — CDP_API_KEY_ID, CDP_API_KEY_SECRET, ANTHROPIC_API_KEY
- `.gitignore` — include `.env.local`
- `README.md` — curl examples, deploy steps, bazaar notes

### Step 9: Verification
- `npm run build` — zero errors
- `npm run lint` — zero errors
- Start dev server, probe both endpoints for 402
- Decode payment-required header, confirm all fields
- `git diff --stat` — no secrets

---

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `CDP_API_KEY_ID` | Coinbase CDP API key ID | `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` |
| `CDP_API_KEY_SECRET` | Coinbase CDP API key secret | `-----BEGIN EC PRIVATE KEY-----...` |
| `ANTHROPIC_API_KEY` | Anthropic API key | `sk-ant-...` |

---

## Key Constants (hardcoded, not secret)

```typescript
const PAY_TO = "0xc73bf21F2b3E1632a55a44d3Ce2dB04D9d0c139C"; // Visionaire Labs treasury
const USDC_BASE = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"; // Native Base USDC
const NETWORK = "eip155:8453"; // Base mainnet CAIP-2
const FACILITATOR_URL = "https://api.cdp.coinbase.com/platform/v2/x402";
const MODEL = "claude-opus-4-7";
```
