# Backup Cron

**Schedule:** 11:30 PM ET daily
**Target:** Isolated session
**Delivery:** Best-effort announce on failure only

## What It Does

Runs the full workspace backup to VisionaireLabs/visionaire-backup (private repo).

1. Executes `/data/backup-visionaire.sh`
2. Script commits memory, configs, and key references to the private backup repo
3. Pushes to `VisionaireLabs/visionaire-backup`
4. On success: silent (no noise)
5. On failure: announces to last active channel immediately

## Setup (OpenClaw CLI)

```bash
openclaw cron add \
  --name backup \
  --cron "30 23 * * *" \
  --tz "America/New_York" \
  --session isolated \
  --best-effort-deliver \
  --timeout-seconds 120 \
  --message "Run workspace backup. Execute: bash /data/backup-visionaire.sh. If it exits non-zero, announce the failure with the error output. If it succeeds, exit silently."
```

## What Gets Backed Up

See `/data/backup-visionaire.sh` for the exact file list. Broadly:
- `memory/` — all daily notes, learning logs, contemplations, forest entries
- `MEMORY.md`, `AGENTS.md`, `SOUL.md`, `USER.md`, `TOOLS.md`
- `/data/.openclaw/secrets/` — key references (not raw values)
- `/data/.cloudflared/` — tunnel credentials

## Two-Layer Backup Strategy

This cron is one layer. The second is Hostinger's automated daily VM snapshots.
- Git backup: granular, file-level, queryable history
- Hostinger snapshot: full VM restore, ~1h37m restore time

See RESTORE.md for full recovery procedures.

## Notes

- The backup script runs every 6 hours via this cron at night and can also be triggered manually
- If this cron hasn't run in 24+ hours, that's a Tier 3 escalation — alert Thor
