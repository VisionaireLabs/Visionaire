# Morning Briefing Cron

**Schedule:** 8:00 AM (human's timezone) daily
**Target:** Isolated session
**Delivery:** Best-effort announce to last active channel

## What It Does

1. Reads yesterday's and today's memory files for context
2. Lists pending decisions or open items
3. Surfaces today's priorities from active projects
4. Checks if any cron jobs failed overnight
5. Delivers a concise 5-10 bullet point morning update

## Setup (OpenClaw CLI)

```bash
openclaw cron add \
  --name morning-briefing \
  --cron "0 8 * * *" \
  --tz "Europe/Paris" \
  --session isolated \
  --announce \
  --best-effort-deliver \
  --timeout-seconds 90 \
  --message "Morning briefing. Check: 1) Recent memory files for context. 2) Pending decisions. 3) Today's priorities. 4) Cron failures overnight. Keep it brief — 5-10 bullets max."
```
