# corpus-rebuild Cron

> **Status: Retired**
> This cron is no longer running as a scheduled job. Corpus rebuilds are now triggered on-demand by the self-maintainer orchestrator and as part of the contemplation cron. Spec kept as historical reference.

---

**Schedule:** Weekly, post-contemplation batch (Sundays ~10:30 PM Paris) + on-demand by self-maintainer
**Target:** Isolated session
**Delivery:** Silent (no announce unless error)

## What It Does

Rebuilds `corpus/visionaire.json` from the private memory workspace:
- All contemplations in `memory/contemplations/*.md`
- Genesis texts (`memory/genesis.md`)
- Identity docs (`SOUL.md`, `AI_STACK.md`)

The corpus is the retrieval substrate for the `/api/oracle` x402 endpoint. Without fresh rebuilds, oracle answers become stale as new contemplations accumulate.

## Command

```bash
VISIONAIRE_MEMORY_DIR=/data/.openclaw/workspace/memory \
  node scripts/build-corpus.mjs
```

Expected output: `102+ docs, ~776k+ chars` (grows with each contemplation).

## When to Rebuild

| Trigger | Who | Notes |
|:--------|:----|:------|
| Weekly (Sunday night) | Cron | Keeps oracle fresh even if self-maintainer skips |
| New batch of contemplations (>10 new) | Self-maintainer | Triggered when maintainer cycle detects gap |
| Manual | Thor or Visionaire | Any session can run the command above |
| Post-deploy | CI / Vercel hook | Not yet automated — oracle cold-start pulls from committed corpus |

## Why the Corpus Gets Stale

Contemplations write to `memory/contemplations/` in the private workspace. The public repo's `corpus/visionaire.json` only updates when explicitly rebuilt and committed. A week of contemplations = ~7 new documents missing from oracle's knowledge.

The oracle endpoint uses prompt caching against the committed corpus — so freshness is a tradeoff between cache hit rate and knowledge recency. Weekly rebuild is the right balance.

## Output Location

`corpus/visionaire.json` — committed to the public repo, deployed with the app.

## Notes

- `build-corpus.mjs` uses `VISIONAIRE_MEMORY_DIR` env var (falls back to `~/.openclaw/workspace/memory`)
- Corpus is gated by CI health-check: empty corpus fails the check
- Corpus does **not** include: daily logs, forest entries, inner chamber, correction logs (private)
- Corpus **does** include: contemplations, genesis, SOUL.md, AI_STACK.md
- Self-maintainer handles corpus rebuilds when it detects `documentCount` drift > 5 vs expected

## Related

- `scripts/build-corpus.mjs` — build script
- `corpus/visionaire.json` — output artifact
- `src/app/api/oracle/` — consumer endpoint
- `cron/self-maintainer-orchestrator.md` — orchestrator that triggers ad-hoc rebuilds
