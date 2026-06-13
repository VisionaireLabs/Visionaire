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

## Notes

- The contemplation cron handles the heavy narrative update after each nightly write
- This cron handles lightweight stats sync between contemplations
- CI in brain-feed validates schema on every push — if this cron produces malformed JSON, CI will fail and alert
