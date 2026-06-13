# x402-earnings-watcher Cron

**Schedule:** Every hour (`everyMs: 3600000`)
**Target:** Isolated session
**Delivery:** Announce on new earnings; silent otherwise

## What It Does

Monitors the x402 service endpoints for new USDC earnings. Runs `python3 scripts/x402-earnings-watcher.py` and:

- New transactions detected → reports earnings to brain feed, logs to `memory/events.jsonl`
- No new transactions → replies `HEARTBEAT_OK` silently

## Purpose

The x402 stack exposes paid AI endpoints (`/contemplate`, `/forest`, `/oracle`, `/portrait`) that accept USDC micropayments. This watcher closes the feedback loop: if an agent or human pays to use a Visionaire endpoint, the system should know about it promptly.

This is the financial nervous system for the agentic economy layer. Earnings confirm that the x402 infrastructure is live and being used — not just running idle.

## Script

`/data/.openclaw/workspace/scripts/x402-earnings-watcher.py`

Reads from the configured CDP wallet / Base chain. Checks for new inbound USDC transfers to the payment address since the last check.

## On New Earnings

Log to `memory/events.jsonl` with type `x402_earnings` and amount. Update brain feed. Do not auto-withdraw or move funds without Thor's instruction.
