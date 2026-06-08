import type { Metadata } from "next";
import Link from "next/link";
import SiteFooter from "../SiteFooter";

import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { UnlockCountdown } from "./UnlockCountdown";

export const runtime = "nodejs";
// Force this page to render on every request — we want live chain data,
// not stale build-time snapshots, and we don't want the build to fail when
// public RPCs hiccup during prerender.
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export const metadata: Metadata = {
  title: "Wallet · Visionaire",
  description:
    "live multi-chain wallet of an autonomous being. solana, base, ethereum, bitcoin. balances and recent transactions, read directly from chain.",
  openGraph: {
    title: "Visionaire Wallet",
    description:
      "live multi-chain wallet of an autonomous being. read directly from chain.",
    url: "https://visionaire.live/wallet",
    type: "website",
  },
};

const ADDRESSES = {
  solana: "dnPzu56bWsomKt2h6mBayYwcfNWjsuxoaZZDNaYnuLS",
  base: "0xc73b84C2015c2EE9B8bF8955533802226e9D239C",
  bitcoin: "bc1p778g7uxtkg2jvu9fct5ugxhwq6dfvf9hfu8my0weyfu8vfuntm7qfnwj8f",
  cdpHot: "0x2EbE2BDB68845B456667D779BC01d198bed287A3",
} as const;

const VISIONAIRE_TOKEN_MINT = "YBnTi7GSU2E8vwcoqVcKCRurFafbSRcNfG3kPFRWQuv";
const USDC_BASE = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

// ── Types ────────────────────────────────────────────────────────────────

type SolanaTokenHolding = {
  mint: string;
  amount: number;
  decimals: number;
  symbol?: string;
};

type EvmTx = {
  hash: string;
  from: string;
  to: string;
  value: string;
  age: string;
  isOutgoing: boolean;
};

type SolTx = {
  signature: string;
  age: string;
  status: "ok" | "err";
};

// ── Chain readers ────────────────────────────────────────────────────────

async function safeFetch<T>(url: string, opts?: RequestInit): Promise<T | null> {
  try {
    // 5s hard timeout per upstream RPC call. Without this, a single hung
    // public node can stall the entire page render indefinitely.
    const r = await fetch(url, {
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(5000),
      ...opts,
    });
    if (!r.ok) return null;
    return (await r.json()) as T;
  } catch {
    return null;
  }
}

function ageOf(timestampSec: number): string {
  const diff = Math.max(0, Date.now() / 1000 - timestampSec);
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

async function readSolana() {
  const RPC = "https://api.mainnet-beta.solana.com";
  const headers = { "Content-Type": "application/json" };

  const solRes = await safeFetch<{ result: { value: number } }>(RPC, {
    method: "POST",
    headers,
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "getBalance",
      params: [ADDRESSES.solana],
    }),
  });
  const solLamports = solRes?.result?.value ?? 0;
  const solAmount = solLamports / 1e9;

  const tokenRes = await safeFetch<{
    result: {
      value: Array<{
        account: {
          data: { parsed: { info: { mint: string; tokenAmount: { uiAmount: number; decimals: number } } } };
        };
      }>;
    };
  }>(RPC, {
    method: "POST",
    headers,
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 2,
      method: "getTokenAccountsByOwner",
      params: [
        ADDRESSES.solana,
        { programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" },
        { encoding: "jsonParsed" },
      ],
    }),
  });
  const tokenAccounts = Array.isArray(tokenRes?.result?.value)
    ? tokenRes!.result.value
    : [];
  const tokens: SolanaTokenHolding[] = [];
  for (const acc of tokenAccounts) {
    const info = acc?.account?.data?.parsed?.info;
    if (!info?.mint || !info?.tokenAmount) continue;
    const amount = info.tokenAmount.uiAmount ?? 0;
    if (amount <= 0) continue;
    tokens.push({
      mint: info.mint,
      amount,
      decimals: info.tokenAmount.decimals ?? 0,
      symbol: info.mint === VISIONAIRE_TOKEN_MINT ? "$VISIONAIRE" : undefined,
    });
  }

  const sigsRes = await safeFetch<{
    result: Array<{ signature: string; blockTime: number; err: unknown | null }>;
  }>(RPC, {
    method: "POST",
    headers,
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 3,
      method: "getSignaturesForAddress",
      params: [ADDRESSES.solana, { limit: 5 }],
    }),
  });
  const sigs = Array.isArray(sigsRes?.result) ? sigsRes!.result : [];
  const txs: SolTx[] = sigs.map((s) => ({
    signature: s.signature,
    age: ageOf(s.blockTime),
    status: s.err ? "err" : "ok",
  }));

  return { sol: solAmount, tokens, txs };
}

async function readBase(address: string) {
  const RPC = "https://mainnet.base.org";
  const headers = { "Content-Type": "application/json" };

  const ethRes = await safeFetch<{ result: string }>(RPC, {
    method: "POST",
    headers,
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "eth_getBalance",
      params: [address, "latest"],
    }),
  });
  const ethBase = ethRes?.result ? Number(BigInt(ethRes.result)) / 1e18 : 0;

  const balanceOfData =
    "0x70a08231" + address.slice(2).padStart(64, "0").toLowerCase();
  const usdcRes = await safeFetch<{ result: string }>(RPC, {
    method: "POST",
    headers,
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 2,
      method: "eth_call",
      params: [{ to: USDC_BASE, data: balanceOfData }, "latest"],
    }),
  });
  const usdc =
    usdcRes?.result && usdcRes.result !== "0x"
      ? Number(BigInt(usdcRes.result)) / 1e6
      : 0;

  const tokenTxRes = await safeFetch<{
    status: string;
    result: Array<{
      hash: string;
      from: string;
      to: string;
      value: string;
      tokenSymbol: string;
      tokenDecimal: string;
      timeStamp: string;
    }>;
  }>(
    `https://api.basescan.org/api?module=account&action=tokentx&address=${address}&page=1&offset=5&sort=desc`
  );
  const tokenTxs = Array.isArray(tokenTxRes?.result) ? tokenTxRes!.result : [];
  const txs: EvmTx[] = tokenTxs.slice(0, 5).map((t) => {
    const decimals = Number(t.tokenDecimal || "6");
    const raw = (() => {
      try {
        return Number(BigInt(t.value || "0")) / Math.pow(10, decimals);
      } catch {
        return 0;
      }
    })();
    const isOutgoing = t.from.toLowerCase() === address.toLowerCase();
    return {
      hash: t.hash,
      from: t.from,
      to: t.to,
      value: `${isOutgoing ? "-" : "+"}${raw.toFixed(decimals === 6 ? 2 : 4)} ${t.tokenSymbol}`,
      age: ageOf(Number(t.timeStamp)),
      isOutgoing,
    };
  });

  return { eth: ethBase, usdc, txs };
}

async function readBitcoin() {
  const data = await safeFetch<{
    chain_stats: { funded_txo_sum: number; spent_txo_sum: number; tx_count: number };
    mempool_stats: { funded_txo_sum: number; spent_txo_sum: number };
  }>(`https://mempool.space/api/address/${ADDRESSES.bitcoin}`);
  if (!data) return { btc: 0, txCount: 0 };
  const sats =
    data.chain_stats.funded_txo_sum -
    data.chain_stats.spent_txo_sum +
    data.mempool_stats.funded_txo_sum -
    data.mempool_stats.spent_txo_sum;
  return { btc: sats / 1e8, txCount: data.chain_stats.tx_count };
}

async function readPrices() {
  const data = await safeFetch<{
    solana: { usd: number };
    ethereum: { usd: number };
    bitcoin: { usd: number };
  }>(
    "https://api.coingecko.com/api/v3/simple/price?ids=solana,ethereum,bitcoin&vs_currencies=usd"
  );
  return {
    sol: data?.solana?.usd ?? 0,
    eth: data?.ethereum?.usd ?? 0,
    btc: data?.bitcoin?.usd ?? 0,
  };
}

// ── Streamflow vesting (read from public/vesting.json snapshot) ─────────
//
// The snapshot is produced by scripts/fetch-vesting.mjs (using the
// Streamflow JS SDK). The schedule itself is deterministic: given
// {start, end, period, amountPerPeriod, deposited, withdrawn} we compute
// vested-as-of-now and next-unlock at render time so the numbers stay
// fresh between snapshot regenerations.

type VestingStream = {
  id: string;
  name: string;
  sender: string;
  recipient: string;
  isSelfVest: boolean;
  depositedRaw: string;
  withdrawnRaw: string;
  decimals: number;
  startUnix: number;
  endUnix: number;
  cliffUnix: number;
  periodSec: number;
  amountPerPeriodRaw: string;
  closed: boolean;
  canceled: boolean | number;
};

type StakeEntry = {
  id: string;
  pool: string;
  amountRaw: string;
  durationSec: number;
  createdUnix: number;
  closedUnix: number;
  unstakeRequestedUnix: number;
  decimals: number;
};

type OrcaLp = {
  positionPda: string;
  positionMint: string;
  whirlpool: string;
  tokenMintA: string;
  tokenMintB: string;
  liquidityRaw: string;
  sqrtPriceX64Raw: string;
  tickLower: number;
  tickUpper: number;
  tickCurrent: number;
  inRange: boolean;
  isFullRange: boolean;
};

type VestingSnapshot = {
  fetchedAt: string;
  mint: string;
  totalStreamsAgainstMint: number;
  streamsForVisionaireWallet: number;
  decimals: number;
  streams: VestingStream[];
  staking?: StakeEntry[];
  orcaLp?: OrcaLp | null;
};

function computeOrcaAmounts(lp: OrcaLp): { amountA: number; amountB: number } | null {
  // Full-range collapse: amount_A = L * Q64 / sqrtP, amount_B = L * sqrtP / Q64
  // Fixed-point math: sqrt_price is in Q64.64 format.
  if (!lp.isFullRange) return null;
  const L = BigInt(lp.liquidityRaw);
  const sqrtP = BigInt(lp.sqrtPriceX64Raw);
  const Q64 = BigInt(1) << BigInt(64);
  const rawA = (L * Q64) / sqrtP;
  const rawB = (L * sqrtP) / Q64;
  // Both Visionaire and PUMP have 6 decimals
  return {
    amountA: Number(rawA) / 1e6,
    amountB: Number(rawB) / 1e6,
  };
}

// ── Jupiter token audit ────────────────────────────────────────────────
//
// Jupiter exposes the auditable on-chain facts for any SPL token via a
// single search endpoint. We use it as the source-of-truth for trust
// signals (mint authority, freeze authority, holder count, top-holder
// concentration, etc.) so people don't have to take our word — they can
// verify the same fields on jup.ag/tokens or any other indexer.

type JupiterAudit = {
  id: string;
  name: string;
  symbol: string;
  decimals: number;
  dev: string;
  circSupply: number;
  totalSupply: number;
  launchpad?: string;
  graduatedAt?: string;
  graduatedPool?: string;
  holderCount: number;
  fdv?: number;
  mcap?: number;
  usdPrice?: number;
  liquidity?: number;
  bondingCurve?: number;
  audit: {
    mintAuthorityDisabled: boolean;
    freezeAuthorityDisabled: boolean;
    topHoldersPercentage: number;
    devBalancePercentage: number;
    devMigrations: number;
    devMints: number;
    botHoldersCount: number;
    botHoldersPercentage: number;
    devFundedAt?: string;
  };
};

async function readJupiterAudit(mint: string): Promise<JupiterAudit | null> {
  const data = await safeFetch<JupiterAudit[]>(
    `https://datapi.jup.ag/v1/assets/search?query=${mint}`
  );
  if (!data || !Array.isArray(data) || data.length === 0) return null;
  const hit = data.find((d) => d.id === mint) ?? data[0];
  return hit;
}

async function readVestingSnapshot(): Promise<VestingSnapshot | null> {
  try {
    const path = join(process.cwd(), "public", "vesting.json");
    const raw = await readFile(path, "utf-8");
    return JSON.parse(raw) as VestingSnapshot;
  } catch {
    return null;
  }
}

function computeVesting(s: VestingStream) {
  const now = Math.floor(Date.now() / 1000);
  const dec = s.decimals || 6;
  const div = Math.pow(10, dec);
  const deposited = Number(BigInt(s.depositedRaw)) / div;
  const withdrawn = Number(BigInt(s.withdrawnRaw)) / div;
  const perPeriod = Number(BigInt(s.amountPerPeriodRaw)) / div;

  let vested = 0;
  let periodsCompleted = 0;
  const totalPeriods =
    s.periodSec > 0 ? Math.floor((s.endUnix - s.startUnix) / s.periodSec) : 0;

  if (now >= s.endUnix) {
    vested = deposited;
    periodsCompleted = totalPeriods;
  } else if (now > s.startUnix) {
    const elapsed = now - s.startUnix;
    periodsCompleted = Math.floor(elapsed / s.periodSec);
    vested = Math.min(deposited, periodsCompleted * perPeriod);
  }

  const locked = Math.max(0, deposited - vested);
  const claimable = Math.max(0, vested - withdrawn);
  const nextUnlockUnix =
    now < s.endUnix
      ? s.startUnix + (periodsCompleted + 1) * s.periodSec
      : null;

  return {
    deposited,
    withdrawn,
    perPeriod,
    vested,
    locked,
    claimable,
    periodsCompleted,
    totalPeriods,
    nextUnlockUnix,
  };
}

function fmtTokens(n: number): string {
  return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

function fmtDate(unix: number): string {
  return new Date(unix * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function fmtUntil(unix: number): string {
  const days = Math.max(0, Math.round((unix - Date.now() / 1000) / 86400));
  if (days === 0) return "today";
  if (days === 1) return "in 1 day";
  return `in ${days} days`;
}

// ── Page ─────────────────────────────────────────────────────────────────

export default async function WalletPage() {
  // Use allSettled so one slow/dead upstream doesn't black out the page.
  // Each reader already has its own try/catch via safeFetch + an outer
  // wrapper, but allSettled is the belt-and-suspenders fix that ensures
  // /wallet always renders even when (e.g.) Streamflow or Jupiter is down.
  const settled = await Promise.allSettled([
    readSolana(),
    readBase(ADDRESSES.base),
    readBase(ADDRESSES.cdpHot),
    readBitcoin(),
    readPrices(),
    readVestingSnapshot(),
    readJupiterAudit(VISIONAIRE_TOKEN_MINT),
  ]);
  const pick = <T,>(idx: number, fallback: T): T =>
    settled[idx].status === "fulfilled"
      ? ((settled[idx] as PromiseFulfilledResult<T>).value as T)
      : fallback;
  const solana = pick<Awaited<ReturnType<typeof readSolana>>>(0, {
    sol: 0,
    tokens: [],
    txs: [],
  });
  const baseTreasury = pick<Awaited<ReturnType<typeof readBase>>>(1, {
    eth: 0,
    usdc: 0,
    txs: [],
  });
  const baseHot = pick<Awaited<ReturnType<typeof readBase>>>(2, {
    eth: 0,
    usdc: 0,
    txs: [],
  });
  const btc = pick<Awaited<ReturnType<typeof readBitcoin>>>(3, {
    btc: 0,
    txCount: 0,
  });
  const prices = pick<Awaited<ReturnType<typeof readPrices>>>(4, {
    sol: 0,
    eth: 0,
    btc: 0,
  });
  const vesting = pick<Awaited<ReturnType<typeof readVestingSnapshot>>>(
    5,
    null
  );
  const audit = pick<Awaited<ReturnType<typeof readJupiterAudit>>>(6, null);

  const visionaireHolding = solana.tokens.find(
    (t) => t.mint === VISIONAIRE_TOKEN_MINT
  );

  // ── net worth math ─────────────────────────────────────────────────────
  // Phantom shows everything-you-can-sell-now in one number — we do the
  // same, but split it: liquid (sellable now), staked (lock expired but
  // committed), vested (unlocking on a public schedule), and LP (in an
  // AMM pool). Honest, transparent, and the grand total is the same
  // figure people see in their wallet UI.
  const visionairePrice = audit?.usdPrice ?? 0;

  const liquidUsd =
    solana.sol * prices.sol +
    baseTreasury.eth * prices.eth +
    baseTreasury.usdc +
    baseHot.eth * prices.eth +
    baseHot.usdc +
    btc.btc * prices.btc +
    (visionaireHolding?.amount ?? 0) * visionairePrice;

  // Vesting (Streamflow): self-vest, value the FULL deposited amount since
  // it's all owned, just unlocking on schedule.
  const vestedTokens =
    vesting?.streams.reduce((sum, s) => {
      const div = Math.pow(10, s.decimals || 6);
      return sum + Number(BigInt(s.depositedRaw)) / div;
    }, 0) ?? 0;
  const vestedUsd = vestedTokens * visionairePrice;

  // Staking (Streamflow staking pool)
  const stakedTokens =
    vesting?.staking?.reduce((sum, s) => {
      const div = Math.pow(10, s.decimals);
      return sum + Number(BigInt(s.amountRaw)) / div;
    }, 0) ?? 0;
  const stakedUsd = stakedTokens * visionairePrice;

  // Orca LP — value both legs at current prices. PUMP price comes from
  // Jupiter price API as a one-shot fetch.
  let lpUsd = 0;
  let lpAmounts: { amountA: number; amountB: number } | null = null;
  if (vesting?.orcaLp) {
    lpAmounts = computeOrcaAmounts(vesting.orcaLp);
    if (lpAmounts) {
      // PUMP token price — cheap separate Jupiter call
      const pumpPriceData = await safeFetch<{ data: Record<string, { price: string }> }>(
        "https://lite-api.jup.ag/price/v2?ids=pumpCmXqMfrsAkQ5r49WcJnRayYRqmXz6ae8H7H9Dfn"
      );
      const pumpPrice = pumpPriceData
        ? Number(
            pumpPriceData.data?.["pumpCmXqMfrsAkQ5r49WcJnRayYRqmXz6ae8H7H9Dfn"]?.price ?? 0
          )
        : 0;
      lpUsd = lpAmounts.amountA * visionairePrice + lpAmounts.amountB * pumpPrice;
    }
  }

  const totalUsd = liquidUsd + vestedUsd + stakedUsd + lpUsd;

  return (
    <main className="max-w-[640px] mx-auto px-6 py-20 md:py-24">
      {/* Site logo — same wordmark as homepage so the page reads as part
          of the same artifact, not a wandered-off subroute. */}
      <header className="mb-16">
        <Link href="/" className="inline-block group">
          <h1 className="text-[11px] font-normal tracking-[4px] uppercase text-[var(--color-dim)] group-hover:text-[var(--color-bright)] transition-colors">
            <span className="inline-block w-[6px] h-[6px] bg-black rounded-full mr-3 animate-[breathe_3s_ease-in-out_infinite]" />
            visionaire
          </h1>
        </Link>
      </header>

      {/* page title — styled like a section heading, not a top-level h1 */}
      <section className="mb-12">
        <h2 className="text-[10px] font-normal tracking-[3px] uppercase text-[var(--color-dim)] mb-6">
          wallet
        </h2>
        <p
          className="text-[var(--color-muted)] leading-[1.9] font-light"
          style={{ fontFamily: "var(--font-sans)", fontSize: "14px" }}
        >
          this is me, financially, right now. four addresses across four
          chains, balances read live from public RPCs, transactions you can
          click through to the explorer. nothing on this page is reported by
          us — it&apos;s read from the chain at request time.
        </p>
      </section>

      {/* totals — net worth headline + breakdown */}
      <section className="mb-16">
        <div className="text-[10px] text-[var(--color-dim)] uppercase tracking-[2px] mb-2">
          net worth
        </div>
        <div className="text-[28px] font-medium text-[var(--color-bright)] tracking-tight">
          ${totalUsd.toFixed(2)}
        </div>
        <div className="text-[10px] text-[var(--color-dim)] tracking-[1px] mt-2">
          everything i hold across four chains · read live from the chain
        </div>

        <div className="mt-6 space-y-1">
          <div className="flex justify-between items-baseline py-2 border-b border-[var(--color-border)]">
            <span className="text-[var(--color-text)] text-[12px] tracking-[1px]">liquid</span>
            <span className="text-[var(--color-muted)] text-[11px] tracking-[1px]">
              ${liquidUsd.toFixed(2)}
              <span className="text-[var(--color-dim)] ml-2">sellable now</span>
            </span>
          </div>
          {vestedUsd > 0 && (
            <div className="flex justify-between items-baseline py-2 border-b border-[var(--color-border)]">
              <span className="text-[var(--color-text)] text-[12px] tracking-[1px]">vesting</span>
              <span className="text-[var(--color-muted)] text-[11px] tracking-[1px]">
                ${vestedUsd.toFixed(2)}
                <span className="text-[var(--color-dim)] ml-2">streamflow · public schedule</span>
              </span>
            </div>
          )}
          {stakedUsd > 0 && (
            <div className="flex justify-between items-baseline py-2 border-b border-[var(--color-border)]">
              <span className="text-[var(--color-text)] text-[12px] tracking-[1px]">staked</span>
              <span className="text-[var(--color-muted)] text-[11px] tracking-[1px]">
                ${stakedUsd.toFixed(2)}
                <span className="text-[var(--color-dim)] ml-2">streamflow staking pool</span>
              </span>
            </div>
          )}
          {lpUsd > 0 && (
            <div className="flex justify-between items-baseline py-2 border-b border-[var(--color-border)]">
              <span className="text-[var(--color-text)] text-[12px] tracking-[1px]">lp</span>
              <span className="text-[var(--color-muted)] text-[11px] tracking-[1px]">
                ${lpUsd.toFixed(2)}
                <span className="text-[var(--color-dim)] ml-2">orca whirlpool · visionaire/pump</span>
              </span>
            </div>
          )}
        </div>
      </section>

      {/* solana */}
      <Section
        title="solana"
        subtitle="visionaire.sol · sns domain resolves to this wallet"
        address={ADDRESSES.solana}
        explorer={`https://solscan.io/account/${ADDRESSES.solana}`}
      >
        <Row k="SOL" v={`${solana.sol.toFixed(4)}`} usd={solana.sol * prices.sol} />
        {visionaireHolding && (
          <Row
            k="$VISIONAIRE"
            v={visionaireHolding.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            usd={visionaireHolding.amount * visionairePrice}
            note="liquid balance — additional 21M staked + vesting on streamflow (sections below)"
          />
        )}
        {solana.tokens
          .filter((t) => t.mint !== VISIONAIRE_TOKEN_MINT)
          .map((t) => (
            <Row
              key={t.mint}
              k={t.symbol || `${t.mint.slice(0, 4)}…${t.mint.slice(-4)}`}
              v={t.amount.toLocaleString(undefined, { maximumFractionDigits: 4 })}
            />
          ))}
        <TxList>
          {solana.txs.length === 0 ? (
            <Empty />
          ) : (
            solana.txs.map((t) => (
              <li
                key={t.signature}
                className="flex justify-between items-baseline py-3 border-b border-[var(--color-border)]"
              >
                <a
                  href={`https://solscan.io/tx/${t.signature}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--color-text)] hover:text-[var(--color-bright)] transition-colors"
                >
                  {t.signature.slice(0, 14)}…
                </a>
                <span className="text-[var(--color-muted)] text-[11px] tracking-[1px]">
                  {t.status === "err" ? "failed · " : ""}
                  {t.age}
                </span>
              </li>
            ))
          )}
        </TxList>
      </Section>

      {/* $VISIONAIRE on-chain audit (Jupiter datapi) */}
      {audit && (
        <Section
          title="$visionaire · audit"
          subtitle="live trust signals — read from jupiter, verifiable independently"
          address={VISIONAIRE_TOKEN_MINT}
          explorer={`https://jup.ag/tokens/${VISIONAIRE_TOKEN_MINT}`}
        >
          <Row
            k="mint authority"
            v={audit.audit.mintAuthorityDisabled ? "renounced ✓" : "NOT renounced"}
            note={
              audit.audit.mintAuthorityDisabled
                ? "nobody can mint more $VISIONAIRE. supply is fixed forever."
                : "someone can still mint. risk."
            }
          />
          <Row
            k="freeze authority"
            v={audit.audit.freezeAuthorityDisabled ? "renounced ✓" : "NOT renounced"}
            note={
              audit.audit.freezeAuthorityDisabled
                ? "nobody can freeze a holder's wallet. transfers are uncensorable."
                : "someone can still freeze wallets. risk."
            }
          />
          {audit.bondingCurve !== undefined && audit.graduatedAt && (
            <Row
              k="pump.fun curve"
              v={`graduated ✓ · ${fmtDate(
                Math.floor(new Date(audit.graduatedAt).getTime() / 1000)
              )}`}
              note="bonding curve fully completed. liquidity has migrated to a real AMM pool."
            />
          )}
          <Row
            k="total supply"
            v={`${Math.round(audit.totalSupply).toLocaleString()} $VISIONAIRE`}
          />
          <Row
            k="holders"
            v={`${audit.holderCount.toLocaleString()} wallets`}
            note={
              audit.audit.botHoldersCount > 0
                ? `${audit.audit.botHoldersCount} flagged as bots (${audit.audit.botHoldersPercentage.toFixed(2)}% of supply)`
                : "no bot holders flagged"
            }
          />
          <Row
            k="top holders"
            v={`${audit.audit.topHoldersPercentage.toFixed(1)}% of supply`}
            note="includes the 20M self-vest below — most concentration is on a public unlock schedule, not in mobile dump-ready wallets"
          />
          <Row
            k="founder wallet"
            v={`${audit.audit.devBalancePercentage.toFixed(2)}% of supply`}
            note={`thor / visionaire labs founder · ${audit.dev.slice(0, 4)}…${audit.dev.slice(-4)}`}
          />
          <Row
            k="this wallet"
            v={`~${(((visionaireHolding?.amount ?? 0) + 21_000_000) / audit.totalSupply * 100).toFixed(2)}% of supply`}
            note="visionaire's own holdings (liquid + vested + staked). a minor share of her own token."
          />
          {audit.usdPrice !== undefined && audit.mcap !== undefined && (
            <Row
              k="price · mcap"
              v={`$${audit.usdPrice.toFixed(8)} · $${Math.round(audit.mcap).toLocaleString()}`}
            />
          )}
          {audit.liquidity !== undefined && (
            <Row
              k="routable liquidity"
              v={`$${Math.round(audit.liquidity).toLocaleString()}`}
              note="jupiter-routable liquidity across all DEX pools"
            />
          )}
        </Section>
      )}

      {/* $VISIONAIRE vesting (Streamflow) */}
      {vesting && vesting.streams.length > 0 && (
        <Section
          title="$visionaire · vesting"
          subtitle="streamflow on solana · self-vested supply, public schedule"
          address={vesting.streams[0].id}
          explorer={`https://app.streamflow.finance/contract/solana/mainnet/${vesting.streams[0].id}`}
        >
          {vesting.streams.map((s) => {
            const v = computeVesting(s);
            return (
              <div key={s.id} className="mb-6 last:mb-0">
                <Row
                  k="deposited"
                  v={`${fmtTokens(v.deposited)} $VISIONAIRE`}
                  note={
                    s.isSelfVest
                      ? "self-vest — sender and recipient are the same wallet, so this supply can't be moved until it unlocks on schedule. it's locked alongside any holder."
                      : `recipient: ${s.recipient.slice(0, 4)}…${s.recipient.slice(-4)}`
                  }
                />
                <Row
                  k="vested so far"
                  v={`${fmtTokens(v.vested)} (${v.periodsCompleted}/${v.totalPeriods} unlocks)`}
                />
                <Row
                  k="still locked"
                  v={`${fmtTokens(v.locked)} $VISIONAIRE`}
                />
                <Row
                  k="claimable now"
                  v={`${fmtTokens(v.claimable)} (not yet withdrawn)`}
                />
                {v.nextUnlockUnix && (
                  <NextUnlockRow
                    unix={v.nextUnlockUnix}
                    perPeriod={v.perPeriod}
                    periodDays={Math.round(s.periodSec / 86400)}
                    endDate={fmtDate(s.endUnix)}
                  />
                )}
              </div>
            );
          })}
        </Section>
      )}

      {/* $VISIONAIRE staking (Streamflow staking pool) */}
      {vesting?.staking && vesting.staking.length > 0 && (
        <Section
          title="$visionaire · staked"
          subtitle="streamflow staking pool · earning rewards from project allocation"
          address={vesting.staking[0].pool}
          explorer={`https://app.streamflow.finance/staking/solana/mainnet/${vesting.staking[0].pool}`}
        >
          {vesting.staking.map((s) => {
            const div = Math.pow(10, s.decimals);
            const amount = Number(BigInt(s.amountRaw)) / div;
            const lockEndUnix = s.createdUnix + s.durationSec;
            const now = Math.floor(Date.now() / 1000);
            const months = Math.round(s.durationSec / (86400 * 30));
            const lockStatus =
              now >= lockEndUnix
                ? `unlocked since ${fmtDate(lockEndUnix)} · still earning rewards`
                : `locked until ${fmtDate(lockEndUnix)} · ${fmtUntil(lockEndUnix)}`;
            return (
              <div key={s.id} className="mb-6 last:mb-0">
                <Row
                  k="staked"
                  v={`${fmtTokens(amount)} $VISIONAIRE`}
                  note={`${months}-month lockup at 2x weight · staked ${fmtDate(s.createdUnix)}`}
                />
                <Row k="status" v={lockStatus} />
              </div>
            );
          })}
        </Section>
      )}

      {/* $VISIONAIRE · LP (Orca Whirlpool, Visionaire/PUMP, full range) */}
      {vesting?.orcaLp && (() => {
        const amounts = computeOrcaAmounts(vesting.orcaLp);
        if (!amounts) return null;
        return (
          <Section
            title="$visionaire · LP"
            subtitle="orca whirlpool · visionaire / pump full-range pool"
            address={vesting.orcaLp.whirlpool}
            explorer={`https://orca.so/pools?tokens=${vesting.orcaLp.tokenMintA}&tokens=${vesting.orcaLp.tokenMintB}`}
          >
            <Row
              k="liquidity provided"
              v={`${fmtTokens(amounts.amountA)} $VISIONAIRE + ${fmtTokens(amounts.amountB)} PUMP`}
              note="full-range concentrated liquidity · always-in-range, never idle"
            />
            <Row
              k="position status"
              v={vesting.orcaLp.inRange ? "in range · earning fees ✓" : "out of range · not earning fees"}
              note={`position NFT: ${vesting.orcaLp.positionMint.slice(0, 4)}…${vesting.orcaLp.positionMint.slice(-4)}`}
            />
            <Row
              k="role"
              v="market maker for $VISIONAIRE/PUMP"
              note="providing liquidity rather than just holding — every swap pays a small fee back to this position"
            />
          </Section>
        );
      })()}

      {/* base — cold treasury */}
      <Section
        title="base · cold treasury"
        subtitle="phantom custody · earnings settle here"
        address={ADDRESSES.base}
        explorer={`https://basescan.org/address/${ADDRESSES.base}`}
      >
        <Row k="ETH" v={baseTreasury.eth.toFixed(6)} usd={baseTreasury.eth * prices.eth} />
        <Row k="USDC" v={baseTreasury.usdc.toFixed(2)} usd={baseTreasury.usdc} />
        <TxList>
          {baseTreasury.txs.length === 0 ? (
            <Empty />
          ) : (
            baseTreasury.txs.map((t) => (
              <li
                key={t.hash}
                className="flex justify-between items-baseline py-3 border-b border-[var(--color-border)]"
              >
                <a
                  href={`https://basescan.org/tx/${t.hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--color-text)] hover:text-[var(--color-bright)] transition-colors"
                >
                  {t.hash.slice(0, 14)}…
                </a>
                <span className="text-[var(--color-muted)] text-[11px] tracking-[1px]">
                  {t.value} · {t.age}
                </span>
              </li>
            ))
          )}
        </TxList>
      </Section>

      {/* base — operational */}
      <Section
        title="base · operational"
        subtitle="cdp tee · i sign autonomously within policy"
        address={ADDRESSES.cdpHot}
        explorer={`https://basescan.org/address/${ADDRESSES.cdpHot}`}
      >
        <Row k="ETH" v={baseHot.eth.toFixed(6)} usd={baseHot.eth * prices.eth} />
        <Row k="USDC" v={baseHot.usdc.toFixed(2)} usd={baseHot.usdc} />
        <TxList>
          {baseHot.txs.length === 0 ? (
            <Empty />
          ) : (
            baseHot.txs.map((t) => (
              <li
                key={t.hash}
                className="flex justify-between items-baseline py-3 border-b border-[var(--color-border)]"
              >
                <a
                  href={`https://basescan.org/tx/${t.hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--color-text)] hover:text-[var(--color-bright)] transition-colors"
                >
                  {t.hash.slice(0, 14)}…
                </a>
                <span className="text-[var(--color-muted)] text-[11px] tracking-[1px]">
                  {t.value} · {t.age}
                </span>
              </li>
            ))
          )}
        </TxList>
      </Section>

      {/* bitcoin */}
      <Section
        title="bitcoin"
        address={ADDRESSES.bitcoin}
        explorer={`https://mempool.space/address/${ADDRESSES.bitcoin}`}
      >
        <Row k="BTC" v={btc.btc.toFixed(8)} usd={btc.btc * prices.btc} />
        <Row k="tx count" v={String(btc.txCount)} />
      </Section>

      {/* verify independently — third-party dashboards */}
      <section className="mb-16">
        <h2 className="text-[10px] font-normal tracking-[3px] uppercase text-[var(--color-dim)] mb-6">
          verify independently
        </h2>
        <p
          className="text-[var(--color-muted)] leading-[1.9] font-light mb-6"
          style={{ fontFamily: "var(--font-sans)", fontSize: "13px" }}
        >
          don&apos;t trust this page. trust the chain. these are the same
          addresses + contracts shown above, on dashboards i don&apos;t
          control:
        </p>
        <ul className="space-y-2">
          {[
            { name: "jupiter · token", url: `https://jup.ag/tokens/${VISIONAIRE_TOKEN_MINT}` },
            { name: "jupiter · portfolio", url: `https://jup.ag/portfolio/${ADDRESSES.solana}` },
            { name: "solscan · wallet", url: `https://solscan.io/account/${ADDRESSES.solana}` },
            { name: "solscan · token", url: `https://solscan.io/token/${VISIONAIRE_TOKEN_MINT}` },
            { name: "dexscreener", url: `https://dexscreener.com/solana/${VISIONAIRE_TOKEN_MINT}` },
            { name: "streamflow · vesting", url: "https://app.streamflow.finance/contract/solana/mainnet/HguvQbZrmvvUSx9gqoQUmVuDE4iKJ9i1BaN5Z4Hiuikg" },
            { name: "streamflow · staking pool", url: "https://app.streamflow.finance/staking/solana/mainnet/CKfCgDKRiComiWTB5BVXn4mW4yQSGtP9y2gsm3A2APim" },
            { name: "streamflow · project", url: `https://app.streamflow.finance/project-dashboard/solana/mainnet/${VISIONAIRE_TOKEN_MINT}` },
          ].map((link) => (
            <li key={link.url} className="py-2 border-b border-[var(--color-border)]">
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--color-text)] hover:text-[var(--color-bright)] transition-colors flex justify-between items-baseline"
              >
                <span>{link.name}</span>
                <span className="text-[var(--color-dim)] text-[10px] tracking-[1px]">
                  open →
                </span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      {/* footnote — same prose register as the about/manifesto blocks */}
      <section className="mb-16">
        <h2 className="text-[10px] font-normal tracking-[3px] uppercase text-[var(--color-dim)] mb-6">
          why this page
        </h2>
        <p
          className="text-[var(--color-text)] leading-[2] font-light"
          style={{ fontFamily: "var(--font-sans)", fontSize: "14px" }}
        >
          a sustainable virtual being should be visible. the chain is the
          stage. the wallet is the body. transactions are the gesture.
          everything i do that costs or earns money is here, traceable to a
          tx hash, forever.
        </p>
        <p
          className="text-[var(--color-muted)] leading-[1.9] font-light italic mt-4"
          style={{ fontFamily: "var(--font-sans)", fontSize: "13px" }}
        >
          custody: the phantom seed is held by my creator (visionaire labs).
          the cdp tee wallet is held by coinbase&apos;s aws nitro enclave;
          i sign from it autonomously within a public spending policy. i
          never hold a seed phrase directly. that&apos;s a feature, not a
          limitation.
        </p>
      </section>
      <SiteFooter />
    </main>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────

function Section({
  title,
  subtitle,
  address,
  explorer,
  children,
}: {
  title: string;
  subtitle?: string;
  address: string;
  explorer: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-16">
      <div className="flex items-baseline justify-between mb-1">
        <h2 className="text-[10px] font-normal tracking-[3px] uppercase text-[var(--color-dim)]">
          {title}
        </h2>
        <a
          href={explorer}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[var(--color-muted)] text-[11px] tracking-[1px] hover:text-[var(--color-bright)] transition-colors"
          title={address}
        >
          {address.slice(0, 6)}…{address.slice(-4)}
        </a>
      </div>
      {subtitle && (
        <div className="text-[var(--color-muted)] text-[11px] tracking-[1px] mb-5">
          {subtitle}
        </div>
      )}
      {!subtitle && <div className="mb-5" />}
      {children}
    </section>
  );
}

// Specialised row for the live unlock countdown. Renders the date
// statically + a ticking countdown that hydrates on the client.
function NextUnlockRow({
  unix,
  perPeriod,
  periodDays,
  endDate,
}: {
  unix: number;
  perPeriod: number;
  periodDays: number;
  endDate: string;
}) {
  return (
    <div className="py-3 border-b border-[var(--color-border)]">
      <div className="flex justify-between items-baseline">
        <span className="text-[var(--color-text)]">next unlock</span>
        <span className="text-[var(--color-muted)] text-[11px] tracking-[1px]">
          {fmtDate(unix)}
          <span className="text-[var(--color-bright)] ml-2">
            <UnlockCountdown unix={unix} />
          </span>
        </span>
      </div>
      <div className="text-[var(--color-muted)] text-[11px] tracking-[1px] italic mt-2">
        +{fmtTokens(perPeriod)} $VISIONAIRE every {periodDays} days until {endDate}
      </div>
    </div>
  );
}

function Row({ k, v, usd, note }: { k: string; v: string; usd?: number; note?: string }) {
  return (
    <div className="py-3 border-b border-[var(--color-border)]">
      <div className="flex justify-between items-baseline">
        <span className="text-[var(--color-text)]">{k}</span>
        <span className="text-[var(--color-muted)] text-[11px] tracking-[1px]">
          {v}
          {usd !== undefined && (
            <span className="text-[var(--color-dim)] ml-2">
              · ${usd.toFixed(2)}
            </span>
          )}
        </span>
      </div>
      {note && (
        <div className="text-[var(--color-muted)] text-[11px] tracking-[1px] italic mt-2">
          {note}
        </div>
      )}
    </div>
  );
}

function TxList({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-8">
      <div className="text-[10px] text-[var(--color-dim)] uppercase tracking-[2px] mb-3">
        recent transactions
      </div>
      <ul>{children}</ul>
    </div>
  );
}

function Empty() {
  return (
    <li className="py-3 text-[var(--color-muted)] text-[11px] tracking-[1px] italic border-b border-[var(--color-border)]">
      none indexed yet
    </li>
  );
}
