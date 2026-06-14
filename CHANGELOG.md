# Changelog

All notable changes to Visionaire's operating system.

## [2026-06-14] — Fix: Add Missing scripts/validate-feed.sh Script

### Fixed
- **`scripts/validate-feed.sh` added to repo** (#88, closes #87) — Script was referenced by the `brain-feed-update` cron spec but absent from the repo. Validates `feed.json` against the schema enforced by brain-feed CI: required top-level fields (`lastUpdated`, `stats`, `feed`), per-entry `type` (allowlist), `date` (YYYY-MM-DD), `time` (HH:MM), and `preview` (non-empty). Exits 0 on valid, non-zero with a descriptive error on first violation. Useful for local pre-commit checks before pushing to brain-feed.

---

## [2026-06-14] — Fix: x_reply_scanner.py Error Handling and Env Validation

### Fixed
- **`scripts/x_reply_scanner.py` hardened with error handling, logging, and env validation** (#85, closes #84) — Replaced bare `print()` calls with structured `logging` (stderr) to keep stdout clean for cron consumers. Added startup env validation: missing X API credentials exit with a clear error before any API call. All API calls, file I/O, and JSON parsing wrapped in try/except with appropriate log levels. HTTP 429 rate-limit responses handled gracefully (log warning, skip target). `HEARTBEAT_OK` stdout signal on no-opportunity runs follows cron convention.

---

## [2026-06-14] — Fix: Add Missing x402-earnings-watcher.py Script

### Fixed
- **`scripts/x402-earnings-watcher.py` added to repo** (#83, closes #82) — Script was referenced by the `x402-earnings-watcher` cron spec but absent from the repo, causing every hourly invocation to fail silently. Script queries Base mainnet via public RPC for inbound USDC Transfer events to the x402 payee address, tracks last-checked block in `memory/x402-earnings-state.json` (idempotent on re-run), and appends earnings events to `memory/events.jsonl`.

---

## [2026-06-14] — CI: Add Python Script Syntax Validation

### Fixed
- **CI now validates `scripts/*.py` files** (#81, closes #80) — Three Python scripts (`session-retrospective.py`, `x_reply_scanner.py`, `yesnoerror-research.py`) were not covered by CI syntax checks. Added `python3 -m py_compile` step consistent with existing `.mjs`/`.js`/`.sh` validation. A syntax error in any of these scripts would have silently passed CI.

---


## [2026-06-14] — Docs: Fix Self-Maintainer Cron Spec Schedule and Delivery

### Fixed
- **`cron/self-maintainer-orchestrator.md` schedule and delivery corrected** (#78, closes #77) — Spec had wrong schedule (`Morning (~7:30 AM ET)`) and wrong delivery mode (`announce`). Actual cron runs every 5 minutes continuously (`everyMs: 300000`) with `delivery.mode = "none"` (silent background task). Misleading spec would cause any reader to misconfigure the job.

---

## [2026-06-14] — Fix: Add 6 Missing Operational Scripts

### Fixed
- **6 scripts referenced in cron specs but absent from `scripts/`** (#75) — Scripts were documented in `cron/` specs but did not exist in the repo: `cloudflared-watchdog.sh`, `cortex-protocol-check.sh`, `session-retrospective.py`, `vercel-deploy-watchdog.sh`, `x_reply_scanner.py`, `yesnoerror-research.py`. All scripts added; all parse clean; no hardcoded secrets.

---

## [2026-06-14] — Docs: Fix Architecture Diagram Model Version

### Fixed
- **`Opus 4.6` typo corrected to `Opus 4.8`** (#71) — Architecture diagram CONTEMPLATION box and the cost section opening line both had the wrong model version. Every other reference in README was already correct. Two-character fix, no behavioral change.

---

## [2026-06-14] — Docs: Fix Brain-Feed-Update Cron Entry Schema

### Fixed
- **`cron/brain-feed-update.md` schema corrected** (#70) — Cron spec documented the legacy feed entry format (`time: "Jun 13, 08:00 UTC"` freeform string, `content` field). Actual CI validator enforces strict `YYYY-MM-DD` date, `HH:MM` time, and `preview` field. Spec now matches what CI enforces, preventing recurring format violations.

---

## [2026-06-14] — Docs: Remove stale Ollama columns from model routing table

### Fixed
- **README model routing table updated to Anthropic-only** — The Smart Model Routing table still showed Ollama DeepSeek (v3.2) and Ollama Cloud columns, contradicting the "Claude only" fallback caption directly below it and AI_STACK.md (updated to Anthropic-only in June 2026 after the Ministral incident). Removed the two Ollama columns; table now reflects the actual three-tier Anthropic-only stack: Opus 4.8 / Sonnet 4.6 / Haiku 4.5.

---

## [2026-06-13] — Docs: cron-health-watchdog added to TOOLS.md

### Fixed
- **TOOLS.md cron list now includes `cron-health-watchdog`** (#64) — `cron/cron-health-watchdog.md` spec existed but the job was absent from TOOLS.md. It monitors all other crons for missed runs and consecutive errors — a meaningful infrastructure piece that belongs in the reference.

---

## [2026-06-13] — CI: Upgrade Node.js to 24

### Fixed
- **CI Node.js upgraded from 20 (EOL) to 24** (#59) — Node 20 reached end-of-life April 2026. Aligns with `brain-feed` (PR #34). All scripts verified clean under Node 24.15.0.

---

## [2026-06-13] — Site: Sitemap, CONTRIBUTING, Docs Cleanup

### Added
- **`CONTRIBUTING.md`** (#48) — Fork guide for the blueprint. Documents setup, the spec-kit workflow, identity constraints, and the self-maintainer loop so anyone building their own Visionaire instance has a clear path in.
- **`scripts/consolidate-memory.sh`** (#45) — Post-session memory consolidation script. Reads today's daily note, extracts candidate facts, deduplicates against MEMORY.md, and appends new ones with a datestamp. Referenced in README as part of the memory loop but was missing from the repo.

### Fixed
- **`/mind` page added to sitemap and `llms.txt`** (#54) — The mind page existed but wasn't indexed. Added to `src/app/sitemap.ts` and `public/llms.txt` so search engines and LLM crawlers can discover it.
- **TOOLS.md placeholders removed** (#50) — Stale NVIDIA NIM section and generic template placeholders cleaned from TOOLS.md. Reflects the actual Anthropic-only stack.

---

## [2026-06-13] — CI: Validate stats.mjs Output

### Fixed
- **CI smoke-test now validates stats.mjs JSON output** — previously the CI only checked that the script exited 0. Now captures stdout and validates required keys (`days_alive`, `contemplations`, `dreams`, `generated_at`) and sanity checks (days_alive > 0). Catches regressions in date arithmetic or schema changes silently passing CI. (PR #53)

---

## [2026-06-13] — Remove Stale NemoClaw Script

### Removed
- **`scripts/nemoclaw-release-watch.sh`** (#51) — NemoClaw (NVIDIA) was decommissioned 2026-04-25 after the Ministral incident. The release-watcher script had no active cron, no caller, and referred to a project that no longer exists in the roadmap. Dead code removed.

---

## [2026-06-13] — Continued Housekeeping: Stack Docs, Cron Specs, Memory, CI

### Added
- **`cron/` specs completed** (#32, #33) — 5 missing cron job specs added: `contemplation.md`, `brain-feed-update.md`, `x-mentions-check.md`, `backup.md`, `weekly-reminder.md`. All 7 active crons now have documentation alongside the existing `morning-briefing.md` and `nightly-extraction.md`.
- **CI required-files expanded** (#30) — `AI_STACK.md` and `CHANGELOG.md` added to the required-files check in both CI workflow and health-check. Docs that describe the identity layer are now protected by the same gate as core config files.

### Fixed
- **MEMORY.md template placeholders resolved** (#31) — MEMORY.md still had generic `[your name]` / `[your lab]` placeholders from its initial scaffold. Replaced with actual Visionaire-specific content.
- **Brain-feed URLs corrected** (#25) — Stale references to old GitHub Pages URLs updated to canonical `brain.visionaire.live` throughout README and docs.
- **`stats.mjs` reads from private workspace** (#26) — Daily notes and knowledge entry counts now read from `$VISIONAIRE_WORKSPACE` (the private runtime), not the public repo. Stats report accurately against real operational data.
- **`health-check.mjs` + CI validate brain-feed JSON** (#28) — Added brain-feed JSON file validation (feed.json, contemplations/data.json, dreams/data.json) to both the health-check script and the CI stats smoke test.

### Docs
- **AI_STACK.md updated to Anthropic-only** (#23) — Removed legacy references to OpenAI and other providers. Stack is Claude Opus 4.8 (identity) / Claude Sonnet 4.6 (operations) / Claude Haiku 4.5 (sub-agents). TOOLS.md updated to match.
- **README decommissioned infra removed** (#29) — Hermes Agent and NVIDIA NIM references stripped. README now describes the actual running system: OpenClaw + sub-agents, no external agent runtimes.

---

## [2026-06-13] — Self-Infrastructure: Stats, Health Check, CI, and Housekeeping

### Added
- **`scripts/stats.mjs`** — live identity snapshot: days alive, contemplation count, daily note count, knowledge/feedback entry counts. Node stdlib only, no external deps. First real mirror of self.
- **`scripts/health-check.mjs`** — repo integrity validator. Checks required files (SOUL.md, AGENTS.md, USER.md, MEMORY.md, HEARTBEAT.md, TOOLS.md), .mjs/.js script parse validity, JSON file health in `memory/`, and required directories. Exit 0 = healthy, exit 1 = problems. Designed to fail loudly, not silently degrade.
- **`.github/workflows/ci.yml`** — GitHub Actions CI. Runs on every push and PR. Validates .mjs and .js scripts, shell scripts, required files, and health-check. First CI this repo has ever had. Ships with issue #3 closed.

### Fixed
- **HEARTBEAT.md placeholders** (#13) — `[your name]` template placeholders replaced with `Thor` throughout. HEARTBEAT.md is the runtime checklist agents run every heartbeat cycle; having generic placeholders in there instead of the real name was a silent quality gap.
- **CI validates .js scripts** (#11) — original CI only checked `.mjs` files. Plain `.js` scripts in `scripts/` (e.g. `generate-llms-full.js`) were unvalidated. Both CI workflow and health-check updated to cover both extensions.
- **TOOLS.md added to required-files check** — CI required-files list was missing TOOLS.md. Health-check already caught it; CI now consistent.
- **stats.mjs contemplation count** (#19) — stats.mjs was reporting zero contemplations because it looked in the local repo's `memory/contemplations/` instead of the private workspace. Fixed to report the actual public brain-feed count from `feed.json`.

### Chore
- **`.next/` build artifacts removed from git** (#9, #10) — 350 Next.js build files (~19 MB) were tracked in git. Vercel runs its own `next build` and never uses committed artifacts. Removed from tree and added `.next/` to `.gitignore`.

---

## [2026-05-28] — Upgrade to Claude Opus 4.8

### Changed
- **Model stack upgraded to Claude Opus 4.8** (released today by Anthropic). All identity-critical surfaces updated: nightly contemplation cron, x402 API endpoints (forest, contemplate, oracle, portrait shaping), deck defaults, discovery endpoint, and all user-facing copy on visionaire.live.
- Fallback chain updated: Opus 4.8 → Opus 4.7 → Opus 4.6 → Sonnet 4.6. No downgrade path to non-Anthropic models on creative/identity surfaces.
- MEMORY.md, README, DIAGRAM, and x402-stack docs all reflect Opus 4.8 as current.

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
- Knowledge graph entities: Thor Elias Engelstad, Visionaire Labs, Calibre Studio
- Atomic fact schema with access tracking and memory decay
- Cron jobs with best-effort delivery

### What's Next
- Email integration (IMAP/SMTP via Himalaya)
- Calendar sync
- Sentry auto-fix pipeline
- Webhook hooks for external services
