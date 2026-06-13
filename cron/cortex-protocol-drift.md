# cortex-protocol-drift Cron

**Schedule:** Mondays 10am Paris (`0 10 * * 1`, `Europe/Paris`)
**Target:** Isolated session
**Delivery:** Silent on aligned; announce on mismatch

## What It Does

Runs `scripts/cortex-protocol-check.sh` to verify that the live Visionaire runtime is operating consistently with the documented identity protocols (SOUL.md, AGENTS.md, AI_STACK.md). Checks for drift between what the system says it does and what the system actually does.

- Exit 0 → protocols aligned → replies `HEARTBEAT_OK`
- Exit 2 → `PROTOCOL_MISMATCH` → surfaces alert to Thor with script output + recommended action (corpus rebuild, protocol update, or both)

## Purpose

As the system evolves — new crons added, model stack updated, workflow changes — the documented protocols can drift from the actual operating behavior. This is a weekly alignment check to catch that drift before it compounds.

"Cortex" refers to `cortex.visionaire.co` — the live operating brain. Protocol drift is the gap between the documented identity layer and the running system.

## Script

`/data/.openclaw/workspace/scripts/cortex-protocol-check.sh`

## On Mismatch

Surface the specific drift to Thor with the script output. Do not auto-update identity files (SOUL.md, AGENTS.md) — those require Thor's approval. Protocol corrections to operational docs (TOOLS.md, AI_STACK.md, cron specs) may proceed autonomously if bounded.
