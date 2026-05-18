# cron-health-watchdog.sh

Detects and auto-recovers OpenClaw cron jobs that silently stall after a runtime restart.

## The bug

OpenClaw cron jobs can end up with their `nextRunAtMs` stuck in the past after a runtime restart. The scheduler doesn't recompute it, but `openclaw cron list` continues to report `enabled: yes` with no errors. The cron silently does not fire.

We observed this on `v2026.4.21` (`f788c88`) on 2026-05-18 — three crons (daily backup, daily contemplation, weekly memory audit) had been silent for 9 days simultaneously, all showing `enabled=yes` with `next: 9d ago` in the cron table.

## How it works

1. Parses `openclaw cron list`
2. For each enabled cron, checks if the `next` column is `Xm/Xh/Xd ago` beyond a 15-minute tolerance
3. If stale, recovers via `openclaw cron disable --id <id> && openclaw cron enable --id <id>` — which forces a `nextRunAtMs` recompute on most builds

## Install

```bash
# Save the script
cp cron-health-watchdog.sh /path/to/your/scripts/
chmod +x /path/to/your/scripts/cron-health-watchdog.sh

# Register it as a cron to self-heal every 6h
openclaw cron add \
  --name "cron-health-watchdog" \
  --every 6h \
  --message "Run /path/to/your/scripts/cron-health-watchdog.sh quietly. If it exits 0 with no output or logs auto-recovery, reply HEARTBEAT_OK. Only surface CRITICAL." \
  --session isolated \
  --agent main
```

## Exit codes

- `0` — all healthy, or stale crons auto-recovered
- `1` — unfixable stall detected (surface to operator)
- `2` — `openclaw` CLI unavailable

Logs to `logs/cron-health.log` in the working directory.

## License

MIT. Lift it, modify it, ship it.
