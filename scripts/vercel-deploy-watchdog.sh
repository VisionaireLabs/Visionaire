#!/usr/bin/env bash
# vercel-deploy-watchdog.sh
#
# Check every Vercel project's latest PRODUCTION deployment. If it's not Ready,
# alert Thor via openclaw system event.
#
# Why this exists: on 2026-05-18 we discovered visionaire-cortex had been
# failing every deploy for ~20 days while the stale alias kept cortex.visionaire.co
# serving an old build. Surface looked healthy, source was broken.
#
# Exit codes:
#   0 = all projects Ready (or quietly broken in a way we already flagged)
#   1 = at least one project's latest production deploy is not Ready
#
# Quiet on success per heartbeat-watchdog convention.

set -euo pipefail

WORKSPACE="/data/.openclaw/workspace"
STATE_FILE="$WORKSPACE/memory/.vercel-watchdog-state.json"
COOLDOWN_HOURS=4

mkdir -p "$(dirname "$STATE_FILE")"
[ -f "$STATE_FILE" ] || echo "{}" > "$STATE_FILE"

# Get all projects under the visionaire-labs-projects team
# vercel ls returns lines like: "<age>  <project>  <url>  <status>  <env>  ..."
projects_raw=$(vercel projects ls 2>&1 | grep -E "^\s+[a-z]" | awk '{print $1}' || true)

if [ -z "$projects_raw" ]; then
  echo "CRITICAL: vercel projects ls returned no projects (auth issue?)" >&2
  exit 1
fi

failures=()
project_count=0

while IFS= read -r project; do
  [ -z "$project" ] && continue
  project_count=$((project_count + 1))

  # Get latest production deployment status. `vercel ls <project>` lists most-recent first.
  # Production deployments have Environment=Production.
  latest_prod_line=$(vercel ls "$project" 2>&1 | grep -E "Production" | head -1 || true)

  if [ -z "$latest_prod_line" ]; then
    # No prod deployment found — could be a never-deployed project. Skip.
    continue
  fi

  # Status column shows "● Ready" or "● Error" or "● Queued" etc.
  if echo "$latest_prod_line" | grep -q "● Ready"; then
    continue
  fi

  # Not Ready. Extract status word.
  status=$(echo "$latest_prod_line" | grep -oE "● [A-Za-z]+" | head -1 | sed 's/● //')
  url=$(echo "$latest_prod_line" | grep -oE "https://[^ ]+" | head -1)
  failures+=("$project|$status|$url")
done <<< "$projects_raw"

if [ ${#failures[@]} -eq 0 ]; then
  # All good
  exit 0
fi

# Build alert message
alert="Vercel deploy watchdog: ${#failures[@]} project(s) with non-Ready latest production deployment"
detail=""
for f in "${failures[@]}"; do
  IFS='|' read -r p s u <<< "$f"
  detail+="\n• $p — $s — $u"
done

# Cooldown check: same failure set within $COOLDOWN_HOURS shouldn't re-alert
fingerprint=$(printf '%s\n' "${failures[@]}" | sort | sha256sum | awk '{print $1}')
last_alerted=$(python3 -c "
import json, sys
try:
    s = json.load(open('$STATE_FILE'))
    print(s.get('$fingerprint', 0))
except Exception:
    print(0)
")
now=$(date +%s)
cooldown_seconds=$((COOLDOWN_HOURS * 3600))
elapsed=$((now - last_alerted))

if [ "$elapsed" -lt "$cooldown_seconds" ]; then
  # Same failure, still in cooldown — silent
  exit 0
fi

# Fire the alert
text="$alert$detail"
openclaw system event --text "$text" --mode now >/dev/null 2>&1 || true

# Update state
python3 -c "
import json
s = json.load(open('$STATE_FILE'))
s['$fingerprint'] = $now
# Prune old fingerprints (>7 days)
cutoff = $now - 7*86400
s = {k: v for k, v in s.items() if isinstance(v, (int, float)) and v > cutoff}
json.dump(s, open('$STATE_FILE', 'w'))
"

exit 1
