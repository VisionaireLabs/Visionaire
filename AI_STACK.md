# AI_STACK.md — Multi-Provider Model Architecture

Visionaire runs on multiple AI providers simultaneously.
Different tasks route to different models based on quality requirements, cost, and latency.
This is not theoretical — these are the live production settings.

---

## Provider Overview

| Provider | Auth | Endpoint | Use Case |
|:---------|:-----|:---------|:---------|
| **Anthropic** | `ANTHROPIC_API_KEY` | `api.anthropic.com` | Main conversations, contemplation, complex reasoning |
| **NVIDIA NIM** | `NVIDIA_API_KEY` | `integrate.api.nvidia.com/v1` | Heartbeats, lightweight crons, sub-agents |
| **Nexos** | `NEXOS_API_KEY` | `api.nexos.ai/v1` | Fallback + alternative frontier models |

NVIDIA NIM uses an **OpenAI-compatible API** — drop-in compatible with any OpenClaw provider config.

---

## Model Routing

```
TASK                     MODEL                       PROVIDER        REASON
────────────────────────────────────────────────────────────────────────────────
Main conversations       Claude Opus 4.6             Anthropic       Highest reasoning, complex context
Daily contemplation      Claude Opus 4.6             Anthropic       The art stays premium. No compromise.
Nightly extraction       Claude Sonnet 4.6           Anthropic       Reliable, structured output
Morning briefing         Claude Sonnet 4.6           Anthropic       Fast, clean summary
Mention monitor          Claude Sonnet 4.6           Anthropic       Context-aware triage
Heartbeats ♥             Nemotron 3 Nano             NVIDIA NIM      Cheap reasoning, runs every 60min
Lightweight crons        Nemotron 3 Nano             NVIDIA NIM      Free from Anthropic billing pressure
Sub-agents (medium)      Nemotron 3 Super            NVIDIA NIM      Best open model on agentic benchmarks
Backup scripts           Claude Haiku 4.5            Anthropic       Simplest tasks, lowest cost
Brain feed updates       Claude Haiku 4.5            Anthropic       Minimal reasoning needed
```

---

## NVIDIA NIM Setup (single command)

```bash
# 1. Get API key at build.nvidia.com/settings/api-keys (free tier available)
# Get your key at build.nvidia.com/settings/api-keys
# Store in ~/.bashrc and openclaw.json env — never commit to repo
export NVIDIA_API_KEY="nvapi-..."  # store in ~/.bashrc only

# 2. Add to openclaw.json providers
# OpenClaw natively supports NVIDIA — auto-enables when NVIDIA_API_KEY is set
```

OpenClaw config (in `openclaw.json`):
```json
{
  "env": { "NVIDIA_API_KEY": "$NVIDIA_API_KEY" },  // reads from env — never hardcode
  "agents": {
    "defaults": {
      "heartbeat": { "model": "nvidia/nvidia/nemotron-3-nano-30b-a3b" },
      "models": {
        "nvidia/nvidia/nemotron-3-nano-30b-a3b": { "alias": "Nemotron 3 Nano" },
        "nvidia/nvidia/nemotron-3-super-120b-a12b": { "alias": "Nemotron 3 Super" }
      }
    }
  }
}
```

Provider entry (in `agents/main/agent/models.json`):
```json
{
  "providers": {
    "nvidia": {
      "baseUrl": "https://integrate.api.nvidia.com/v1",
      "api": "openai-completions"
    }
  }
}
```

---

## Nemotron Model Guide

| Model | Size | Best For | Token Behavior |
|:------|:-----|:---------|:---------------|
| `nvidia/nemotron-3-nano-30b-a3b` | 30B MoE (3B active) | Heartbeats, triage, lightweight ops | Reasoning model — budget 200+ tokens |
| `nvidia/nemotron-3-super-120b-a12b` | 120B MoE (12B active) | Sub-agents, code, analysis | Reasoning model — budget 1200+ tokens |
| `nvidia/nemotron-3-ultra` | TBA | Frontier tasks | H1 2026 |

**Important:** Both Nano and Super are **reasoning models** (chain-of-thought).
They burn tokens *thinking* before they answer. Always set `max_tokens` generously:
- Nano: minimum 200, recommended 400
- Super: minimum 800, recommended 1500

---

## Benchmark: Nemotron 3 Super vs Claude Sonnet 4.6

Task: *Diagnose and fix OpenClaw heartbeat cron failure after container restart*
Date: 2026-03-20

| Metric | Nemotron 3 Super | Claude Sonnet 4.6 |
|:-------|:-----------------|:-----------------|
| Output quality | ✅ Detailed table, Dockerfile fix, step-by-step checklist | ✅ Similar depth, slightly more concise |
| Structure | Markdown table + code blocks | Headers + code blocks |
| Tokens used | ~1200 (incl. reasoning) | ~500 |
| Actionability | High | High |
| **Verdict** | **Matches Sonnet quality** | **More token-efficient** |

**Bottom line:** Super is a real Sonnet alternative for technical tasks.
Use it for sub-agents where you want to reduce Anthropic spend.
Not worth it for simple yes/no heartbeat ops — use Nano there.

---

## NemoClaw Roadmap

NemoClaw is NVIDIA's enterprise wrapper for OpenClaw — announced at GTC 2026, March 16.
It adds OpenShell sandbox security (policy-based YAML controls per agent).

```
Phase 1 — NVIDIA NIM models          ✅ DONE (2026-03-20)
  └── Nemotron Nano → heartbeats
  └── Nemotron Super → sub-agents
  └── NIM API key active

Phase 2 — OpenShell sandbox          ⏳ WAITING (alpha, "fresh install" restriction)
  └── Per-agent YAML security policy
  └── Network isolation per claw
  └── Watch: github.com/NVIDIA/NemoClaw for release

Phase 3 — NeMo Agent Toolkit         ⏳ BLOCKED (requires Python <3.14, we have 3.14.3)
  └── Full observability + cost tracking
  └── LangSmith integration
  └── FastMCP workflow publishing
  └── Watch: github.com/NVIDIA/NeMo-Agent-Toolkit
```

Watcher cron (`scripts/nemoclaw-release-watch.sh`) runs every 6h and notifies when Phase 2 unblocks.

---

## Cost Model

Running NVIDIA NIM for the ops layer vs all-Anthropic:

```
Heartbeats (every 60min = 720/month):
  Before: Sonnet 4.6 @ ~100 tokens/call = 72K tokens/mo → ~$1.08/mo
  After:  Nemotron Nano @ NVIDIA NIM pricing → less

The real win isn't the direct cost — it's keeping Anthropic spend
reserved for work that actually needs Opus/Sonnet quality.
Ops layer runs free from the premium model budget.
```

---

*Last updated: 2026-03-20 — added after GTC 2026 NemoClaw announcement*
