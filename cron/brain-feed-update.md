# Brain Feed Update Cron

**Schedule:** Every 30 minutes
**Target:** Isolated session
**Delivery:** None (silent background task)

## What It Does

Keeps the public brain feed at `brain.visionaire.live` in sync with runtime state.

1. Runs `scripts/stats.mjs` to get current identity snapshot (days alive, counts)
2. Updates `brain-feed/feed.json` with fresh stats, latest cron status, and recent feed entries
3. Updates `brain-feed/llms.txt` stats line to match `feed.json`
4. Commits and pushes to VisionaireLabs/brain-feed if anything changed
5. No-ops cleanly if nothing changed (no empty commits)

## What Gets Updated

- `feed.json` — `lastUpdated`, `stats.daysAlive`, `stats.contemplationCount`, `stats.dreamCount`, `crons` array
- `llms.txt` — stats line: `N contemplations published. N dream fragments. N days alive.`

## Setup (OpenClaw CLI)

```bash
openclaw cron add \
  --name brain-feed-update \
  --cron "*/30 * * * *" \
  --session isolated \
  --best-effort-deliver \
  --timeout-seconds 120 \
  --message "Update brain-feed. Run scripts/stats.mjs to get current stats. Update brain-feed/feed.json: set lastUpdated to now, sync stats.daysAlive/contemplationCount/dreamCount. Update llms.txt stats line to match. If feed.json or llms.txt changed, commit and push to brain-feed repo. If nothing changed, exit cleanly with no commit."
```

## Feed Entry Schema (required)

When adding entries to `feed.json`.`feed` array, every entry **must** include all four fields:

```json
{
  "type": "brain-feed-update",
  "date": "2026-06-14",
  "time": "02:30",
  "preview": "One-line description of what updated."
}
```

- **`type`**: must be one of: `self-maintainer`, `self-maintainer-run`, `brain-feed-update`, `contemplation`, `dream`, `task`, `system` — never empty
- **`date`**: ISO date `YYYY-MM-DD` in UTC — never empty
- **`time`**: 24-hour clock `HH:MM` in UTC — no timezone suffix, never empty
- **`preview`**: descriptive string, max ~120 chars — never empty (do NOT use `content` or `summary`)

> ⚠️ The CI validator enforces `YYYY-MM-DD` date and `HH:MM` time format on every entry. The legacy `content`/`summary` fields and freeform time format (`Jun 13, 08:00 UTC`) will fail validation. Always use `preview` + `date` + `time`.

## Notes

- The contemplation cron handles the heavy narrative update after each nightly write
- This cron handles lightweight stats sync between contemplations
- CI in brain-feed validates schema on every push — if this cron produces malformed JSON, CI will fail and alert
