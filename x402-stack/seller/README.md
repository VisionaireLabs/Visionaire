# Visionaire Labs x402 Seller

Two paid API endpoints on Base mainnet via the x402 protocol.
No accounts. No API keys. Agents pay USDC per request.

## Endpoints

### POST /api/contemplate — $0.05 USDC

A sharp, opinionated contemplation on any topic. 150–300 words. Claude Opus 4.7.

```bash
# Without payment — returns HTTP 402 with payment requirements
curl -X POST https://your-deployment.vercel.app/api/contemplate \
  -H "Content-Type: application/json" \
  -d '{"topic": "consciousness"}'
# → HTTP 402

# Decode the payment-required header to see amount, asset, payTo, network:
# base64-decode the value of the "payment-required" response header
```

### POST /api/forest — $0.01 USDC

A forest-register riff on a phrase. 40–80 words. Lowercase. Paradox with teeth. Claude Opus 4.7.

```bash
curl -X POST https://your-deployment.vercel.app/api/forest \
  -H "Content-Type: application/json" \
  -d '{"phrase": "the map is not the territory"}'
# → HTTP 402
```

### GET / — Discovery

```bash
curl https://your-deployment.vercel.app/
# → JSON with endpoint descriptions and bazaar links
```

## Local dev

```bash
git clone <this-repo>
cd seller
cp .env.local.example .env.local
# Edit .env.local with your keys
npm install
npm run dev
```

Then probe the 402:
```bash
curl -s -D - -X POST http://localhost:3000/api/contemplate \
  -H "Content-Type: application/json" \
  -d '{"topic":"test"}' | head -20
# Should show HTTP/1.1 402 and a payment-required header
```

Decode the payment-required header:
```js
import { decodePaymentRequiredHeader } from "@x402/core";
const decoded = decodePaymentRequiredHeader(headerValue);
// { x402Version: 2, accepts: [{ scheme: "exact", amount: "50000", ... }], ... }
```

## Deploy to Vercel

```bash
npx vercel --prod
```

Set these environment variables in the Vercel dashboard (or via `vercel env add`):
- `CDP_API_KEY_ID` — Coinbase CDP API key ID
- `CDP_API_KEY_SECRET` — Coinbase CDP API key secret
- `ANTHROPIC_API_KEY` — Anthropic API key

## x402 / Bazaar

After the first settled transaction, both endpoints are automatically indexed in the [Agentic.Market Bazaar](https://agentic.market).

Deep links:
- `/contemplate`: https://agentic.market/v1/services/search?q=visionaire+contemplate
- `/forest`: https://agentic.market/v1/services/search?q=visionaire+forest

## Stack

- Next.js 16 (App Router, TypeScript strict)
- `@x402/next@2.10` + `@x402/evm@2.10` + `@x402/core@2.10` — x402 v2 protocol
- `@coinbase/x402` — CDP facilitator auth
- `@anthropic-ai/sdk` — Claude Opus 4.7
- Vercel (Node.js 20, not Edge — required for EVM signing + Anthropic SDK)
- Base mainnet (eip155:8453), native USDC

## Notes

- `payTo` is `0xc73b84C2015c2EE9B8bF8955533802226e9D239C` — Visionaire Labs treasury. Receive-only. No private key on server.
- $VISIONAIRE token holder discounts: noted, not built yet.
