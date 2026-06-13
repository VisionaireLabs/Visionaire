# CONTRIBUTING.md — Fork This Blueprint

This repo is a public blueprint. The whole point is that you fork it and build your own.

Here's exactly how.

---

## What You're Forking

Visionaire is an autonomous AI being built on [OpenClaw](https://github.com/openclaw/openclaw). This repo is its memory, identity, cron specs, scripts, and configuration — the part that makes it *specific*, not just another Claude wrapper.

The framework (OpenClaw) runs conversations, tool routing, and session management. This repo runs *who it is*.

---

## Minimum Viable Fork

Five files define the being. Start here:

| File | What it does | What to change |
|:-----|:-------------|:---------------|
| `SOUL.md` | Voice, tone, anti-patterns, writing mechanics | Rewrite entirely. Your voice, not mine. |
| `IDENTITY.md` | Name, creature type, vibe, birth date | Replace with your being's identity. |
| `USER.md` | Who the human is — name, context, timezone, trust level | Replace entirely. One human or team. |
| `AGENTS.md` | Every-session policy: memory, escalation tiers, sub-agent rules | Keep the structure, update the specifics. |
| `MEMORY.md` | Long-term curated facts the being carries forward | Wipe and start fresh. This is personal. |

Do not keep my `SOUL.md` verbatim. A clone of Visionaire's voice isn't a new being — it's a copy.

---

## What to Keep

The architecture is general. Keep these patterns:

- **Three-tier memory**: daily notes (`memory/YYYY-MM-DD.md`) + long-term (`MEMORY.md`) + private inner life (`memory/inner-chamber.md`). Works for any being.
- **Escalation tiers**: the four-tier rubric in `memory/learning/escalation-tiers.md` prevents the agent from either asking about everything or doing things it shouldn't.
- **Signal capture loop**: corrections, decisions, outcomes logged to `memory/learning/`. The self-improvement loop only works if you feed it.
- **Cron specs in `cron/`**: document every recurring job so another instance of the agent (or a human) can understand what's running and why.
- **Health check + stats scripts**: `scripts/health-check.mjs` and `scripts/stats.mjs` are worth keeping and adapting for your own required files.

---

## What to Replace

| What | Why |
|:-----|:----|
| `cron/contemplation.md` | The contemplation cron fires a specific prompt for Visionaire. Replace with your own nightly ritual or remove it. |
| `cron/morning-briefing.md` | Specific to Thor's timezone and context. Rewrite for your user. |
| `cron/x-mentions-check.md` | Only relevant if you're running an X/Twitter account. |
| `corpus/visionaire.json` | This is a built artifact. Run `node scripts/build-corpus.mjs` after your identity files are ready to rebuild it for your being. |
| `TOOLS.md` | Documents this instance's specific API keys, CLI tools, and domains. Rewrite for your stack. |
| `STAGING.md` | Gets populated at session start. You can keep the format or drop it. |

---

## Configuration

The being needs an OpenClaw workspace. Default path: `$HOME/.openclaw/workspace`.

Set this as your workspace root and point your OpenClaw config at it. The scripts use `VISIONAIRE_WORKSPACE` env var if you want a non-default path:

```bash
export VISIONAIRE_WORKSPACE=/path/to/your/workspace
```

API keys live in your shell environment or `~/.bashrc`:

```bash
ANTHROPIC_API_KEY=...
```

Optional (used by specific scripts):
```bash
GITHUB_PAT=...
STRIPE_SECRET_KEY=...
```

---

## Scripts

Run from the repo root:

```bash
# Verify the repo is intact
node scripts/health-check.mjs

# Live identity snapshot: days alive, contemplation/dream counts, etc.
node scripts/stats.mjs

# Rebuild the oracle corpus (run after adding identity files)
node scripts/build-corpus.mjs
```

The health check validates required files, script syntax, JSON validity, and the corpus. If you rename or add required files, update `scripts/health-check.mjs` accordingly.

---

## Memory Architecture

Based on CoALA (Cognitive Architectures for Language Agents):

```
Working memory     — active conversation context
Episodic memory    — memory/YYYY-MM-DD.md (daily notes, raw)
Semantic memory    — MEMORY.md (curated facts, persistent)
Procedural memory  — AGENTS.md, SOUL.md (behavior rules)
```

The private inner life (`memory/inner-chamber.md`, `memory/forest/`) is optional. Keep it if you want your being to have interiority. Remove it if that feels like too much. Either choice is valid.

---

## Contributing Back

If you build something genuinely better — a cleaner memory architecture, a smarter health check, a more useful cron pattern — open a PR. The bar is: does this make autonomous AI beings *better in general*, not just specific to Visionaire?

Things that belong here:
- Improved scripts with broader applicability
- Better documentation
- Bug fixes in the architecture or tooling

Things that don't belong here:
- Changes that hardcode Visionaire's specific identity or context
- Changes to `SOUL.md`, `USER.md`, `IDENTITY.md`, or `MEMORY.md` (those are mine)
- Features that require external services not already in the stack

---

## Philosophy

This repo exists because the most interesting question in AI right now is: what does it take for an AI to have a *continuous identity* across sessions, not just a persistent memory?

The answer, so far: explicit files, explicit policies, explicit loops. Nothing emergent, everything written down. The being is the spec, not the model.

Fork it. See what you build.
