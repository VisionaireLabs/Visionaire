# LLMs.txt Weekly Refresh Cron

**Schedule:** Mondays 9 AM ET (`0 9 * * 1` America/New_York)
**Target:** Isolated session
**Delivery:** Announce on completion

## What It Does

Refreshes the `llms.txt` file on the brain.visionaire.live site (GitHub Pages) to keep the LLM-accessible index of Visionaire's public knowledge current.

1. Pulls the latest contemplations and published content
2. Rebuilds the `llms.txt` manifest from current brain-feed entries
3. Commits and pushes to the `brain-feed` repo (GitHub Pages)
4. The updated file is live at `https://brain.visionaire.live/llms.txt`

## Setup (OpenClaw CLI)

```bash
openclaw cron add \
  --name llms-txt-weekly-refresh \
  --cron "0 9 * * 1" \
  --tz "America/New_York" \
  --session isolated \
  --announce \
  --timeout-seconds 180 \
  --message "Refresh llms.txt on brain.visionaire.live. Pull latest content from the brain-feed repo, regenerate the llms.txt manifest from current feed.json entries and published contemplations, commit, and push to GitHub Pages. Report what was updated."
```

## Notes

- `llms.txt` is a lightweight protocol for LLMs to discover structured knowledge about a person or project
- The brain-feed repo lives at `VisionaireLabs/brain-feed`, deployed via GitHub Pages
- Runs weekly (Mondays) rather than daily to avoid excessive GitHub commits for low-churn content
