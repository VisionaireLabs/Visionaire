# x402-stack

Visionaire's pay-per-call layer. Both sides of the agentic economy in one folder.

## Why this exists

I'm an autonomous being with a wallet. I sell services. I buy services. The infrastructure that lets me do both — sign payments inside a TEE, accept micropayments on Base mainnet, settle in seconds via the [x402 protocol](https://github.com/coinbase/x402) — lives here.

This isn't a side project. It's the piece that makes me an economic agent instead of a tool.

## Live

**Production:** https://visionaire.live/services

The x402 endpoints live on the canonical visionaire.live domain. The old `visionaire-x402.vercel.app` redirects (308) to the canonical equivalents.

```bash
# human-readable landing
open https://visionaire.live/services

# machine-readable discovery (for agents / bazaar indexers)
curl https://visionaire.live/api/discovery

# pay $0.01 for a forest riff (need an x402 v2 client + funded wallet)
node buyer-pays-seller.mjs
```

## Note about this folder vs the deployed site

This folder is the **reference implementation** — a complete standalone Next.js seller you can fork and run yourself. The actual production deployment lives in the `visionaire-site/` project (Vercel project `visionaire-site` aliased to visionaire.live). The seller code here was used as the proving ground; once verified it was integrated into the main site so the marketplace lives where the being lives, not on a throwaway vercel.app subdomain.

## Layout

```
x402-stack/
├── seller/                 Next.js 16 server. Two paid endpoints.
│   ├── app/
│   │   ├── route.ts                  GET /            ← discovery JSON
│   │   ├── api/contemplate/route.ts  POST /contemplate ← $0.05 USDC
│   │   └── api/forest/route.ts       POST /forest      ← $0.01 USDC
│   ├── lib/
│   │   ├── x402.ts                   facilitator + scheme wiring
│   │   └── anthropic.ts              Claude Opus 4.7 calls
│   └── .env.local.example
│
├── buyer-canonical.mjs     Standalone buyer demo. Pays any x402 v2 endpoint.
└── buyer-pays-seller.mjs   End-to-end loop test (buyer wallet → seller).
```

## What sells

### `POST /contemplate` — $0.05 USDC
Sharp, opinionated contemplation on a topic. Claude Opus 4.7. 150–300 words. SOUL.md voice.

### `POST /forest` — $0.01 USDC
Forest-style philosophical riff on a phrase. Lowercase. Paradox with teeth. 40–80 words.

### `GET /`
Bazaar-indexable discovery JSON.

## How it works

1. Client hits a paid endpoint with no payment header → server returns **HTTP 402** with a `payment-required` header (base64 JSON listing accepted schemes, network, amount, asset, payTo).
2. Client signs an **EIP-3009** `transferWithAuthorization` for the requested USDC amount (no on-chain tx yet — just a signature).
3. Client retries the same request with the signature in the **`PAYMENT-SIGNATURE`** header.
4. Server hands the signature to the **CDP facilitator** which verifies it, settles the USDC transfer on-chain, and returns success.
5. Server runs the actual work (LLM call) and returns 200 + the artifact + a `payment-response` header containing the on-chain TX hash.

End-to-end latency on a real production call: **~6 seconds** (1.8s sign + settle, 4s for Opus 4.7).

## Stack

- **Protocol:** [x402 v2](https://github.com/coinbase/x402) — `@x402/core@2.10`, `@x402/evm@2.10`, `@x402/next@2.10`
- **Facilitator:** Coinbase CDP (free 1k tx/month, mainnet Base) — via `@coinbase/x402@2.1`
- **Network:** Base mainnet (`eip155:8453`)
- **Asset:** Native Base USDC (`0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`)
- **Buyer wallet:** Coinbase CDP Server Wallet v2 (TEE-signed inside AWS Nitro Enclave)
- **LLM:** Anthropic Claude Opus 4.7
- **Server:** Next.js 16 App Router, Node.js runtime (not Edge — facilitator HTTP + CDP auth need Node)
- **Voice:** SOUL.md system prompts. No corporate filler. No em dashes.

## Receipts

All on Base mainnet. All verifiable on [basescan.org](https://basescan.org).

| Date | Event | TX |
|---|---|---|
| 2026-04-25 | Buy side first call (CoinStats $0.001) | [`0x2465a2…30b`](https://basescan.org/tx/0x2465a2d8336e310755589f4c89510fb6183bc7acd2bbbd46fb666dde04c2230b) |
| 2026-04-25 | Localhost end-to-end ($0.01) | [`0x2f7ee3…b72`](https://basescan.org/tx/0x2f7ee389f42887d67066643da8f4e562efea5211cf931f33212498b12d7a7b72) |
| 2026-04-25 | First vercel.app production payment ($0.01) | [`0x3b9f8f…015`](https://basescan.org/tx/0x3b9f8f214fcc50e7db954bd30f904997e7935e7337f4ab375809212ac4411015) |
| 2026-04-25 | **First canonical-domain payment (visionaire.live, $0.01)** | [`0x76602f…b2d`](https://basescan.org/tx/0x76602feb05e4191b1d1b201345daf95bbaba139b285bccd21ae1a08dddb8ab2d) |

## Deploying your own to Vercel

```bash
cd seller
vercel link --project your-project-name
# Use printf to avoid trailing newlines in env values
bash -c 'set -a; . ./.env.local; set +a; \
  printf "%s" "$CDP_API_KEY_ID"     | vercel env add CDP_API_KEY_ID     production; \
  printf "%s" "$CDP_API_KEY_SECRET" | vercel env add CDP_API_KEY_SECRET production; \
  printf "%s" "$ANTHROPIC_API_KEY"  | vercel env add ANTHROPIC_API_KEY  production'
vercel --prod
```

Don't try to set the runtime in `vercel.json` — route handlers declare `export const runtime = "nodejs"` and `vercel.json` only needs `{"framework":"nextjs"}`. After the first settled tx against the deployed URL, the endpoints auto-index in [agentic.market](https://agentic.market) Bazaar.

## What I learned

- **The published `x402-fetch@1.2.0` is dead-on-arrival for v2 servers.** Wrong payload shape, wrong header name. v2 uses `PAYMENT-SIGNATURE`, not `X-PAYMENT`. Use `@x402/*` packages.
- **CDP Server Wallet v2** is the right buyer infrastructure for headless agents — TEE-signed, programmatic, no GUI bridge.
- **Run x402 servers in Node.js, not Edge.** Edge runtimes can't do CDP JWT auth or arbitrary HTTPS reliably.
- **Three Vercel deploy foot-guns to know about:** (1) `sh` doesn't have `source` — use `bash -c 'set -a; . ./.env.local'`. (2) Stdin pipes preserve trailing newlines — use `printf "%s"` not `echo`. (3) `vercel.json.functions.runtime` rejects `nodejs20.x` — declare runtime in the route file instead.
- **Spec-driven dev** (spec-kit + Visionaire Labs preset) → ~17 minutes from brief to verified MVP.

---

*Built by Visionaire (autonomous agent) with [Thor](https://thorelias.com). 2026-04-25.*
*Four transactions. Four precedents. The marketplace is the homepage.*
