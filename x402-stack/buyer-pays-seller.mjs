// END-TO-END: Visionaire's CDP wallet pays the Visionaire Labs seller.
// Same canonical x402 v2 stack, but pointed at our own /api/forest (cheaper test, $0.01).
import { CdpClient } from '@coinbase/cdp-sdk';
import { x402Client } from '@x402/core/client';
import { ExactEvmScheme } from '@x402/evm';
import { wrapFetchWithPayment, decodePaymentResponseHeader } from '@x402/fetch';
import { readFileSync } from 'fs';

const env = readFileSync('/data/.openclaw/workspace/secrets/cdp.env', 'utf8');
const cfg = {};
for (const line of env.split('\n')) { const m = line.match(/^([A-Z_]+)="?([^"]*?)"?$/); if (m) cfg[m[1]] = m[2]; }

const cdp = new CdpClient({ apiKeyId: cfg.CDP_KEY_ID, apiKeySecret: cfg.CDP_KEY_SECRET, walletSecret: cfg.CDP_WALLET_SECRET });
const account = await cdp.evm.getAccount({ name: 'visionaire-buyer-base' });

const signer = { address: account.address, signTypedData: (msg) => account.signTypedData(msg) };

const client = x402Client.fromConfig({
  schemes: [{ x402Version: 2, network: 'eip155:8453', client: new ExactEvmScheme(signer) }],
});

const fetchWithPayment = wrapFetchWithPayment(fetch, client);

const target = 'http://localhost:3300/api/forest';
console.log('Buyer:', account.address);
console.log('Target:', target);
console.log('Price: $0.01 USDC');
console.log('');

const t0 = Date.now();
const res = await fetchWithPayment(target, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ phrase: 'silicon dreams' }),
});
const elapsed = Date.now() - t0;

console.log(`HTTP ${res.status} in ${elapsed}ms`);

const respHeader = res.headers.get('payment-response') || res.headers.get('x-payment-response');
if (respHeader) {
  console.log('');
  console.log('--- payment receipt ---');
  try { console.log(JSON.stringify(decodePaymentResponseHeader(respHeader), null, 2)); }
  catch { console.log(respHeader); }
}

const body = await res.text();
console.log('');
console.log('--- service response ---');
try { console.log(JSON.stringify(JSON.parse(body), null, 2)); }
catch { console.log(body); }
