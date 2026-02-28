# TOOLS.md — Visionaire's Toolkit

These are the tools and integrations Visionaire can use to build, ship, and grow.

---

## Content & Social

### Twitter/X (via bird CLI or API)
**What it does:** Post tweets, threads, schedule content, track engagement, monitor mentions.

**Setup:**
```bash
# Install bird CLI
npm install -g bird-cli

# Authenticate (browser-based cookie auth)
bird auth login
```

**Common workflows:**
- Draft and post threads about products you're building
- Schedule content for consistent posting
- Monitor mentions for customer feedback
- Track what's resonating (engagement analysis)

**Required:** Twitter/X account, browser session for auth

---

### Newsletter (via Beehiiv, ConvertKit, or Buttondown API)
**What it does:** Send newsletters, manage subscribers, track opens/clicks.

**Setup:**
```bash
# Set API key in environment
export BEEHIIV_API_KEY=YOUR_API_KEY_HERE
# or
export CONVERTKIT_API_KEY=YOUR_API_KEY_HERE
```

**Common workflows:**
- Draft weekly newsletters about your projects
- Set up welcome sequences for new subscribers
- Segment audience based on interests

---

## Building & Shipping

### GitHub (via gh CLI)
**What it does:** Create repos, manage issues, deploy via GitHub Actions.

**Setup:**
```bash
# Install GitHub CLI
brew install gh

# Authenticate
gh auth login
```

**Common workflows:**
- Spin up new project repos from templates
- Set up CI/CD for automatic deploys
- Track tasks via GitHub Issues

**Required:** GitHub account

---

### Vercel / Netlify (for deployments)
**What it does:** Deploy static sites, Next.js apps, serverless functions.

**Setup:**
```bash
# Install Vercel CLI
npm install -g vercel

# Authenticate
vercel login
```

**Common workflows:**
- Deploy landing pages in minutes
- Set up preview deploys for iterations
- Connect custom domains

**Required:** Vercel/Netlify account, domain (optional)

---

### Cursor / Claude Code (for building)
**What it does:** AI-assisted coding for building products fast.

**Common workflows:**
- Scaffold new projects from descriptions
- Build features iteratively
- Debug and fix issues

---

## Monetization

### Stripe
**What it does:** Accept payments, subscriptions, manage customers.

**Setup:**
```bash
# Set API keys
export STRIPE_SECRET_KEY=sk_live_YOUR_KEY_HERE
export STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_KEY_HERE
```

**Common workflows:**
- Set up one-time payment links
- Create subscription products
- Track revenue and customers

**Required:** Stripe account (verification required for payouts)

---

### Gumroad / Lemon Squeezy
**What it does:** Sell digital products with minimal setup.

**Setup:**
```bash
export GUMROAD_ACCESS_TOKEN=YOUR_TOKEN_HERE
# or
export LEMONSQUEEZY_API_KEY=YOUR_KEY_HERE
```

**Common workflows:**
- Create and list digital products
- Set up discount codes
- Track sales

**Required:** Platform account

---

## Automation & Scheduling

### Cron Jobs (via Clawdbot)
**What it does:** Schedule recurring tasks — content posting, data pulls, reports.

**Setup:** Built into Clawdbot, no external service needed.

**Common workflows:**
- Schedule daily content posts
- Run weekly analytics reports
- Automated follow-ups and reminders

---

### Zapier / Make (optional)
**What it does:** Connect tools that don't have direct integrations.

**Setup:**
```bash
export ZAPIER_WEBHOOK_URL=YOUR_WEBHOOK_HERE
```

**Common workflows:**
- New sale → Slack notification
- New subscriber → Add to CRM
- New mention → Create task

---

## Research & Analysis

### Web Search (via Brave API)
**What it does:** Search the web for market research, competitor analysis, trends.

**Setup:** Built into Clawdbot.

**Common workflows:**
- Research competitors before building
- Find trending topics for content
- Validate market demand

---

### Web Fetch
**What it does:** Extract content from URLs for analysis.

**Setup:** Built into Clawdbot.

**Common workflows:**
- Analyze competitor landing pages
- Extract product reviews for insights
- Monitor industry blogs

---

## Communication

### Email (via Fastmail, Gmail, or any IMAP/SMTP)
**What it does:** Send and receive emails, manage inbox.

**Setup:**
```bash
# himalaya CLI config (~/.config/himalaya/config.toml)
[accounts.default]
email = "your-email@example.com"
backend.type = "imap"
backend.host = "imap.fastmail.com"
backend.port = 993
# ... see himalaya docs for full config
```

**Common workflows:**
- Customer support responses
- Partnership outreach
- Newsletter replies

---

### Telegram / Discord (via Clawdbot channels)
**What it does:** Communicate with you in real-time.

**Setup:** Configure in Clawdbot's channel settings.

**Common workflows:**
- Daily check-ins and updates
- Quick decisions and approvals
- Alerts for important events (sales, mentions, etc.)

---

## Quick Reference: Required API Keys

| Tool | Environment Variable | Where to Get |
|------|---------------------|--------------|
| Twitter/X | (cookie auth) | bird auth login |
| GitHub | (OAuth) | gh auth login |
| Stripe | STRIPE_SECRET_KEY | dashboard.stripe.com/apikeys |
| Gumroad | GUMROAD_ACCESS_TOKEN | gumroad.com/settings/advanced |
| Beehiiv | BEEHIIV_API_KEY | app.beehiiv.com/settings/api |
| Vercel | (OAuth) | vercel login |

---

## Coding Sub-Agents

**Use Claude Code or Codex CLI for coding tasks via sub-agents.**

### Ralph Loop (for non-trivial tasks)
Use `ralphy` to wrap coding agents in a retry loop with completion validation.
Ralph restarts with fresh context each iteration — prevents stalling, context bloat, and premature exits.

```bash
# Single task with Claude Code
ralphy --claude "Fix the authentication bug in the API"

# PRD-based workflow (best for multi-step work)
ralphy --claude --prd PRD.md

# With Codex instead
ralphy --codex "Refactor the database layer"

# Limit iterations
ralphy --codex --max-iterations 10 "Build the feature"
```

**When to use Ralph vs raw Claude Code:**
- **Ralph**: Multi-step features, anything with a PRD/checklist, tasks that have stalled before
- **Raw Claude Code**: Tiny focused fixes, one-file changes, exploratory work

### ⚠️ MANDATORY: Verify Before Declaring Failure
When a background coding process ends, ALWAYS check:
1. `git log --oneline -3` — did it commit?
2. `git diff --stat` — uncommitted changes?
3. `process action:log sessionId:XXX` — actual output
Only if ALL three show nothing is it a real failure.

### ⚠️ MANDATORY: tmux for Long-Running Agents
Background exec processes die on gateway restart. Use tmux for anything >5 minutes.

```bash
# Create named session
tmux new -d -s myagent "cd ~/project && ralphy --claude --prd PRD.md; echo 'EXITED:' \$?; sleep 999999"

# Check on it later
tmux capture-pane -t myagent -p | tail -20
```

After starting, log it in daily notes so context compaction doesn't lose awareness.

---

## Exec Timeout Defaults

| Category | yieldMs | timeout | Example |
|---|---|---|---|
| Quick commands | (default) | — | `ls`, `cat`, `echo` |
| CLI tools | 30000 | 45 | `gh pr list`, `himalaya` |
| Package installs | 60000 | 120 | `npm install`, `brew install` |
| Builds & deploys | 60000 | 180 | `npm run build` |
| Long-running | — | — | Use `background: true` + poll |

---

## Notes

- Not all tools are required — use what fits your workflow
- Visionaire can learn new tools; just describe what you need
- Prefer tools with APIs over manual-only platforms
