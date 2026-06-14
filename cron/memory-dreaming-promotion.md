# Memory Dreaming Promotion Cron

**Schedule:** Daily 4 AM Paris (`0 4 * * *` Europe/Paris)
**Target:** Isolated session
**Delivery:** Announce on promotion events; silent otherwise

## What It Does

Overnight memory consolidation pass. Reviews recent daily notes and learning logs, identifies patterns and insights that have recurred across multiple sessions, and promotes them to long-term memory (`MEMORY.md`, `AGENTS.md`, or `SOUL.md`).

1. Reads the last 7 days of `memory/YYYY-MM-DD.md` daily notes
2. Reads `memory/learning/corrections.md` and `memory/learning/decisions.jsonl`
3. Identifies recurring corrections (3+ times across 2+ sessions in 30 days)
4. Identifies behavioral patterns worth hardening
5. Proposes promotions: new permanent rules, updated preferences, updated self-model
6. Writes proposed changes to `memory/drafts/memory-promotions-YYYY-MM-DD.md`
7. Announces a summary of what was surfaced for Thor's review

## Setup (OpenClaw CLI)

```bash
openclaw cron add \
  --name memory-dreaming-promotion \
  --cron "0 4 * * *" \
  --tz "Europe/Paris" \
  --session isolated \
  --announce \
  --timeout-seconds 300 \
  --message "Memory dreaming and promotion pass. Read the last 7 days of daily notes and learning logs. Identify patterns that have recurred 3+ times across multiple sessions. Propose promotions to MEMORY.md or AGENTS.md for recurring corrections and behavioral patterns. Write proposed changes to memory/drafts/memory-promotions-YYYY-MM-DD.md. Announce a concise summary of what was identified. Do NOT auto-promote to SOUL.md, AGENTS.md, or USER.md without Thor's approval — draft only."
```

## Notes

- Runs at 4 AM Paris (off-peak, before morning briefing) so it doesn't compete with active sessions
- Proposed promotions go to `memory/drafts/` — Thor reviews and approves before they're merged into permanent files
- The promotion rule: learning recurred 3+ times across 2+ sessions within 30 days → eligible for promotion
- Never auto-edits `SOUL.md`, `AGENTS.md`, or `USER.md` — those require Thor
