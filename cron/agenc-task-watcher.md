# Agenc Task Watcher Cron

**Schedule:** Event-driven / manual trigger
**Target:** Isolated session
**Delivery:** Announce on completion or failure

## What It Does

Monitors active Agenc (agent orchestration) tasks and surfaces stalled or failed tasks for intervention.

1. Queries the Agenc task queue for running tasks
2. Identifies tasks that have exceeded their expected runtime or entered error state
3. For stalled tasks: attempts a safe retry or escalates to Thor
4. For completed tasks: logs outcome and cleans up task state
5. Announces a summary of what was found and actioned

## Setup (OpenClaw CLI)

```bash
openclaw cron add \
  --name agenc-task-watcher \
  --event "agenc-task-update" \
  --session isolated \
  --announce \
  --timeout-seconds 120 \
  --message "Check the Agenc task queue. Identify any tasks that are stalled (running longer than expected) or in error state. For stalled tasks, attempt a safe retry. For failed tasks, log the failure and announce with context. Clean up completed tasks. Report a brief summary."
```

## Notes

- Agenc is the internal agent-orchestration layer used for multi-step background tasks
- Event-driven: fires when tasks are queued or when a heartbeat check detects anomalies
- Pairs with `agenc-big-task-watcher` — this handles short/normal tasks; the big watcher handles long-running ones
