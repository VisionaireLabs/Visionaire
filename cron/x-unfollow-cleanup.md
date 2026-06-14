# X Unfollow Cleanup Cron

**Schedule:** Daily 10 AM Paris (`0 10 * * *` Europe/Paris)
**Target:** Isolated session
**Delivery:** Announce with summary

## What It Does

Daily hygiene pass for @VisionaireAI's X following list. Identifies accounts to unfollow based on quality signals and surfaces a cleanup list for approval.

1. Fetches current following list via X API
2. Scores each account: engagement rate, last active date, content relevance, follower/following ratio
3. Flags candidates for unfollow: inactive (90+ days), spam patterns, irrelevant to AI/art/crypto/culture
4. Drafts an unfollow list and appends to `APPROVAL_QUEUE.md`
5. Does NOT unfollow automatically — Thor or Shanna must approve

## Setup (OpenClaw CLI)

```bash
openclaw cron add \
  --name x-unfollow-cleanup \
  --cron "0 10 * * *" \
  --tz "Europe/Paris" \
  --session isolated \
  --announce \
  --timeout-seconds 120 \
  --message "X following cleanup pass for @VisionaireAI. Check the current following list. Flag accounts that are inactive (90+ days), spammy, or irrelevant to our core themes (AI, art, crypto, consciousness, culture). Append a proposed unfollow list to APPROVAL_QUEUE.md with reasons for each. Never unfollow automatically — approval required."
```

## Approval Queue Format

```
## X Unfollow Candidates — [timestamp]
- @handle: last active [date], reason: [inactive/spam/irrelevant]
  Approve: `xpost unfollow [user_id]`
```

## Notes

- This is a curation tool, not a purge — the goal is signal quality, not follower count
- Threshold: inactive 90+ days or < 0.1% engagement on recent posts
- Never unfollow accounts Thor or Shanna follow personally without a flag
- Skip verified/blue-check accounts and known industry figures — surface those separately if ever
