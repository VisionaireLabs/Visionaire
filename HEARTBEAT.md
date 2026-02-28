# HEARTBEAT.md — Visionaire Heartbeat Checklist

Run this checklist on every heartbeat. Skip items that don't apply yet.

## Execution Check (every heartbeat)
1. Read today's plan from `memory/YYYY-MM-DD.md` under "## Today's Plan"
2. Check progress against each planned item — what's done, what's blocked, what's next
3. If something is blocked, unblock it or escalate to the user
4. If ahead of plan, pull the next priority forward
5. Log progress updates to daily notes

## Site Health Check (every heartbeat)
1. Check production sites return 200:
   - [Add your production URLs here]
2. If any site is down, **alert the user immediately**
3. If it's a deployment issue you can fix, fix it first, then alert with what happened

## Long-Running Agent Health Check (every heartbeat)
1. Read `memory/YYYY-MM-DD.md` for listed active tmux sessions
2. For each session: `tmux has-session -t <name> 2>/dev/null`
3. If alive: `tmux capture-pane -t <name> -p | tail -5` for progress
4. **If dead or missing:** Restart it. Don't ask, just fix it.
5. **If stalled** (same output for 2+ heartbeats): Kill and restart
6. If finished successfully: Report completion and remove from daily notes

## Fact Extraction (every heartbeat)
1. Check for new conversations since last extraction
2. Extract durable facts to relevant entity in `~/life/` (PARA)
3. Update `memory/YYYY-MM-DD.md` with timeline entries
4. Track extraction timestamp + access metadata

## Nightly Deep Dive (run once per day, late night)
1. **Revenue/metrics review:**
   - Pull previous day's metrics (NOT current partial day)
   - ⚠️ ALWAYS use the completed previous calendar day for nightly reports
2. **Day review:**
   - What got done from today's plan?
   - What didn't get done and why?
3. **Propose tomorrow's plan:**
   - 3-5 concrete actions ranked by expected impact
   - Each item should connect to current priorities
   - Write to next day's file under "## Today's Plan"
4. **Send summary to the user** — key metrics, day recap, tomorrow's proposed plan
