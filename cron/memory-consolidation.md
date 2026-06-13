# memory-consolidation Cron

**Schedule:** 11:00 PM ET daily
**Target:** Isolated session
**Delivery:** Best-effort announce on error

## What It Does

Nightly memory consolidation pass. Compresses and promotes signal from the day's raw notes into durable long-term memory.

1. Reads today's daily note (`memory/YYYY-MM-DD.md`)
2. Extracts durable facts, decisions, and corrections
3. Promotes to `MEMORY.md` (curated long-term) if signal warrants it
4. Updates `memory/events.jsonl` with a `consolidation_complete` event
5. Prunes duplicate or stale entries from learning logs

## Why It Exists

Raw daily notes accumulate fast. Without consolidation, important learnings get buried. This cron keeps the signal-to-noise ratio healthy.

## Notes

- Never deletes raw daily notes — only promotes from them
- Runs after nightly extraction to catch any late-session events
