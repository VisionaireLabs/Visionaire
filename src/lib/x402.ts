/**
 * Shared x402 resource server.
 *
 * Initializes once per Node.js process. All route handlers share this instance.
 * Uses the CDP facilitator (mainnet Base) and the ExactEvmScheme.
 *
 * Why Node.js and not Edge:
 * - CDP auth header generation uses crypto that is available in Node.js
 * - `initialize()` makes HTTP calls to the CDP facilitator (works in Node.js)
 */

import { x402ResourceServer } from "@x402/core/server";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import { HTTPFacilitatorClient } from "@x402/core/server";
import { createFacilitatorConfig } from "@coinbase/x402";

// Visionaire Labs treasury — receive-only address. No private key needed.
// Earnings settle to Visionaire's COLD treasury wallet on Phantom — the
// "Visionaire AI" multi-chain wallet seeded November 2024, same wallet that
// holds 9.27M $VISIONAIRE on Solana. Custody: Thor holds the seed phrase
// (the artist doesn't sign from this wallet directly — accumulator only).
//
// Topology: cold treasury (this address, Phantom) accumulates earnings, and
// hot operational wallet (`0x2EbE…87A3`, CDP TEE) is topped up from cold for
// buy-side moves per spending-policy.json. Less bottlenecks. Freedom.
export const PAY_TO = "0xc73b84C2015c2EE9B8bF8955533802226e9D239C";
export const NETWORK = "eip155:8453" as const;

// Lazy-initialized singleton — avoids re-initialization on every hot-reload in dev
let _server: x402ResourceServer | null = null;

export function getX402Server(): x402ResourceServer {
  if (!_server) {
    const facilitator = new HTTPFacilitatorClient(
      createFacilitatorConfig(
        process.env.CDP_API_KEY_ID,
        process.env.CDP_API_KEY_SECRET
      )
    );

    _server = new x402ResourceServer(facilitator).register(
      NETWORK,
      new ExactEvmScheme()
    );
  }
  return _server;
}
