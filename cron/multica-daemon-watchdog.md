# Multica Daemon Watchdog Cron

**Schedule:** Event-driven / manual trigger
**Target:** Isolated session
**Delivery:** Announce on failure

## What It Does

Monitors the Multica daemon process and restarts it if it has crashed or become unresponsive.

1. Checks whether the Multica daemon is running (by process name or PID file)
2. If dead: restarts it and announces the restart event
3. If alive and healthy: silent
4. If restart fails after one attempt: escalates with full error output

## Setup (OpenClaw CLI)

```bash
openclaw cron add \
  --name multica-daemon-watchdog \
  --event "multica-down" \
  --session isolated \
  --announce \
  --timeout-seconds 60 \
  --message "Check if the Multica daemon is running. If not, restart it. If it restarts successfully, announce the restart. If it fails to restart, announce the full error and escalate."
```

## Notes

- Multica is an internal service in the Visionaire Labs stack
- This is event-driven: fires when a health check or another cron detects the daemon is down
- Escalation path: Tier 2 on first failure, Tier 3 if restart fails
