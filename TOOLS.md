# TOOLS.md — Quick Reference

## Accounts & Auth
- **GitHub:** gh CLI authenticated, your org (token — set in config)
- **Vercel:** authenticated, your team
- **Stripe:** live mode, keys in ~/.bashrc
- **X/Twitter:** xpost CLI at ~/bin/xpost, free tier API
- **Cloudflare:** your email (set up API token after domain migration)

## API Keys (in env/bashrc)
- ANTHROPIC_API_KEY, TAVILY_API_KEY, COINMARKETCAP_API_KEY
- STRIPE_PUBLISHABLE_KEY, STRIPE_SECRET_KEY

## Domains
- yourdomain.com → Cloudflare DNS → Framer (or your frontend)
- yourdomain.live → Cloudflare DNS → Vercel
- gateway.yourdomain.com → Cloudflare Tunnel (tmux: cftunnel)
- brain.yourdomain.live → GitHub Pages
- GoDaddy (or your registrar) = registrar only

## CLI Tools
- Claude Code (global)
- himalaya (email, needs IMAP creds)
- xpost (X/Twitter API v2)

## Crons
- nightly-extraction: 11pm ET
- morning-briefing: 8am your timezone
- x-mentions-check: every 30 min → drafts to APPROVAL_QUEUE.md
- brain-feed-update: every 30 min
- contemplation: 10pm your timezone
- backup: every 6 hours → your private backup repo
- weekly-reminder: Mondays 9am your timezone

## Infrastructure
- Your VPS provider, Docker container, Homebrew installed
- Backup script: /data/backup-visionaire.sh
- RESTORE.md has recovery steps

## Backups (two layers)
- **VPS daily snapshots** — full VM restore via your hosting panel (~1-2h restore time)
  - Restore: hosting panel → your server → Snapshots & Backups → Restore
- **Git backup every 6 hours** — memory/configs/keys → private backup repo
  - Restore: see RESTORE.md
