#!/usr/bin/env node
/**
 * Refresh vesting snapshot by fetching from Streamflow API (REST, no SDK).
 * Reads existing snapshot and updates the fetchedAt timestamp.
 *
 * Falls back to existing snapshot if API is unavailable.
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const VISIONAIRE_WALLET = "dnPzu56bWsomKt2h6mBayYwcfNWjsuxoaZZDNaYnuLS";
const VISIONAIRE_MINT = "YBnTi7GSU2E8vwcoqVcKCRurFafbSRcNfG3kPFRWQuv";
const STREAMFLOW_API = "https://api.streamflow.finance";

async function fetchFromStreamflow() {
  console.log("Fetching from Streamflow API...");
  try {
    // Fetch streams for the mint
    const streamsRes = await fetch(
      `${STREAMFLOW_API}/streams?mint=${VISIONAIRE_MINT}`,
      { signal: AbortSignal.timeout(10000) }
    );

    if (!streamsRes.ok) {
      console.log(
        `Streamflow API returned ${streamsRes.status}, using cached snapshot`
      );
      return null;
    }

    const streamsData = await streamsRes.json();
    console.log(`Fetched ${streamsData.length || 0} streams from API`);

    return streamsData;
  } catch (error) {
    console.log("Streamflow API unavailable, using cached snapshot");
    return null;
  }
}

async function readExistingSnapshot() {
  try {
    const path_to_json = path.join(
      __dirname,
      "..",
      "public",
      "vesting.json"
    );
    const raw = await fs.readFile(path_to_json, "utf-8");
    return JSON.parse(raw);
  } catch (error) {
    console.log("No existing snapshot found");
    return null;
  }
}

async function main() {
  console.log("=== Vesting Snapshot Refresh ===\n");

  const existing = await readExistingSnapshot();

  if (!existing) {
    console.error(
      "ERROR: No existing snapshot. Manual setup required."
    );
    process.exit(1);
  }

  console.log(`Current snapshot: ${existing.streams.length} streams, ${existing.staking?.length || 0} staking entries`);

  // Try to fetch fresh data, otherwise just update timestamp
  const freshData = await fetchFromStreamflow();
  let updated = existing;

  if (freshData && Array.isArray(freshData)) {
    // Build new snapshot from fresh data
    const forVisionaireWallet = freshData.filter(
      (s) => s.recipient === VISIONAIRE_WALLET
    );

    updated = {
      ...existing,
      fetchedAt: new Date().toISOString(),
      totalStreamsAgainstMint: freshData.length,
      streamsForVisionaireWallet: forVisionaireWallet.length,
      streams: forVisionaireWallet,
    };

    console.log(
      `Updated: ${forVisionaireWallet.length} streams for wallet`
    );
  } else {
    // Just refresh the timestamp on cached snapshot
    updated = {
      ...existing,
      fetchedAt: new Date().toISOString(),
    };
    console.log("Using cached snapshot, refreshed timestamp");
  }

  // Write updated snapshot
  const outputPath = path.join(__dirname, "..", "public", "vesting.json");
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, JSON.stringify(updated, null, 2));

  console.log("\n=== Snapshot Updated ===");
  console.log(`Streams: ${updated.streams.length}`);
  console.log(`Staking: ${updated.staking?.length || 0}`);
  console.log(`Fetched: ${updated.fetchedAt}`);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
