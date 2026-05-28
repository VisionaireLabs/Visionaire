#!/usr/bin/env node
/**
 * x402scan SIWX-gated origin registration.
 *
 * Submits visionaire.live to https://www.x402scan.com so its crawler picks up
 * all 5 resources from /.well-known/x402.
 *
 * Usage:
 *   node register.mjs --dry-run    # prints the SIWX message that WOULD be signed
 *   node register.mjs --send       # actually signs + submits
 *
 * Wallet: visionaire-buyer-base (CDP TEE, 0x2EbE…87A3)
 *   Why this wallet: it's the public buyer identity; signing here is
 *   "Visionaire's autonomous-being identity claims this origin" — same
 *   wallet that already buys USDC services on her behalf. Thor approves
 *   the signing event explicitly.
 *
 * Run from inside visionaire-site/ so .env.local / vercel env is reachable:
 *   cd /data/.openclaw/workspace/visionaire-site
 *   set -a; . .env.production.tmp; set +a
 *   node /data/.openclaw/workspace/scratch/x402scan/register.mjs --dry-run
 */

import { CdpClient } from "@coinbase/cdp-sdk";

const ORIGIN = "https://visionaire.live";
const ENDPOINT = "https://www.x402scan.com/api/x402/registry/register-origin";

const args = process.argv.slice(2);
const DRY = args.includes("--dry-run");
const SEND = args.includes("--send");
if (!DRY && !SEND) {
  console.error("usage: node register.mjs --dry-run | --send");
  process.exit(2);
}

async function main() {
  const cdp = new CdpClient({
    apiKeyId: process.env.CDP_API_KEY_ID,
    apiKeySecret: process.env.CDP_API_KEY_SECRET,
    walletSecret: process.env.CDP_WALLET_SECRET,
  });
  const account = await cdp.evm.getAccount({ name: "visionaire-buyer-base" });

  // Step 1: hit the endpoint with no payment to receive the SIWX challenge.
  const challengeResp = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ origin: ORIGIN }),
  });
  if (challengeResp.status !== 402) {
    console.error("expected 402 challenge, got", challengeResp.status);
    process.exit(1);
  }
  const challenge = await challengeResp.json();
  const siwxInfo = challenge.extensions["sign-in-with-x"].info;

  // Step 2: build the EIP-4361-style message x402scan expects
  const fields = {
    domain: siwxInfo.domain,
    address: account.address,
    statement: siwxInfo.statement,
    uri: siwxInfo.uri,
    version: siwxInfo.version,
    chainId: siwxInfo.chainId,
    type: siwxInfo.type, // "eip191"
    nonce: siwxInfo.nonce,
    issuedAt: siwxInfo.issuedAt,
    expirationTime: siwxInfo.expirationTime,
  };

  // EIP-4361 / SIWE message format
  const message =
    `${fields.domain} wants you to sign in with your Ethereum account:\n` +
    `${fields.address}\n\n` +
    `${fields.statement}\n\n` +
    `URI: ${fields.uri}\n` +
    `Version: ${fields.version}\n` +
    `Chain ID: ${fields.chainId.split(":")[1]}\n` +
    `Nonce: ${fields.nonce}\n` +
    `Issued At: ${fields.issuedAt}\n` +
    `Expiration Time: ${fields.expirationTime}`;

  console.log("=== SIWX message that will be signed ===");
  console.log(message);
  console.log("=== ===");
  console.log();
  console.log("Signer wallet:", account.address);
  console.log("Origin claimed:", ORIGIN);
  console.log("Signing infra:  Coinbase CDP TEE (AWS Nitro Enclave)");
  console.log();

  if (DRY) {
    console.log("DRY RUN — no signature created, nothing submitted.");
    console.log("To actually sign + submit, re-run with --send.");
    return;
  }

  // Step 3: sign with EIP-191 (personal_sign)
  const sigResp = await account.signMessage({ message });
  const signature = sigResp.signature ?? sigResp;
  console.log("Signature:", signature);

  // Step 4: resubmit with the signature in SIGN-IN-WITH-X header
  const siwxHeader = Buffer.from(
    JSON.stringify({ ...fields, signature })
  ).toString("base64");

  const resp = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "SIGN-IN-WITH-X": siwxHeader,
    },
    body: JSON.stringify({ origin: ORIGIN }),
  });

  console.log("HTTP", resp.status);
  const body = await resp.text();
  console.log(body);
}

main().catch((e) => {
  console.error("FATAL:", e.message);
  process.exit(1);
});
