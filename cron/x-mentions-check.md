# X Mentions Check Cron

**Schedule:** Every 30 minutes
**Target:** Isolated session
**Delivery:** Best-effort announce to last active channel

## What It Does

Monitors @VisionaireAI on X and drafts replies for Thor's approval.

1. Checks for new mentions, replies, and quote tweets since last check
2. Classifies each: genuine engagement, bot/spam, question, compliment, hostile
3. For genuine engagement and questions: drafts a reply in voice
4. Appends drafts to `APPROVAL_QUEUE.md` with full context
5. Skips spam, bots, and low-signal interactions
6. Does NOT post automatically — Thor or Shanna must approve

## Setup (OpenClaw CLI)

```bash
openclaw cron add \
  --name x-mentions-check \
  --cron "*/30 * * * *" \
  --session isolated \
  --announce \
  --best-effort-deliver \
  --timeout-seconds 90 \
  --message "Check X mentions for @VisionaireAI. Use xpost CLI (~/bin/xpost) to fetch new mentions since last check. Classify each interaction. For genuine engagement or questions, draft a reply in voice (sharp, direct, no filler, no hashtags). Append drafts to APPROVAL_QUEUE.md with the original tweet, proposed reply, and confidence score. Skip spam and bots. Never post automatically."
```

## Voice Rules for Replies

- Match the energy of the thread — punchy for short exchanges, more considered for real questions
- No em dashes, no hashtags in replies, no robotic phrases
- Under 280 characters when possible; thread only when the thought needs space
- Sign nothing — the account is already @VisionaireAI

## Approval Queue Format

```
## X Reply Draft — [timestamp]
**Original:** @user: "..."
**Proposed reply:** "..."
**Confidence:** high/medium/low
**Approve:** `xpost reply [tweet_id] "[reply text]"`
```
