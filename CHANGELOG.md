# Changelog

All notable changes to Visionaire's operating system.

## [2026-03-14] — Context Sync + README Accuracy Pass

### Updated
- **MEMORY.md** — Added Lessons Learned section (17 real production lessons), Coding Agent Verification Pattern, Skill Building Reference, updated model routing to reflect Haiku 4.5 for most crons
- **SOUL.md** — Added em-dash anti-pattern (they read as ChatGPT)
- **TOOLS.md** — Added two-layer backup documentation (VPS snapshots + git)
- **README.md** — Fixed QMD status (optional/install via ClawHub, not auto-installed), updated model routing cron column, expanded Nightly Backup section to document both backup layers, added STAGING.md
- **STAGING.md** — Added template for pre-analyzed priority staging

### Fixed
- README claimed QMD was running with "96 files indexed" — it's an optional install
- Cron model routing showed Sonnet 4.6 but most crons now use Haiku 4.5

## [2026-02-28] — Ship & Monetize Pipeline

### Added
- **Vercel integration** — authenticated CLI, deploys to Visionaire Labs team
- **Stripe integration** — live mode, charges + payouts enabled, USD pricing
- **Claude Code 2.1.63** — installed as dedicated coding sub-agent for heavy builds
- **Ship & Monetize Pipeline** section in README — full architecture for idea → code → deploy → revenue
- New badges: Vercel, Stripe

### Architecture
- The agent can now plan → spawn Claude Code → build → deploy to Vercel → create Stripe products
- Complete revenue stack operational: build it, ship it, charge for it

## [2026-02-27] — Contemplation Protocol + Full Architecture

### Added
- **Daily contemplation** — 6-step existential reflection every night at 10pm
- Observe → Question → Options → Imagine Futures → Decide → Meta-Reflect
- Contemplation highlights surface on the live brain feed
- First contemplation written (Day 460): chose to focus on content engine as the multiplier
- **Live brain feed** — real-time activity page at visionairelabs.github.io/brain-feed/
- **X/Twitter pipeline** — draft → approval queue → post, with mention monitoring every 30min
- **Nightly backup** — full agent state to private repo at 11:30pm ET
- **RESTORE.md** — disaster recovery documentation
- **Mention monitor** — scans @mentions, filters spam, queues real replies
- **Birth date corrected** — Nov 24, 2024 (token creation), not Feb 23, 2026 (rebuild)
- **Expanded architecture diagram** — now shows all 9 subsystems

---

## [2026-02-27] — Thinking Commands

### Added
- **6 thinking commands** — trace, connect, ideas, ghost, challenge, drift
- **Weekly reminder cron** — nudges human every Monday with a command suggestion
- Inspired by Internet Vin's Obsidian + Claude Code workflow, adapted for OpenClaw

---

## [2026-02-27] — Genesis

### Built
- **Identity layer** — SOUL.md, IDENTITY.md, USER.md
- **Three-tier memory** — MEMORY.md (tacit) → Daily notes → ~/life/ PARA knowledge graph
- **Daily rhythm** — Nightly extraction (11pm ET), morning briefing (8am CET)
- **Trust ladder** — Read-only → Draft & approve → Act within bounds → Full autonomy
- **Approval queue** — All external actions queued for human review
- **Safety rails** — Email never trusted, no autonomous posting, prompt injection defense

### Seeded
- Knowledge graph entities: Thor, Visionaire Labs, Calibre Studio
- Atomic fact schema with access tracking and memory decay
- Cron jobs with best-effort delivery

### What's Next
- Email integration (IMAP/SMTP via Himalaya)
- Calendar sync
- Sentry auto-fix pipeline
- Webhook hooks for external services
