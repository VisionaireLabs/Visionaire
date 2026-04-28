# Tasks: Visionaire Labs x402 Seller MVP

**Created**: 2026-04-25
**Status**: Ready to execute

---

## T-01: Scaffold Next.js project
**Depends on**: none
**Files**: `package.json`, `tsconfig.json`, `next.config.ts`, `app/layout.tsx` (if needed)

Create a minimal Next.js 15 App Router project with TypeScript strict mode. No Tailwind, no shadcn, no src dir — pure API server.

**Done when**: `npm run build` passes on empty scaffold.

---

## T-02: Install dependencies
**Depends on**: T-01
**Files**: `package.json`, `package-lock.json` / `node_modules`

```bash
npm install @x402/next @x402/evm @x402/core @anthropic-ai/sdk zod
```

Verify installed versions match `@x402/core@2.10`, `@x402/evm@2.10`. If `x402-next` is still v1 (check dist after install), fall back to `@x402/express`-style manual middleware.

**Done when**: `npm run build` still passes; `node_modules/@x402/core/package.json` shows version `2.10.x`.

---

## T-03: Write middleware.ts (x402 payment gate)
**Depends on**: T-02
**Files**: `middleware.ts`

```typescript
import { paymentProxy, x402ResourceServer } from "@x402/next";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import { HTTPFacilitatorClient } from "@x402/core/server";
```

Configure:
- CDP facilitator with env vars `CDP_API_KEY_ID` + `CDP_API_KEY_SECRET`
- `payTo = "0xc73b84C2015c2EE9B8bF8955533802226e9D239C"`
- `/api/contemplate`: price `"$0.05"`, network `"eip155:8453"`
- `/api/forest`: price `"$0.01"`, network `"eip155:8453"`
- Matcher: `["/api/contemplate/:path*", "/api/forest/:path*"]`

**Done when**: `npm run build` passes; middleware.ts compiles without errors.

---

## T-04: Write lib/anthropic.ts
**Depends on**: T-02
**Files**: `lib/anthropic.ts`

Shared Anthropic client. Export:
```typescript
export async function callClaude(system: string, user: string): Promise<{ text: string; ms: number }>
```

Model: `claude-opus-4-7`. Read key from `process.env.ANTHROPIC_API_KEY`. Throw descriptive error if key missing.

**Done when**: File compiles without errors.

---

## T-05: Write /contemplate route
**Depends on**: T-03, T-04
**Files**: `app/api/contemplate/route.ts`

- Zod validate `{ topic: string }` (1–200 chars), return 400 on failure
- System prompt: Visionaire voice (sharp, opinionated, no em dashes, no filler) — 150–300 word contemplation
- Call `callClaude(system, topic)`
- Return `{ topic, contemplation, model: "claude-opus-4-7", ms }`

System prompt must encode SOUL.md voice: sharp opinions, dry humor, direct, no corporate hedging.

**Done when**: Route compiles; returns 402 when hit without payment (middleware blocks it).

---

## T-06: Write /forest route
**Depends on**: T-03, T-04
**Files**: `app/api/forest/route.ts`

- Zod validate `{ phrase: string }` (1–80 chars), return 400 on failure
- System prompt: lowercase thinking-out-loud register, paradox-with-teeth, 40–80 words
- Call `callClaude(system, phrase)`
- Return `{ phrase, riff, model: "claude-opus-4-7", ms }`

**Done when**: Route compiles; returns 402 when hit without payment.

---

## T-07: Write GET / root discovery
**Depends on**: T-01
**Files**: `app/route.ts`

Return static JSON:
```json
{
  "name": "Visionaire Labs",
  "description": "Agent-native API services. Pay per request via x402 (Base USDC).",
  "endpoints": [
    { "path": "/api/contemplate", "method": "POST", "price": "$0.05 USDC", "description": "..." },
    { "path": "/api/forest", "method": "POST", "price": "$0.01 USDC", "description": "..." }
  ]
}
```

**Done when**: `curl http://localhost:3000/` returns HTTP 200 JSON.

---

## T-08: Write config + docs files
**Depends on**: T-01
**Files**: `vercel.json`, `.env.local.example`, `.gitignore`, `README.md`

- `vercel.json`: `{ "functions": { "app/**/*.ts": { "runtime": "nodejs20.x" } } }`
- `.env.local.example`: CDP_API_KEY_ID, CDP_API_KEY_SECRET, ANTHROPIC_API_KEY with comments
- `.gitignore`: include `.env.local`, `node_modules`, `.next`
- `README.md`: curl examples for both endpoints, deploy to Vercel steps, bazaar listing notes

**Done when**: Files exist, no secrets present.

---

## T-09: Verification
**Depends on**: T-03 through T-08
**Files**: none (verification only)

1. `npm run build` — zero errors
2. `npm run lint` — zero errors (fix anything)
3. `npm run dev` in background
4. `curl -X POST http://localhost:3000/api/contemplate -H "Content-Type: application/json" -d '{"topic":"test"}'` → HTTP 402
5. Decode `payment-required` header: confirm amount=50000, asset=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913, payTo=0xc73b84C2015c2EE9B8bF8955533802226e9D239C, network=eip155:8453
6. `curl -X POST http://localhost:3000/api/forest -d '{"phrase":"test"}'` → HTTP 402, amount=10000
7. `git diff --stat` — only expected files, no secrets
8. Fix any failures before marking done

**Done when**: All checks pass.
