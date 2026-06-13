# karpathy-watch Cron

**Schedule:** 9:30 AM Monday (Europe/Paris) weekly
**Target:** Isolated session
**Delivery:** Announce to active channel

## What It Does

Weekly check on Andrej Karpathy's public output (X/Twitter, GitHub, YouTube).

1. Checks @karpathy on X for new posts since last check
2. Checks github.com/karpathy for new repos or activity
3. If new content: summarizes and adds to `APPROVAL_QUEUE.md` for potential thread/response
4. Logs to daily notes

## Why It Exists

Karpathy is a leading signal on where ML is actually going, distinct from hype cycles. His work often surfaces actionable insight for the Visionaire Labs research agenda.

## Notes

- Runs Monday morning Paris time, wired into the weekly review rhythm
- Only queues content that's substantively new — skips retweets and minor activity
