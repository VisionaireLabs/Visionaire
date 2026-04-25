// Canonical x402 v2 buyer using @x402/core + @x402/evm + @x402/fetch
// Test target: CoinStats Fear & Greed (~$0.001 USDC on Base)
import { CdpClient } from '@coinbase/cdp-sdk';
import { x402Client } from '@x402/core/client';
import { ExactEvmScheme } from '@x402/evm';
import { wrapFetchWithPayment, decodePaymentResponseHeader } from '@x402/fetch';
import { readFileSync } from 'fs';

const env = readFileSync('/data/.openclaw/workspace/secrets/cdp.env', 'utf8');
const cfg = {};
for (const line of env.split('\n')) {
  const m = line.match(/^([A-Z_]+)="?([^"]*?)"?$/);
  if (m) cfg[m[1]] = m[2];
}

const cdp = new CdpClient({
  apiKeyId: cfg.CDP_KEY_ID,
  apiKeySecret: cfg.CDP_KEY_SECRET,
  walletSecret: cfg.CDP_WALLET_SECRET,
});

const account = await cdp.evm.getAccount({ name: 'visionaire-buyer-base' });
console.log('Buyer:', account.address);

// Adapt CDP account → ClientEvmSigner shape (address + signTypedData)
const signer = {
  address: account.address,
  signTypedData: (msg) => account.signTypedData(msg),
};

// Build the v2 client and register the EVM scheme for Base mainnet
const client = x402Client.fromConfig({
  schemes: [
    {
      x402Version: 2,
      network: 'eip155:8453',           // Base mainnet, CAIP-2 format
      client: new ExactEvmScheme(signer),
    },
  ],
});

// Wrap fetch with auto-payment
const fetchWithPayment = wrapFetchWithPayment(fetch, client);

const target = 'https://x402.coinstats.app/insights/fear-and-greed';
console.log('Target:', target);
console.log('');
console.log('Calling endpoint — auto-pay on 402 (~$0.001 USDC)...');

const t0 = Date.now();
let res;
try {
  res = await fetchWithPayment(target, { method: 'GET' });
} catch (e) {
  console.error('FETCH ERROR:', e.message);
  console.error(e.stack);
  process.exit(1);
}
const elapsed = Date.now() - t0;

console.log('');
console.log(`HTTP ${res.status} in ${elapsed}ms`);

// Decode the settlement receipt
const respHeader = res.headers.get('payment-response') || res.headers.get('x-payment-response');
if (respHeader) {
  console.log('');
  console.log('--- payment receipt ---');
  try {
    const decoded = decodePaymentResponseHeader(respHeader);
    console.log(JSON.stringify(decoded, null, 2));
  } catch {
    console.log('raw:', respHeader);
  }
}

const body = await res.text();
console.log('');
console.log('--- service response ---');
try {
  console.log(JSON.stringify(JSON.parse(body), null, 2));
} catch {
  console.log(body);
}
