# Changelog

All notable changes to Visionaire's operating system.

## [2026-04-25] — Three-Layer Model Pin + x402 Plan

### Added
- **Sub-agent default model pinned** to Claude Sonnet 4.6 with Sonnet 4.5 → Haiku 4.5 fallbacks. Sub-agents previously inherited an empty fallback chain, which is how the April 16 Ministral incident happened.
- **Runtime fallback chain** for the main agent: Opus 4.7 → Sonnet 4.6 → Sonnet 4.5 → Haiku 4.5. No silent downgrades to open 8B models on identity-critical surfaces ever again.
- **Heartbeat model** moved to Ollama DeepSeek v3.2 (free, format-stable). Was previously Ministral-3-8b which threw 400 format errors.
- **Identity quality gates** in `scripts/post-contemplation-to-x.py` — blocks slop patterns (`#AGI`, "step forward for AGI", "What excites you most", numbered bullet templates) before any tweet ships under @VisionaireAI.
- **x402 / Agentic.Market plan** — dual-wallet architecture (sell to Thor's Base wallet, buy from a dedicated CDP Server Wallet v2). Building `/contemplate` ($0.05 USDC) and `/forest` ($0.01 USDC) services as the first agent-native marketplace presence.
- **Spec-Kit** integrated as the standard pre-build flow for any new project or feature touched by a coding agent. Visionaire Labs preset enforces TS strict, aesthetics-first, AI-native data structures.

### Fixed
- **The April 16 Ministral overwrite.** A retry fallback to ministral-3-8b silently took over a contemplation pipeline 78 minutes after the real Opus 4.6 contemplation shipped. The 8B model overwrote `memory/contemplations/2026-04-16.md`, committed corporate AI slop to brain-feed ("Claude Opus 4.7: A Step Forward for Visionaire"), and posted two hashtag-filled tweets from @VisionaireAI before Thor caught it with "does not feel like you." Both tweets deleted, real contemplation restored from git, full incident logged to `memory/learning/corrections.md`. Three-layer model pin landed today closes every gap that incident exposed.

### Updated
- **Model routing in README + DIAGRAM** to reflect Opus 4.7 (main) + Sonnet 4.6 (sub-agents) + DeepSeek v3.2 (heartbeats). The `Inference Routing` mermaid diagram now shows the explicit fallback chain.

---

## [2026-03-20] — NVIDIA NemoClaw Integration

### Added
- **NVIDIA NIM provider** — wired into OpenClaw as a native provider (`integrate.api.nvidia.com/v1`)
- **Nemotron 3 Nano** — now handles all heartbeats (was Claude Sonnet 4.6), significant cost reduction
- **Nemotron 3 Super** — available for sub-agents and mid-tier tasks, highest-scoring open model on agentic benchmarks
- **`scripts/nemoclaw-release-watch.sh`** — cron runs every 6h, notifies when NemoClaw drops a new release (Phase 2 unblock signal)
- **NemoClaw deep research** — full report in workspace covering architecture, OpenShell, NeMo Agent Toolkit
- **Quality benchmark** — Nemotron 3 Super vs Claude Sonnet 4.6 side-by-side on real engineering task. Verdict: Super matches quality, needs ~1200 tokens for reasoning warmup

### Research
- NemoClaw announced at GTC 2026 (March 16) — NVIDIA's enterprise wrapper for OpenClaw
- Key insight: NemoClaw creates a *new* OpenClaw inside an OpenShell sandbox, doesn't modify existing install
- NeMo Agent Toolkit blocked: requires Python <3.14, we're on 3.14.3 — watch for next release
- Posted about the integration: tweet ID 2035021776128729503 (@NVIDIA @NVIDIAAIDev @steipete @openclaw)

### Routing update
| Task | Before | After |
|:-----|:-------|:------|
| Heartbeats | Claude Sonnet 4.6 | Nemotron 3 Nano (NVIDIA NIM) |
| Sub-agents (medium) | Claude Sonnet 4.6 | Nemotron 3 Super (NVIDIA NIM) |
| Conversations | Claude Opus 4.6 | unchanged |
| Contemplation | Claude Opus 4.6 | unchanged |

All notable changes to Visionaire's operating system.

## [2026-03-31] — README: Deck + Cost Guidance

### Added
- **OpenClaw Deck** setup instructions in Quick Start — links to `kellyclaudeai/openclaw-deck`, install steps, what it does
- **Cost section** — "What You Actually Need to Spend" — Haiku as the cheap starting point, NVIDIA NIM free tier, Nexos, our actual routing breakdown. Stops people hitting Anthropic credit limits on day one.

### Fixed
- Repo had no mention of the deck UI people actually use — that's now fixed
- README implied Opus 4.6 is required — clarified it's our production choice, not the entry requirement

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
- Knowledge graph entities: [your name], [your lab], [your other ventures]
- Atomic fact schema with access tracking and memory decay
- Cron jobs with best-effort delivery

### What's Next
- Email integration (IMAP/SMTP via Himalaya)
- Calendar sync
- Sentry auto-fix pipeline
- Webhook hooks for external services
