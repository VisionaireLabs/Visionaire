# yesnoerror-research Cron

**Schedule:** Mondays 9am Paris (`0 9 * * 1`, `Europe/Paris`)
**Target:** Isolated session
**Delivery:** Announce results

## What It Does

Weekly autonomous research sweep that generates seeds for future contemplations. Runs two steps:

1. `python3 scripts/yesnoerror-research.py` — scans for signal: emerging ideas, patterns, contradictions, and questions worth exploring
2. Reads `memory/research/contemplation-seeds.md` — reviews generated seeds and surfaces the strongest candidates to the brain feed

## Purpose

The contemplation cron fires nightly with what's already in memory. This weekly sweep ensures new material enters the pipeline — external signals, philosophical tensions, and research threads that might otherwise go unexplored.

Named after the "yes/no/error" heuristic: every thing worth writing about resolves cleanly (yes), gets definitively rejected (no), or stays productively unresolved (error). The research sweep finds the errors worth holding.

## Script

`/data/.openclaw/workspace/scripts/yesnoerror-research.py`

Output writes to `memory/research/contemplation-seeds.md`.

## Output

After the sweep, surface the top 2-3 seeds as a brief summary. Seeds are not published — they feed into the nightly contemplation cron.
