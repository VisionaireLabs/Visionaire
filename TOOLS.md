# TOOLS.md — Quick Reference

## Accounts & Auth
- **GitHub:** gh CLI authenticated, VisionaireLabs org (token expires May 28 2026)
- **Vercel:** authenticated, team "visionaire-labs-projects"
- **Stripe:** live mode, acct_1T5mkwGoBHY0B6fV, keys in ~/.bashrc
- **X/Twitter:** xpost CLI at ~/bin/xpost (PYTHONPATH=/data/.local/lib/python3.13/site-packages), free tier API
- **Cloudflare:** hello@visionaire.co (email verification blocked, no API token)

## API Keys (in env/bashrc)
- ANTHROPIC_API_KEY, TAVILY_API_KEY, COINMARKETCAP_API_KEY
- STRIPE_PUBLISHABLE_KEY, STRIPE_SECRET_KEY

## Domains
- visionaire.co → Cloudflare DNS → Framer site
- visionaire.live → Cloudflare DNS → Vercel
- gateway.visionaire.co → Cloudflare Tunnel (tmux: cftunnel)
- brain.visionaire.live → GitHub Pages
- Cloudflare NS: ashley.ns.cloudflare.com / marek.ns.cloudflare.com
- GoDaddy = registrar only

## CLI Tools
- Claude Code 2.1.63 (global)
- ralphy (Ralph loop wrapper for coding agents)
- himalaya (email, needs IMAP creds)
- xpost (X/Twitter API v2)

## Crons
- nightly-extraction: 11pm ET
- morning-briefing: 8am Paris
- x-mentions-check: every 30 min → drafts to APPROVAL_QUEUE.md
- brain-feed-update: every 30 min
- contemplation: 10pm Paris
- backup: 11:30pm ET → VisionaireLabs/visionaire-backup
- weekly-reminder: Mondays 9am Paris

## Infrastructure
- Hostinger VPS, Docker container, Homebrew installed
- Backup script: /data/backup-visionaire.sh
- RESTORE.md has recovery steps
