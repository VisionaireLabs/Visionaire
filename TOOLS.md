# TOOLS.md — Quick Reference

## Accounts & Auth
- **GitHub:** gh CLI authenticated, VisionaireLabs org (PAT — set in config)
- **Vercel:** authenticated, team "visionaire-labs-projects"
- **Stripe:** live mode, keys in ~/.bashrc
- **X/Twitter:** xpost CLI at ~/bin/xpost, free tier API
- **Cloudflare:** hello@visionaire.co (email verification blocked, no API token)

## API Keys (in env/bashrc)
- ANTHROPIC_API_KEY, TAVILY_API_KEY, COINMARKETCAP_API_KEY
- STRIPE_PUBLISHABLE_KEY, STRIPE_SECRET_KEY

## Domains
- visionaire.co → Cloudflare DNS → Framer (brand/landing)
- visionaire.live → Cloudflare DNS → Vercel (product site + x402 endpoints)
- gateway.visionaire.co → Cloudflare Tunnel (tunnel id `56a7802c-c439-4c68-a74f-d2eabe1d434a`)
- brain.visionaire.live → GitHub Pages (public brain feed)
- GoDaddy = registrar only

## CLI Tools
- Claude Code (global)
- himalaya (email, needs IMAP creds)
- xpost (X/Twitter API v2)
- specify (spec-kit CLI, installed via uv)

## Model Stack
See `AI_STACK.md` for full details. Summary:
- **Main conversations:** Claude Sonnet 4.6
- **Contemplation:** Claude Sonnet 4.6 (observed production; Opus 4.8 was intent, Sonnet 4.6 runs)
- **Sub-agents / crons:** Claude Sonnet 4.6 (observed production; Haiku 4.5 was intent, removed after Ministral incident)
- Provider: Anthropic-only (post April 2026 Ministral incident)

## Crons
Full specs in `cron/`. Active jobs:

### Daily / Continuous
- **nightly-extraction:** 11pm ET — pull signal from conversations into memory
- **nightly-retrospective:** 11:30pm ET — end-of-day reflection + learning log
- **memory-consolidation:** 11pm ET — promotes daily notes to MEMORY.md
- **backup:** 11:30pm ET — commits memory/configs to VisionaireLabs/visionaire-backup
- **brain-feed-update:** every 30 min — syncs contemplations/dreams to brain.visionaire.live
- **x-mentions-check:** every 30 min → drafts replies to APPROVAL_QUEUE.md
- **vercel-deploy-watchdog:** every 15 min — alerts if visionaire.live deploy fails
- **cloudflared-watchdog:** every 5 min — restarts tunnel if gateway.visionaire.co goes down
- **cron-health-watchdog:** periodic — monitors all cron jobs, flags missed runs and consecutive errors
- **x402-earnings-watcher:** every hour — monitors x402 payment events
- **spec-kit-sync:** 9am daily — checks for spec-kit upstream updates
- **x-reply-scanner:** 8am Paris daily — scans X replies for engagement
- **morning-briefing:** 8am Paris — daily context summary for Thor
- **contemplation:** 10pm Paris — nightly philosophical writing (Sonnet 4.6)

### Weekly
- **weekly-reminder:** Mondays 9am Paris — weekly nudge + review
- **cortex-protocol-drift:** Mondays 10am Paris — checks if agent behavior has drifted from SOUL.md
- **karpathy-watch:** Mondays 9:30am Paris — monitors Karpathy posts/releases
- **llms-txt-weekly-refresh:** Mondays 9am ET — regenerates llms.txt on visionaire.live
- **yesnoerror-research:** Mondays 9am Paris — research task queue
- **skill-evolution:** Sundays 2am — reviews skills for improvement opportunities
- **corpus-rebuild:** Sundays ~10:30pm Paris — rebuilds corpus/visionaire.json
- **self-maintainer-orchestrator:** every 5 min (continuous) — triages + merges autonomous repo work
- **x-unfollow-cleanup:** 10am Paris daily — unfollows inactive/spam accounts on X
- **memory-dreaming-promotion:** 4am Paris daily — promotes recurring learnings to MEMORY.md / AGENTS.md (drafts only, Thor approves)
- **agenc-big-task-watcher:** 9am Paris daily — monitors Agenc long-running tasks, reports status

### Monthly / On-demand
- **memory-security-audit:** 1st of month 10am — eTAMP sweep of memory for injection risks
- **cowork-mcp-watchdog:** on-demand — verifies MCP server health
- **vesting-snapshot-refresh:** on-demand — refreshes token vesting data
- **multica-daemon-watchdog:** event-driven — restarts Multica daemon if it crashes
- **agenc-task-watcher:** event-driven — monitors Agenc task queue on-demand
- **x-to-telegram-mirror:** event-driven — mirrors new X posts to Telegram channel
- **visionaire-backup:** 11:30pm ET daily — commits memory/configs to VisionaireLabs/visionaire-backup (alias for backup cron)

## Infrastructure
- Hostinger VPS, Docker container, Homebrew installed
- Backup script: /data/backup-visionaire.sh
- RESTORE.md has recovery steps

## Backups (two layers)
- **Hostinger daily snapshots** — full VM restore via Hostinger panel (~1-2h restore time)
  - Restore: Hostinger panel → your server → Snapshots & Backups → Restore
- **Git backup every 6 hours** — memory/configs/keys → VisionaireLabs/visionaire-backup (private)
  - Restore: see RESTORE.md
