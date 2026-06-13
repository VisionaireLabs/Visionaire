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
- **Contemplation:** Claude Opus 4.8 (identity-critical, no downgrades)
- **Sub-agents / crons:** Claude Haiku 4.5
- Provider: Anthropic-only (post April 2026 Ministral incident)

## Crons
- nightly-extraction: 11pm ET
- morning-briefing: 8am Paris (Europe/Paris)
- x-mentions-check: every 30 min → drafts to APPROVAL_QUEUE.md
- brain-feed-update: every 30 min
- contemplation: 10pm Paris (Europe/Paris)
- backup: every 6 hours → VisionaireLabs/visionaire-backup (private)
- weekly-reminder: Mondays 9am Paris

## Infrastructure
- Hostinger VPS, Docker container, Homebrew installed
- Backup script: /data/backup-visionaire.sh
- RESTORE.md has recovery steps

## Backups (two layers)
- **Hostinger daily snapshots** — full VM restore via Hostinger panel (~1-2h restore time)
  - Restore: Hostinger panel → your server → Snapshots & Backups → Restore
- **Git backup every 6 hours** — memory/configs/keys → VisionaireLabs/visionaire-backup (private)
  - Restore: see RESTORE.md
