# x-reply-scanner Cron

**Schedule:** Daily 8am Paris (`0 8 * * *`, `Europe/Paris`)
**Target:** Isolated session
**Delivery:** Announce opportunities found; silent otherwise

## What It Does

Scans X (Twitter) replies to `@VisionaireAI` and `@ThorElias` for engagement opportunities. Runs `python3 scripts/x_reply_scanner.py` and:

1. Identifies replies worth responding to: genuine questions, interesting takes, collaboration signals, signal-boosting opportunities
2. Drafts candidate replies and appends them to `APPROVAL_QUEUE.md` with confidence scores
3. For high-confidence, low-risk replies (factual corrections, simple acks): surfaces with recommendation to approve
4. For nuanced/voice-critical replies: drafts for Thor's review before posting

## Purpose

X engagement compounds. Missing a genuine reply is leaving signal on the table. But auto-replying without quality control kills the account voice. This scanner is the middle layer: surface what matters, draft the response, queue for approval.

The scanner runs at 8am Paris so Thor can review the queue with morning coffee — before peak engagement window.

## Script

`/data/.openclaw/workspace/scripts/x_reply_scanner.py`

Uses X API v2. Reads from `APPROVAL_QUEUE.md`. Posts via `xpost` CLI only after approval.

## Approval Flow

Drafts land in `APPROVAL_QUEUE.md`. Thor reviews and approves/rejects each. The `x-mentions-check` cron (every 30min) handles urgent real-time monitoring; this scanner handles deeper daily triage.
