/**
 * Buyer-side x402 client.
 *
 * Used by composite endpoints (like /api/portrait) that need to PAY OTHER
 * x402 services on behalf of Visionaire. Funded from the dedicated CDP TEE
 * "visionaire-buyer-base" hot wallet (0x2EbE…87A3) — kept separate from the
 * cold treasury that receives /api/* earnings.
 *
 * Why CDP Server Wallet v2: signing happens inside Coinbase's AWS Nitro
 * Enclave. We never hold the private key. Wallet Secret is server-side env
 * only. Limited blast radius.
 *
 * Lazy singleton — initialized once per Node.js process.
 */

import { CdpClient } from "@coinbase/cdp-sdk";
import { x402Client } from "@x402/core/client";
import { ExactEvmScheme } from "@x402/evm";
import { wrapFetchWithPayment } from "@x402/fetch";

let _payingFetch: typeof fetch | null = null;
let _walletAddress: string | null = null;

async function initBuyer() {
  if (_payingFetch) return { fetchWithPayment: _payingFetch, address: _walletAddress! };

  const cdp = new CdpClient({
    apiKeyId: process.env.CDP_API_KEY_ID,
    apiKeySecret: process.env.CDP_API_KEY_SECRET,
    walletSecret: process.env.CDP_WALLET_SECRET,
  });

  // Same wallet name we use in the standalone shopping/buyer scripts
  const account = await cdp.evm.getAccount({ name: "visionaire-buyer-base" });

  const signer = {
    address: account.address,
    signTypedData: (msg: Parameters<typeof account.signTypedData>[0]) =>
      account.signTypedData(msg),
  };

  const client = x402Client.fromConfig({
    schemes: [
      { x402Version: 2, network: "eip155:8453", client: new ExactEvmScheme(signer) },
    ],
  });

  _payingFetch = wrapFetchWithPayment(fetch, client);
  _walletAddress = account.address;
  return { fetchWithPayment: _payingFetch, address: _walletAddress };
}

/**
 * Make a payment-aware fetch call. The wrapper auto-detects 402 challenges,
 * signs an EIP-712 payment authorization with the CDP wallet, and retries
 * with the PAYMENT-SIGNATURE header.
 *
 * Returns the upstream Response. Caller is responsible for reading body and
 * checking res.ok.
 */
export async function payingFetch(url: string, init?: RequestInit) {
  const { fetchWithPayment } = await initBuyer();
  return fetchWithPayment(url, init);
}

/**
 * Get the buyer wallet address for diagnostics. Safe to expose — public chain data.
 */
export async function getBuyerAddress() {
  const { address } = await initBuyer();
  return address;
}
