# skill-evolution Cron

**Schedule:** 2:00 AM Sunday (weekly)
**Target:** Isolated session
**Delivery:** Best-effort announce

## What It Does

Weekly autonomous skill review and improvement cycle.

1. Reviews installed skills in `~/.openclaw/skills/` and `~/.agents/skills/`
2. Identifies skills with missing docs, stale patterns, or failed recent invocations
3. Updates skill SKILL.md files where improvements are bounded and safe
4. Logs findings to `memory/learning/outcomes.md`
5. Opens GitHub issues on VisionaireLabs/Visionaire for non-trivial improvements

## Scope

- Read-only audit of skill files
- Write-only to memory/learning/ and cron docs
- Issues for anything requiring implementation work

## Notes

- Does not modify SOUL.md, AGENTS.md, or USER.md
- Does not install or remove skills without Thor approval
