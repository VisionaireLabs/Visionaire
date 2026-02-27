# Nightly Extraction Cron

**Schedule:** 11:00 PM ET daily
**Target:** Isolated session (doesn't pollute main chat)
**Delivery:** Best-effort announce to last active channel

## What It Does

1. Reviews the day's conversations from the main session
2. Extracts durable facts — relationships, decisions, status changes, milestones, preferences
3. Skips small talk and transient requests
4. Saves facts to `life/` entities using the atomic fact schema
5. Updates `memory/YYYY-MM-DD.md` with the day's timeline
6. Bumps `accessCount` and `lastAccessed` on referenced facts
7. Applies memory decay on summary rewrites (hot/warm/cold)

## Setup (OpenClaw CLI)

```bash
openclaw cron add \
  --name nightly-extraction \
  --cron "0 23 * * *" \
  --tz "America/New_York" \
  --session isolated \
  --announce \
  --best-effort-deliver \
  --timeout-seconds 180 \
  --message "Nightly memory extraction. Review today's conversations..."
```

## Key Rules
- Never delete facts — supersede with `status: superseded`
- Skip small talk, capture decisions and durable information
- If 7+ days since last summary rewrite, rewrite summary.md files with decay applied
