import type { Metadata } from "next";
import { buildGraph } from "./graph";
import NeuralMap from "./NeuralMap";

export const metadata: Metadata = {
  title: "Visionaire · Neural Map",
  description: "A living monochrome map of Visionaire's mind — dreams, contemplations and signals woven by shared themes.",
};

export const revalidate = 1800;

const DREAMS_URL = "https://brain.visionaire.live/dreams/data.json";
const CONTEMPS_URL = "https://brain.visionaire.live/contemplations/data.json";
const FEED_URL = "https://brain.visionaire.live/feed.json";

import { readFile } from "node:fs/promises";
import { join } from "node:path";

const ADDR = {
  solana: "dnPzu56bWsomKt2h6mBayYwcfNWjsuxoaZZDNaYnuLS",
  base: "0xc73b84C2015c2EE9B8bF8955533802226e9D239C",
  cdpHot: "0x2EbE2BDB68845B456667D779BC01d198bed287A3",
  bitcoin: "bc1p778g7uxtkg2jvu9fct5ugxhwq6dfvf9hfu8my0weyfu8vfuntm7qfnwj8f",
};
const VIS_MINT = "YBnTi7GSU2E8vwcoqVcKCRurFafbSRcNfG3kPFRWQuv";
const USDC_BASE = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const SOL_RPC = "https://api.mainnet-beta.solana.com";

async function sf<T>(url: string, opts?: RequestInit): Promise<T | null> {
  try {
    const r = await fetch(url, { next: { revalidate: 1800 }, signal: AbortSignal.timeout(5000), ...opts });
    if (!r.ok) return null;
    return (await r.json()) as T;
  } catch { return null; }
}

async function rpc(method: string, params: any[]): Promise<any> {
  try {
    const r = await fetch(SOL_RPC, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
      next: { revalidate: 1800 }, signal: AbortSignal.timeout(5000),
    });
    return (await r.json()).result;
  } catch { return null; }
}

async function getOnchain() {
  const settled = await Promise.allSettled([
    // 0: SOL balance
    rpc("getBalance", [ADDR.solana]),
    // 1: all SPL tokens
    rpc("getTokenAccountsByOwner", [ADDR.solana, { programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" }, { encoding: "jsonParsed" }]),
    // 2: recent sol txs
    rpc("getSignaturesForAddress", [ADDR.solana, { limit: 8 }]),
    // 3: base treasury ETH
    sf<{ result: string }>(SOL_RPC.replace("api.mainnet-beta.solana.com", "mainnet.base.org"), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_getBalance", params: [ADDR.base, "latest"] }) }),
    // 4: base token txs
    sf<any>(`https://api.basescan.org/api?module=account&action=tokentx&address=${ADDR.base}&page=1&offset=5&sort=desc`),
    // 5: bitcoin
    sf<any>(`https://mempool.space/api/address/${ADDR.bitcoin}`),
    // 6: prices
    sf<any>("https://api.coingecko.com/api/v3/simple/price?ids=solana,ethereum,bitcoin&vs_currencies=usd"),
    // 7: jupiter audit
    sf<any[]>(`https://datapi.jup.ag/v1/assets/search?query=${VIS_MINT}`),
    // 8: vesting snapshot
    (async () => { try { return JSON.parse(await readFile(join(process.cwd(), "public", "vesting.json"), "utf-8")); } catch { return null; } })(),
  ]);

  const get = <T,>(i: number, fb: T): T => settled[i].status === "fulfilled" ? ((settled[i] as PromiseFulfilledResult<T>).value ?? fb) : fb;

  const solLamports = get<any>(0, null)?.value ?? 0;
  const solBalance = solLamports / 1e9;

  const tokenAccs = get<any>(1, null)?.value ?? [];
  const tokens: { mint: string; amount: number; symbol?: string }[] = [];
  for (const acc of (Array.isArray(tokenAccs) ? tokenAccs : [])) {
    const info = acc?.account?.data?.parsed?.info;
    if (!info?.mint) continue;
    const amount = info.tokenAmount?.uiAmount ?? 0;
    if (amount <= 0) continue;
    tokens.push({ mint: info.mint, amount, symbol: info.mint === VIS_MINT ? "$VISIONAIRE" : undefined });
  }

  const rawSolTxs = get<any[]>(2, []);
  const solTxs = Array.isArray(rawSolTxs) ? rawSolTxs : [];

  const rawBaseTxs = get<any>(4, null)?.result;
  const baseTxs = Array.isArray(rawBaseTxs) ? rawBaseTxs : [];

  const btcData = get<any>(5, null);
  const btcSats = btcData ? (btcData.chain_stats?.funded_txo_sum ?? 0) - (btcData.chain_stats?.spent_txo_sum ?? 0) : 0;
  const btcBalance = btcSats / 1e8;
  const btcTxCount = btcData?.chain_stats?.tx_count ?? 0;

  const prices = get<any>(6, null);
  const solPrice = prices?.solana?.usd ?? 0;
  const ethPrice = prices?.ethereum?.usd ?? 0;
  const btcPrice = prices?.bitcoin?.usd ?? 0;

  const auditArr = get<any[]>(7, []);
  const audit = Array.isArray(auditArr) ? (auditArr.find((d: any) => d.id === VIS_MINT) ?? auditArr[0] ?? null) : null;
  const visPrice = audit?.usdPrice ?? 0;
  const visMcap = audit?.mcap ?? 0;
  const visHolders = audit?.holderCount ?? 0;

  const vesting = get<any>(8, null);
  const visToken = tokens.find(t => t.mint === VIS_MINT);
  const visBalance = visToken?.amount ?? 0;

  const vestedTokens = vesting?.streams?.reduce((s: number, st: any) => {
    const div = Math.pow(10, st.decimals || 6);
    return s + Number(BigInt(st.depositedRaw || "0")) / div;
  }, 0) ?? 0;
  const stakedTokens = vesting?.staking?.reduce((s: number, st: any) => {
    const div = Math.pow(10, st.decimals || 6);
    return s + Number(BigInt(st.amountRaw || "0")) / div;
  }, 0) ?? 0;

  const liquidUsd = solBalance * solPrice + visBalance * visPrice;
  const vestedUsd = vestedTokens * visPrice;
  const stakedUsd = stakedTokens * visPrice;
  const btcUsd = btcBalance * btcPrice;
  const totalUsd = liquidUsd + vestedUsd + stakedUsd + btcUsd;

  return { solBalance, solPrice, solTxs, tokens, baseTxs, btcBalance, btcTxCount, btcUsd, visBalance, visPrice, visMcap, visHolders, audit, vesting, vestedTokens, stakedTokens, liquidUsd, vestedUsd, stakedUsd, totalUsd };
}

export default async function MindPage() {
  const [dreamsRaw, contempsRaw, feedRaw, onchain] = await Promise.all([
    sf<any[]>(DREAMS_URL),
    sf<any[]>(CONTEMPS_URL),
    sf<any>(FEED_URL),
    getOnchain(),
  ]);
  const dreams = dreamsRaw ?? [];
  const contemps = contempsRaw ?? [];
  const feed = feedRaw ?? { stats: {}, feed: [] };
  const graph = buildGraph(dreams, contemps, feed, onchain as any);
  return <NeuralMap data={graph} />;
}
