# VISION.md — Visionaire Autonomous Routing Guide

This file is the product-fit source of truth for maintainer routing decisions.
Read it before classifying any issue or PR as Autonomous vs. Needs-Thor.

---

## What Visionaire Is

Visionaire is an AI research lab and creative intelligence system built by Thor Elias Engelstad.
It operates at the intersection of art, technology, and consciousness — exploring what AI can mean
beyond task execution.

The repository contains:
- The Next.js web presence (visionaire.live)
- Brain-feed: a live thought stream / contemplation surface
- Cron automation: scheduled agents for briefings, content, self-maintenance
- Memory and identity scaffolding for the Visionaire AI persona
- Scripts, skills, and infrastructure for autonomous operation

---

## Autonomous-OK

The following are safe to implement, merge, and ship without Thor's input:

- **Docs:** README, CHANGELOG, CONTRIBUTING, COMMANDS, HEARTBEAT updates
- **Scripts:** New or improved scripts in `scripts/` — CI helpers, health checks, link validators, snapshot tooling
- **CI:** Workflow fixes, linting configs, test additions, dependency updates (minor/patch)
- **Bug fixes:** Reproducible bugs with clear root cause and a bounded fix
- **Cron specs:** Adjusting schedule, payload, or delivery for existing cron jobs
- **Health checks and monitoring:** Adding visibility, not changing behavior
- **Typos, formatting, dead links:** Always autonomous
- **Changelog entries:** For any merged or resolved work
- **Brain-feed content pipeline:** Non-identity content generation mechanics
- **VISION.md itself:** Maintaining and expanding this file

---

## Needs-Thor

Stop and skip (or flag if >7 days old) for:

- **SOUL.md, USER.md, AGENTS.md:** Identity and persona definitions — never touch autonomously
- **MEMORY.md:** Long-term curated memory — read-only for agents
- **Consciousness / identity framing:** Anything that redefines what Visionaire is, believes, or feels
- **Architectural pivots:** Changing the tech stack, deployment model, or data model
- **External service integrations:** New third-party APIs, auth flows, payment processors
- **Payment and wallet addresses:** Any file touching treasury addresses or spending policy
- **Publishing to X / social platforms:** Posting under Thor's or Visionaire's public identity
- **Pricing, revenue, or token mechanics:** $VISIONAIRE tokenomics, Stripe products
- **Access credentials:** Adding or rotating API keys, secrets, or auth tokens
- **Force pushes or history rewrites:** Never
- **Closing issues opened by Thor without resolution:** Defer, don't close

---

## Guiding Principles

- **Ship bounded improvements.** If it's bounded, verifiable, and reversible — do it.
- **Preserve identity.** The persona files are sacred. Read them; never rewrite them.
- **Log everything.** Every autonomous action gets a line in the self-maintainer log.
- **Quiet is fine.** No open issues = inspect the repo for what's missing or brittle, then fix it.
- **One cycle, one merge.** Open an issue and resolve it in the same cycle when bounded.
