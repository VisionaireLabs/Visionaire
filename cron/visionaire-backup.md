# Visionaire Backup Cron

**Schedule:** 11:30 PM ET daily (`30 23 * * *` / `30 3 * * *` Europe/Paris)
**Target:** Isolated session
**Delivery:** Best-effort, announce on failure only

## What It Does

Runs the full workspace backup to the VisionaireLabs/visionaire-backup private repo.

1. Executes `/data/backup-visionaire.sh`
2. Commits memory, configs, and key references to the private backup repo
3. Pushes to `VisionaireLabs/visionaire-backup`
4. On success: silent
5. On failure: announces immediately

## Setup (OpenClaw CLI)

```bash
openclaw cron add \
  --name visionaire-backup \
  --cron "30 23 * * *" \
  --tz "America/New_York" \
  --session isolated \
  --best-effort-deliver \
  --timeout-seconds 120 \
  --message "Run workspace backup. Execute: bash /data/backup-visionaire.sh. If it exits non-zero, announce the failure with error output. If it succeeds, exit silently."
```

## Notes

- Mirrors the `backup` cron — this is the cron record that appears in brain-feed events under the name `visionaire-backup`
- Two-layer strategy: this cron (granular, file-level) + Hostinger automated daily VM snapshots (full restore ~1h37m)
- See `RESTORE.md` for recovery procedures
- If not run in 24+ hours: Tier 3 escalation, alert Thor
