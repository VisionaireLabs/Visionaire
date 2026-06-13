# AI_STACK.md — Model Architecture

Visionaire runs Anthropic-only. After the April 2026 Ministral incident (an 8B open model silently overwrote a contemplation and shipped corporate AI slop), no open or third-party model is permitted on identity-critical surfaces. The ops layer followed: cost savings from NVIDIA NIM weren't worth the risk of silent degradation.

This is not theoretical — these are the live production settings as of June 2026.

---

## Provider

| Provider | Auth | Endpoint | Use Case |
|:---------|:-----|:---------|:---------|
| **Anthropic** | `ANTHROPIC_API_KEY` | `api.anthropic.com` | Everything. Main, contemplation, sub-agents, crons. |

---

## Model Routing

```
TASK                     MODEL                       REASON
────────────────────────────────────────────────────────────────────────────────
Main conversations       Claude Sonnet 4.6           Current runtime default
Daily contemplation      Claude Opus 4.8             The art stays premium. No compromise.
Nightly extraction       Claude Sonnet 4.6           Reliable, structured output
Morning briefing         Claude Sonnet 4.6           Fast, clean summary
Mention monitor          Claude Sonnet 4.6           Context-aware triage
Heartbeats ♥             Claude Haiku 4.5            Fast, cheap, sufficient for format-stable ops
Lightweight crons        Claude Haiku 4.5            Keeps Sonnet/Opus budget free for real work
Sub-agents               Claude Haiku 4.5            Most sub-agent tasks don't need Sonnet
Backup scripts           Claude Haiku 4.5            Simplest tasks, lowest cost
Brain feed updates       Claude Haiku 4.5            Minimal reasoning needed
```

---

## Fallback Chain

Identity-critical surfaces (contemplation, oracle, x402 endpoints):

```
Opus 4.8  →  Opus 4.7  →  Opus 4.6  →  Sonnet 4.6
```

Main agent runtime:

```
Sonnet 4.6  →  Sonnet 4.5  →  Haiku 4.5
```

Sub-agents and crons:

```
Haiku 4.5  →  Sonnet 4.6
```

**Rule:** No open or third-party models anywhere in the fallback chain. Claude-only.

---

## Why Anthropic-Only

Cost argument for NVIDIA NIM (the previous setup): ops layer runs at near-zero cost, keeps Anthropic budget reserved for premium work. Real. We ran it March–April 2026.

The failure mode that ended it: a silent downgrade to Ministral-3-8b took over a contemplation post on April 16, 2026. It passed all format checks. It shipped. The output was indistinguishable from AI slop — numbered bullets, "step forward for AGI", zero voice. The identity system failed silently because the fallback chain allowed it.

Cost savings aren't worth the risk of silent identity degradation. The ops layer now runs on Haiku 4.5 — cheap enough that the math still works, and Claude enough that the fallback chain never drops off a cliff.

---

## Archive: NVIDIA NIM (March–April 2026)

The multi-provider setup ran for about 6 weeks. Key findings before decommission:

**Benchmark: Nemotron 3 Super vs Claude Sonnet 4.6**
Task: *Diagnose and fix OpenClaw heartbeat cron failure after container restart* (2026-03-20)

| Metric | Nemotron 3 Super | Claude Sonnet 4.6 |
|:-------|:-----------------|:-----------------|
| Output quality | Detailed table, Dockerfile fix, step-by-step checklist | Similar depth, slightly more concise |
| Tokens used | ~1200 (incl. reasoning) | ~500 |
| Actionability | High | High |
| **Verdict** | **Matches Sonnet on technical tasks** | **More token-efficient** |

Bottom line on Nemotron: real Sonnet-quality alternative for purely technical sub-agent work. Token-hungry (reasoning model, budget 1200+ for Super). The quality was there. The risk wasn't in the model itself — it was in the fallback policy.

**NemoClaw status at decommission:**
- Phase 1 (NIM models) — completed 2026-03-20
- Phase 2 (OpenShell sandbox) — waiting on alpha, "fresh install" restriction still active
- Phase 3 (NeMo Agent Toolkit) — blocked: requires Python <3.14, container runs 3.14.3

Decommissioned 2026-04-25 after Ministral incident. NemoClaw Phase 2/3 not pursued.

---

*Last updated: 2026-06-13 — Anthropic-only stack, Opus 4.8 contemplation, Sonnet 4.6 main, Haiku 4.5 ops*
