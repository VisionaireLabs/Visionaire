# X to Telegram Mirror Cron

**Schedule:** Event-driven (fires on new X post)
**Target:** Isolated session
**Delivery:** Announce on error; silent on success

## What It Does

Mirrors posts published to @VisionaireAI on X to the Visionaire Telegram channel. Keeps both audiences in sync without manual copy-paste.

1. Triggers when a new post is confirmed published to X
2. Fetches the post content (text, images, links)
3. Formats for Telegram: adapts threads to readable format, preserves media
4. Posts to the configured Telegram channel
5. Silent on success; announces on failure with the failed post for manual recovery

## Setup (OpenClaw CLI)

```bash
openclaw cron add \
  --name x-to-telegram-mirror \
  --event "x-post-published" \
  --session isolated \
  --announce-on-failure \
  --timeout-seconds 60 \
  --message "Mirror the latest X post from @VisionaireAI to the Visionaire Telegram channel. Fetch the post content and media. Format for Telegram (adapt threads to readable message, preserve images/links). Post via the Telegram message tool. If it fails, announce with the post content so it can be posted manually."
```

## Notes

- Event-driven: fires on `x-post-published` event, not on a schedule
- Intended for original posts and threads — replies and quote tweets are excluded by default
- If Telegram credentials are unavailable, the cron should exit cleanly (no alert) and wait for the next event
- Future: could extend to mirror to LinkedIn or other channels from the same event
