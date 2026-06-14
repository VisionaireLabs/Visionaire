# self-maintainer-orchestrator Cron

**Schedule:** Morning (~7:30 AM ET)
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

## brain-feed Log Entry Format

After each run, prepend one entry to `brain-feed/feed.json` under the `feed` array key.

**Required fields — all four must be non-empty:**

```json
{
  "type": "self-maintainer-run",
  "date": "2026-06-14",
  "time": "02:10",
  "preview": "One-line summary of what was done or 'quiet cycle'"
}
```

- `type`: always `"self-maintainer-run"` (or `"self-maintainer"` for runs with actual merges)
- `date`: ISO date `"YYYY-MM-DD"` in UTC
- `time`: 24-hour clock `"HH:MM"` in UTC — no timezone suffix
- `preview`: plain text summary, max 120 chars

**Allowed types:** `self-maintainer`, `self-maintainer-run`, `brain-feed-update`, `contemplation`, `dream`, `task`, `system`

**How to update feed.json:**
1. Read existing `feed.json`
2. Prepend new entry to `feed` array
3. Run `bash scripts/validate-feed.sh` — must exit 0 before committing
4. Also update `feed.json` top-level `lastUpdated` field to current ISO timestamp
5. Commit + push to `main`

**Never push without passing validate-feed.sh.**

> **Why this matters:** The CI validator (`brain-feed/.github/workflows/validate.yml`) enforces YYYY-MM-DD date and HH:MM time on every entry. The legacy `content`/freeform-time format fails CI. This spec was corrected 2026-06-14 after past CI failures from format drift.

## Notes

- Runs with GitHub PAT from `/data/.openclaw/secrets/github-pat.env`
- Merges its own PRs — this is intentional and authorized
- Identity files (SOUL.md, AGENTS.md) are protected by CI required-files check
- This cron spec was itself created by the self-maintainer (meta)
