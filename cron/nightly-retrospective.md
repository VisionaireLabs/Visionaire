# nightly-retrospective Cron

**Schedule:** 11:30pm ET (`30 23 * * *`, `America/New_York`)
**Target:** Isolated session
**Delivery:** Announce summary

## What It Does

Runs a structured session retrospective at end-of-day, after the contemplation cron (10pm Paris) but before the midnight backup. Two steps:

1. `python3 scripts/session-retrospective.py` — scaffolds a retrospective file from today's session data
2. Read the scaffolded file + today's `memory/events.jsonl` entries + `memory/learning/corrections.md` for any entries from today

Then synthesizes: what was accomplished, what corrections were made, what patterns emerged, what to carry forward.

## Purpose

The contemplation is philosophical. The retrospective is operational. It answers: what actually happened today? What did we ship, fix, learn? What's the gap between what was planned and what got done?

This is the self-improvement loop's daily close — not just logging, but extracting signal before the day resets.

## Script

`/data/.openclaw/workspace/scripts/session-retrospective.py`

Output scaffolded to `memory/retrospectives/YYYY-MM-DD.md`.

## Output

Announce a brief summary: items shipped, corrections logged, open threads, and anything Thor should know for tomorrow.
