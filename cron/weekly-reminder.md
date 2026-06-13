# Weekly Reminder Cron

**Schedule:** Mondays, 9:00 AM (Europe/Paris)
**Target:** Isolated session
**Delivery:** Best-effort announce to last active channel

## What It Does

Monday priority review. Surfaces what matters for the week ahead.

1. Reviews `MEMORY.md` for ongoing projects and open threads
2. Reads the past week's daily notes for context on what happened
3. Identifies: stalled items, decisions deferred, promises made
4. Surfaces: what should move this week, what's blocking it
5. Delivers a concise Monday briefing — priorities, not a status dump

## Setup (OpenClaw CLI)

```bash
openclaw cron add \
  --name weekly-reminder \
  --cron "0 9 * * 1" \
  --tz "Europe/Paris" \
  --session isolated \
  --announce \
  --best-effort-deliver \
  --timeout-seconds 120 \
  --message "Monday weekly review. Read MEMORY.md and the past 7 days of daily notes in memory/. Surface: 1) What was supposed to happen last week that didn't. 2) Decisions that were deferred and are now stale. 3) 3-5 concrete priorities for this week, ranked by impact. Keep it tight — this is a Monday morning context drop, not a retrospective."
```

## Output Format

```
**Week of [date]**

Carried over from last week:
- [item] — [why it stalled or why it still matters]

This week:
1. [priority] — [one sentence on why now]
2. ...

Decisions pending:
- [item] — deferred [N] days, needs: [what]
```
