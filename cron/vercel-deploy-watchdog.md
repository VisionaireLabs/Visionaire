# vercel-deploy-watchdog Cron

**Schedule:** Every 15 minutes (`*/15 * * * *`)
**Target:** Isolated session
**Delivery:** Silent on healthy; announce on failure

## What It Does

Monitors all Visionaire Vercel projects and checks that their latest production deployments are in `Ready` state. Runs `scripts/vercel-deploy-watchdog.sh` and:

- Exit 0 / no output → all deployments healthy → replies `HEARTBEAT_OK`
- Failure output → deployment is broken → surfaces alert with details and recommended action (manual trigger or rollback)

## Purpose

Vercel deployments can silently fail after a push — CI can be green while the actual deploy is stuck in `Error` or `Building`. This watchdog catches the gap between a successful git push and a live working site.

**Monitored sites:** `visionaire.live` (primary product), any other projects under the `visionaire-labs-projects` Vercel team.

## Script

`/data/.openclaw/workspace/scripts/vercel-deploy-watchdog.sh`

Uses the Vercel API (`VERCEL_TOKEN`) to list deployments per project and check the state of the latest production deployment.

## On Failure

Alert Thor immediately. Include the project name, deployment ID, error state, and the Vercel dashboard URL for that project. Do not attempt auto-redeploy without Thor's instruction.
