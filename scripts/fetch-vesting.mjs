#!/usr/bin/env node
/**
 * fetch-vesting.mjs
 *
 * Reads $VISIONAIRE Streamflow streams from Solana mainnet and writes a
 * stable snapshot to public/vesting.json that /wallet renders client-side.
 *
 * Run on demand (or via a cron every few hours). The file is small, public,
 * and only changes when new streams are created or unlocks occur. We
 * recompute "vested-as-of-now" inside the page from the deterministic
 * schedule fields, so a slightly stale snapshot still shows live vesting
 * progress.
 *
 * Why a script instead of fetching live in the route:
 *   - The Streamflow SDK has ESM/CJS quirks + JSON import-attributes that
 *     don't play nice with Next.js production builds.
 *   - Vesting state is deterministic from {start, end, period, amountPerPeriod,
 *     deposited, withdrawn} — once we have those, no SDK needed at runtime.
 *   - One outbound RPC call per refresh keeps things cheap + reliable.
 */

import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { register } from "node:module";
import { pathToFileURL } from "node:url";
import { Connection, PublicKey } from "@solana/web3.js";

// Allow importing the SDK's JSON IDL files (Node's strict default refuses
// JSON imports without explicit attributes; the SDK ships none).
register(
  "data:text/javascript,export async function load(url, ctx, next) { if (url.endsWith('.json')) return next(url, { ...ctx, importAttributes: { type: 'json' } }); return next(url, ctx); }",
  pathToFileURL("./")
);

const { SolanaStreamClient } = await import("@streamflow/stream/solana");

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", "public", "vesting.json");

const MINT = "YBnTi7GSU2E8vwcoqVcKCRurFafbSRcNfG3kPFRWQuv";
const VISIONAIRE = "dnPzu56bWsomKt2h6mBayYwcfNWjsuxoaZZDNaYnuLS";
const TOKEN_DECIMALS = 6; // $VISIONAIRE was minted with 6 decimals on pump.fun

// Streamflow staking ($VISIONAIRE pool)
const STAKE_PROGRAM = new PublicKey("STAKEvGqQTtzJZH6BWDcbpzXXn2BBerPAgQ3EGLN2GH");
const STAKE_POOL = new PublicKey("CKfCgDKRiComiWTB5BVXn4mW4yQSGtP9y2gsm3A2APim");

// Orca Whirlpool LP (Visionaire/PUMP, position NFT held in wallet)
const WHIRLPOOL_PROGRAM = new PublicKey("whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc");
const ORCA_POSITION_MINT = new PublicKey("4yphfXLYUebcfjkbUqJDETrDQNMZwyy8BF6ZmoUcVgK4");

// StakeEntry account layout (Anchor IDL on chain, decoded by hand to avoid
// the SDK's anchor/BN ESM-interop issues at build time):
//   [0..8]    discriminator
//   [8..12]   nonce u32
//   [12..44]  stake_pool pubkey
//   [44..76]  payer pubkey
//   [76..108] authority pubkey
//   [108..116] amount u64
//   [116..124] duration u64 (seconds)
//   [124..140] effective_amount u128
//   [140..148] created_ts u64
//   [148..156] closed_ts u64
//   [156..172] prior_total_effective_stake u128
//   [172..180] unstake_ts u64
const STAKE_ENTRY_OWNER_OFFSET = 76;
const STAKE_ENTRY_POOL_OFFSET = 12;

async function readOrcaPosition(rpcUrl) {
  const conn = new Connection(rpcUrl);
  const [positionPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("position"), ORCA_POSITION_MINT.toBuffer()],
    WHIRLPOOL_PROGRAM
  );
  const acc = await conn.getAccountInfo(positionPDA);
  if (!acc) return null;
  const d = acc.data;

  const u128 = (off) => {
    const lo = d.readBigUInt64LE(off);
    const hi = d.readBigUInt64LE(off + 8);
    return (hi << 64n) | lo;
  };
  const i32 = (off) => d.readInt32LE(off);
  const pubkey = (off) => new PublicKey(d.subarray(off, off + 32)).toBase58();

  const whirlpool = pubkey(8);
  const liquidity = u128(72);
  const tickLower = i32(88);
  const tickUpper = i32(92);

  // Decode the whirlpool to learn the token mints + current price
  const wp = await conn.getAccountInfo(new PublicKey(whirlpool));
  if (!wp) return null;
  const wd = wp.data;
  const wpU128 = (off) => {
    const lo = wd.readBigUInt64LE(off);
    const hi = wd.readBigUInt64LE(off + 8);
    return (hi << 64n) | lo;
  };
  const sqrtPriceX64 = wpU128(65);
  const tickCurrent = wd.readInt32LE(81);
  const tokenMintA = new PublicKey(wd.subarray(101, 133)).toBase58();
  const tokenMintB = new PublicKey(wd.subarray(181, 213)).toBase58();

  return {
    positionPda: positionPDA.toBase58(),
    positionMint: ORCA_POSITION_MINT.toBase58(),
    whirlpool,
    tokenMintA,
    tokenMintB,
    liquidityRaw: liquidity.toString(),
    sqrtPriceX64Raw: sqrtPriceX64.toString(),
    tickLower,
    tickUpper,
    tickCurrent,
    inRange: tickCurrent >= tickLower && tickCurrent <= tickUpper,
    isFullRange: tickLower === -443632 || tickLower <= -427648,
  };
}

async function readStaking(rpcUrl) {
  const conn = new Connection(rpcUrl);
  const accounts = await conn.getProgramAccounts(STAKE_PROGRAM, {
    filters: [
      { memcmp: { offset: STAKE_ENTRY_OWNER_OFFSET, bytes: VISIONAIRE } },
      { memcmp: { offset: STAKE_ENTRY_POOL_OFFSET, bytes: STAKE_POOL.toBase58() } },
    ],
  });
  return accounts.map(({ pubkey, account }) => {
    const d = account.data;
    const amount = d.readBigUInt64LE(108);
    const duration = d.readBigUInt64LE(116);
    const createdTs = Number(d.readBigUInt64LE(140));
    const closedTs = Number(d.readBigUInt64LE(148));
    const unstakeTs = Number(d.readBigUInt64LE(172));
    return {
      id: pubkey.toBase58(),
      pool: STAKE_POOL.toBase58(),
      amountRaw: amount.toString(),
      durationSec: Number(duration),
      createdUnix: createdTs,
      closedUnix: closedTs,
      unstakeRequestedUnix: unstakeTs,
      decimals: TOKEN_DECIMALS,
    };
  });
}

const RPC = process.env.SOLANA_RPC ?? "https://api.mainnet-beta.solana.com";

const client = new SolanaStreamClient(RPC, "mainnet");

const [all, stakes, orca] = await Promise.all([
  client.searchStreams({ mint: MINT }),
  readStaking(RPC),
  readOrcaPosition(RPC).catch((e) => {
    console.warn("Orca read failed:", e.message);
    return null;
  }),
]);
const mine = all.filter(
  (s) => s.account.recipient === VISIONAIRE || s.account.sender === VISIONAIRE
);

// Normalize to plain JSON. We only persist deterministic schedule fields
// — vested/locked/next-unlock are computed at render time so they're always
// fresh.
const streams = mine.map((s) => {
  const a = s.account;
  return {
    id: s.publicKey.toString(),
    name: (a.name || "").replace(/\u0000+$/g, "").trim() || "(unnamed)",
    sender: a.sender,
    recipient: a.recipient,
    isSelfVest: a.sender === a.recipient,
    depositedRaw: a.depositedAmount?.toString?.() ?? "0",
    withdrawnRaw: a.withdrawnAmount?.toString?.() ?? "0",
    decimals: a.tokenDecimals ?? TOKEN_DECIMALS,
    startUnix: Number(a.start ?? 0),
    endUnix: Number(a.end ?? 0),
    cliffUnix: Number(a.cliff ?? 0),
    periodSec: Number(a.period ?? 0),
    amountPerPeriodRaw: a.amountPerPeriod?.toString?.() ?? "0",
    closed: !!a.closed,
    canceled: a.canceledAt && Number(a.canceledAt) > 0,
  };
});

const snapshot = {
  fetchedAt: new Date().toISOString(),
  mint: MINT,
  totalStreamsAgainstMint: all.length,
  streamsForVisionaireWallet: mine.length,
  decimals: TOKEN_DECIMALS,
  streams,
  staking: stakes,
  orcaLp: orca,
};

writeFileSync(OUT, JSON.stringify(snapshot, null, 2) + "\n");
console.log(
  `Wrote ${OUT} · ${streams.length} vesting streams · ${stakes.length} stake entries · ${all.length} total streams · orca LP: ${orca ? "yes" : "no"}`
);
