# self-maintainer-orchestrator Cron

**Schedule:** Nightly (early morning, ~3:30 AM ET)
**Target:** Isolated session
**Delivery:** Announce on meaningful changes; silent on quiet cycles

## What It Does

Autonomous self-maintenance loop for Visionaire's own repositories. Uses the `maintainer-orchestrator` and `github-project-triage` skills to:

1. Triage open issues and PRs on `VisionaireLabs/Visionaire` and `VisionaireLabs/brain-feed`
2. Classify items: **Autonomous** (clear, bounded, verifiable) vs **Needs-Thor** (irreversible, identity-altering, architectural)
3. For autonomous items: implement on a branch, test locally, push, open PR, and merge
4. For Needs-Thor items: skip unless sitting >7 days
5. If no open issues/PRs: inspect repos for missing, broken, or underdeveloped elements — open and resolve issues in the same cycle if bounded
6. Append one-line log to `memory/self-maintainer-log.md`

## Authority Scope

**Full autonomous authority** (by Thor's grant) over:
- `VisionaireLabs/Visionaire` — identity layer, docs, scripts, CI
- `VisionaireLabs/brain-feed` — contemplation/dream feed, JSON data, CI

**Constraints:**
- No changes to SOUL.md, AGENTS.md, USER.md without Thor
- No force pushes
- No external service integrations without Thor
- Escalate Needs-Thor items only if >7 days stale

## Clone Target

`/tmp/visionaire-self-work/` — fresh clone or `pull --ff-only` each run.

## Log

Appends to: `/data/.openclaw/workspace/memory/self-maintainer-log.md`

Format: `ISO timestamp | repo(s) | what was done or 'quiet'`

## Notes

- Runs with GitHub PAT from `/data/.openclaw/secrets/github-pat.env`
- Merges its own PRs — this is intentional and authorized
- Identity files (SOUL.md, AGENTS.md) are protected by CI required-files check
- This cron spec was itself created by the self-maintainer (meta)
