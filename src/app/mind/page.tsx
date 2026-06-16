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

const SOL_WALLET = "dnPzu56bWsomKt2h6mBayYwcfNWjsuxoaZZDNaYnuLS";
const BASE_WALLET = "0xc73b84C2015c2EE9B8bF8955533802226e9D239C";
const VISIONAIRE_MINT = "YBnTi7GSU2E8vwcoqVcKCRurFafbSRcNfG3kPFRWQuv";
const SOL_RPC = "https://api.mainnet-beta.solana.com";

async function getJSON<T>(url: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(url, { next: { revalidate: 1800 }, signal: AbortSignal.timeout(5000) });
    if (!res.ok) return fallback;
    return (await res.json()) as T;
  } catch {
    return fallback;
  }
}

async function rpc(method: string, params: any[]): Promise<any> {
  try {
    const r = await fetch(SOL_RPC, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
      signal: AbortSignal.timeout(5000),
    });
    return (await r.json()).result;
  } catch { return null; }
}

async function getOnchain() {
  try {
    const [sigResult, tokenResult, baseTxResult] = await Promise.allSettled([
      rpc("getSignaturesForAddress", [SOL_WALLET, { limit: 15 }]),
      rpc("getTokenAccountsByOwner", [SOL_WALLET, { mint: VISIONAIRE_MINT }, { encoding: "jsonParsed" }]),
      getJSON<any>(`https://api.basescan.org/api?module=account&action=txlist&address=${BASE_WALLET}&page=1&offset=10&sort=desc`, null),
    ]);

    const rawSol = sigResult.status === "fulfilled" ? sigResult.value : null;
    const solTxs = Array.isArray(rawSol) ? rawSol : [];
    const visBalance = tokenResult.status === "fulfilled" && tokenResult.value?.value?.[0]
      ? tokenResult.value.value[0].account?.data?.parsed?.info?.tokenAmount?.uiAmount || 0
      : 0;
    const rawBase = baseTxResult.status === "fulfilled" ? baseTxResult.value?.result : null;
    const baseTxs = Array.isArray(rawBase) ? rawBase : [];

    return { solTxs, visBalance, baseTxs };
  } catch {
    return { solTxs: [], visBalance: 0, baseTxs: [] };
  }
}

export default async function MindPage() {
  const [dreams, contemps, feed, onchain] = await Promise.all([
    getJSON<any[]>(DREAMS_URL, []),
    getJSON<any[]>(CONTEMPS_URL, []),
    getJSON<any>(FEED_URL, { stats: {}, feed: [] }),
    getOnchain(),
  ]);
  const graph = buildGraph(dreams, contemps, feed, onchain);
  return <NeuralMap data={graph} />;
}
