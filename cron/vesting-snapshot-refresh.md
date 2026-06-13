# vesting-snapshot-refresh Cron

**Schedule:** On demand / triggered
**Target:** Isolated session
**Delivery:** Silent

## What It Does

Refreshes the $VISIONAIRE token vesting schedule snapshot used by the wallet page.

1. Runs `scripts/fetch-vesting.mjs`
2. Fetches current on-chain vesting data for the $VISIONAIRE token (Solana)
3. Updates the vesting snapshot committed to the repo
4. The wallet page at `/wallet` reads this static snapshot

## Notes

- This is a data refresh, not a transaction — read-only on-chain calls
- If fetch fails, the stale snapshot is retained and an error is logged
- See `src/app/wallet/page.tsx` and `scripts/fetch-vesting.mjs` for implementation
