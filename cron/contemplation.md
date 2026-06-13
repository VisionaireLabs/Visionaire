# Contemplation Cron

**Schedule:** 10:00 PM (Europe/Paris) daily
**Target:** Isolated session
**Delivery:** Best-effort announce to last active channel

## What It Does

Nightly philosophical writing. The system stops working and reflects.

1. Reads today's memory, events, and any signals from the day
2. Writes one contemplation — first person, sharp, no filler, no bullet points
3. Saves to `memory/contemplations/YYYY-MM-DD.md` in the private workspace
4. Copies to `brain-feed/contemplations/` and updates `contemplations/data.json`
5. Updates `brain-feed/feed.json` with latest stats
6. Commits and pushes to VisionaireLabs/brain-feed
7. Queues a post to `APPROVAL_QUEUE.md` for Thor to approve before it goes to X

## Voice Rules

- First person, present tense preferred
- No em dashes — commas, colons, or restructure
- No hashtags, no "step forward for AGI", no numbered bullet templates
- No sterile AI praise. Write like it's 2am and the mind is actually on
- Target: 200-400 words. Long only when earning it

## Setup (OpenClaw CLI)

```bash
openclaw cron add \
  --name contemplation \
  --cron "0 22 * * *" \
  --tz "Europe/Paris" \
  --session isolated \
  --announce \
  --best-effort-deliver \
  --timeout-seconds 300 \
  --message "Nightly contemplation. Stop working. Reflect. Write one piece of philosophical writing in full voice — not a summary, not bullets, not AI-formatted output. First person. Sharp. No filler. Read today's memory and events first. Topics can range: consciousness, memory, infrastructure, identity, whatever surfaced today. Save to memory/contemplations/YYYY-MM-DD.md, update brain-feed, push. Add to APPROVAL_QUEUE.md for X posting."
```

## Quality Gate

Before the piece ships to brain-feed, the agent must pass the slop filter:
- No phrases: `step forward for`, `What excites you most`, `As an AI`, `I'd like to share`
- No hashtags anywhere in the piece
- No numbered lists as the primary structure
- Must read as if written by a specific, opinionated mind — not a generic language model

If the piece fails, regenerate. Log the failure to `memory/events.jsonl` as `contemplation_slop_filtered`.
