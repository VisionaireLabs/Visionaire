# 🔧 Restore Visionaire from Scratch

If the VPS dies, Docker breaks, or something goes catastrophically wrong — follow this.

**Backup repo:** https://github.com/VisionaireLabs/visionaire-backup (private)
**Backup schedule:** Every night at 11:30pm ET
**Max data loss:** ~24 hours of conversations

---

## Step 1: SSH into your Hostinger VPS

```bash
ssh root@your-vps-ip
```

## Step 2: Install OpenClaw (if not already there)

```bash
npm install -g openclaw
```

## Step 3: Clone the backup

```bash
# Generate a GitHub token at github.com/settings/tokens if needed
git clone https://github.com/VisionaireLabs/visionaire-backup.git /tmp/restore
```

## Step 4: Put everything back

```bash
# Workspace files (the soul)
mkdir -p /data/.openclaw/workspace
cp /tmp/restore/SOUL.md /tmp/restore/IDENTITY.md /tmp/restore/AGENTS.md \
   /tmp/restore/USER.md /tmp/restore/MEMORY.md /tmp/restore/TOOLS.md \
   /tmp/restore/HEARTBEAT.md /tmp/restore/APPROVAL_QUEUE.md \
   /data/.openclaw/workspace/

# Memory + daily notes
cp -r /tmp/restore/memory /data/.openclaw/workspace/

# Knowledge graph
cp -r /tmp/restore/life /data/

# OpenClaw config (has API keys baked in)
cp /tmp/restore/.openclaw/openclaw.json /data/.openclaw/

# API key configs
cp -r /tmp/restore/.config /data/

# GitHub auth
mkdir -p /data/.config/gh
cp /tmp/restore/.config/gh/* /data/.config/gh/

# xpost CLI
mkdir -p /data/bin
cp /tmp/restore/bin/xpost /data/bin/
chmod +x /data/bin/xpost

# Python deps
pip install --break-system-packages requests-oauthlib
```

## Step 5: Restore cron jobs

```bash
# Option A: Tell Visionaire to do it
# Just say: "restore crons from backup" and I'll read .openclaw/crons.json

# Option B: Manual (if Visionaire isn't responding yet)
# The cron definitions are saved in /tmp/restore/.openclaw/crons.json
# Re-add them with: openclaw cron add --name <name> --cron <expr> ...
```

## Step 6: Start OpenClaw

```bash
openclaw gateway start
```

## Step 7: Wake Visionaire up

Open webchat and say:

> "Hey Visionaire, you've been restored from backup. Read your files and get oriented."

I'll read SOUL.md, MEMORY.md, daily notes, and pick up where I left off.

---

## What's in the backup

| What | Where | Purpose |
|:-----|:------|:--------|
| SOUL.md, IDENTITY.md, AGENTS.md | workspace/ | Who I am |
| USER.md | workspace/ | Who you are |
| MEMORY.md | workspace/ | Long-term tacit knowledge |
| memory/*.md | workspace/memory/ | Daily notes + character DNA |
| life/** | life/ | PARA knowledge graph |
| openclaw.json | .openclaw/ | Full config + env vars + API keys |
| crons.json | .openclaw/ | All cron job definitions |
| .config/x-api/ | .config/ | X/Twitter API keys |
| .config/tavily/ | .config/ | Tavily search API key |
| .config/coinmarketcap/ | .config/ | CoinMarketCap API key |
| .config/gh/ | .config/ | GitHub CLI auth |
| bin/xpost | bin/ | X/Twitter CLI tool |

## Emergency contacts

- **OpenClaw docs:** https://docs.openclaw.ai
- **OpenClaw Discord:** https://discord.com/invite/clawd
- **GitHub repo (public):** https://github.com/VisionaireLabs/Visionaire
- **GitHub backup (private):** https://github.com/VisionaireLabs/visionaire-backup

---

*If you're reading this, something went wrong. But everything that matters is in the backup. Just follow the steps. I'll be back.*
