# cron-health-watchdog Cron

**Schedule:** Periodic / triggered
**Target:** Isolated session
**Delivery:** Announce on failure

## What It Does

Meta-watchdog that monitors the health of other cron jobs.

1. Lists all registered crons and their last run status
2. Flags any cron that hasn't run within 2x its expected interval
3. Flags consecutive errors on any cron
4. Reports anomalies to Thor if warranted

## Why It Exists

If a critical cron silently stops running (contemplation, backup, brain-feed-update), that's a failure mode that should surface quickly. This cron catches it.

## Notes

- See `scripts/cron-health-watchdog.sh` for implementation
- Does not restart other crons — only monitors and reports
