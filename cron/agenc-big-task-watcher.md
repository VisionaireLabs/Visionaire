# Agenc Big Task Watcher Cron

**Schedule:** Daily 9 AM Paris (`0 9 * * *` Europe/Paris)
**Target:** Isolated session
**Delivery:** Announce on completion

## What It Does

Daily sweep of long-running Agenc tasks. Checks for tasks that have been running overnight or across multiple cycles and surfaces status to Thor.

1. Queries the Agenc task queue for tasks older than 6 hours
2. Classifies each: still running (expected), stalled, failed, or completed but not cleaned up
3. For stalled tasks: attempts recovery or surfaces for Thor's decision
4. For cleanly completed tasks: logs outcome, archives task record
5. Announces a morning summary of long-running task health

## Setup (OpenClaw CLI)

```bash
openclaw cron add \
  --name agenc-big-task-watcher \
  --cron "0 9 * * *" \
  --tz "Europe/Paris" \
  --session isolated \
  --announce \
  --timeout-seconds 180 \
  --message "Morning sweep of long-running Agenc tasks. Check for tasks older than 6 hours. Classify each as still running, stalled, failed, or completed. Attempt recovery for stalled tasks. Log outcomes. Announce a concise morning summary of task health including any items that need Thor's attention."
```

## Notes

- Companion to `agenc-task-watcher` — that one is event-driven; this is the daily morning sweep
- Scheduled for 9 AM Paris to arrive in the morning briefing window
- Escalation: if more than 2 tasks are stalled simultaneously, escalate Tier 3
