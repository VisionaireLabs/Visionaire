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
export const PAY_TO = "0xc73bf21F2b3E1632a55a44d3Ce2dB04D9d0c139C";
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
