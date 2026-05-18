#!/usr/bin/env bash
# cron-health-watchdog.sh
#
# Detect OpenClaw crons that are enabled but stalled (next-fire timestamp
# slipped into the past and the scheduler never recomputed it).
#
# Real-world incident driving this: 2026-05-18 audit found two crons in
# this state simultaneously:
#   - visionaire-backup: silent for 9 days, next-fire stuck 9d ago
#   - contemplation:     silent for 9 days, next-fire stuck 9d ago
# Both showed "enabled: yes" the entire time. No alerts. Cause: OpenClaw
# runtime restart at some point lost the next-fire calc and never
# recomputed on resume.
#
# Strategy:
#   1. Parse `openclaw cron list`.
#   2. For each row, extract the "next" column (5th field in the table).
#   3. If it says "Xm ago" / "Xh ago" / "Xd ago" beyond TOLERANCE, flag.
#      A normal "Xd/Xh ago" in "last" is fine — that's just history.
#   4. Try to recompute via disable + enable cycle (forces nextRunAtMs
#      reschedule on most OpenClaw builds).
#
# Exit codes:
#   0  all healthy, or stale crons auto-recovered
#   1  unfixable stall (surface to Thor)
#   2  openclaw CLI unavailable
#
# Logs to: /data/.openclaw/workspace/logs/cron-health.log

set -uo pipefail

LOG_DIR="/data/.openclaw/workspace/logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/cron-health.log"
TOLERANCE_MIN=15

log() { echo "[$(date -Iseconds)] $*" >> "$LOG_FILE"; }
say() { echo "$*"; log "$*"; }

if ! command -v openclaw >/dev/null 2>&1; then
  say "CRITICAL: openclaw CLI not on PATH"
  exit 2
fi

# Capture full cron list. We need stable column parsing.
LIST_OUTPUT=$(openclaw cron list 2>&1)
if [ $? -ne 0 ]; then
  say "CRITICAL: openclaw cron list failed"
  exit 2
fi

# The table columns are roughly:
#   id  name  schedule(variable-wrapped)  next  last  status  session  delivery  agent  model
# "schedule" can contain spaces ("cron 0 22 * * * @ Europe/Pari..."), which
# breaks naive awk-by-field. Robust approach: locate "next" by anchored
# regex - "next" is always one of: "in Xh/Xd/Xm", "Xm ago", "Xh ago",
# "Xd ago", "-", and it's followed by "last" which is the same set.
#
# Use python for reliable parsing instead of bash regex acrobatics.

python3 <<'PYEOF' >> /tmp/cron-stale.json
import json, re, subprocess, sys
out = subprocess.run(["openclaw","cron","list"], capture_output=True, text=True)
text = out.stdout
stale = []
for line in text.splitlines():
    line = line.strip()
    if not line: continue
    # Match: <uuid> <name> <...schedule...> <next> <last> <status> ...
    m = re.match(r'^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\s+(\S+)\s+(.+?)\s+(in\s+\S+|\S+\s+ago|-)\s+(in\s+\S+|\S+\s+ago|-)\s+(ok|skipped|running|error|idle|failed)', line)
    if not m: continue
    cron_id, name, schedule, next_col, last_col, status = m.groups()
    # Stalled if "next" column is "X ago" (any unit beyond tolerance)
    nm = re.match(r'(\d+)([smhd])\s+ago', next_col)
    if not nm: continue
    n, unit = int(nm.group(1)), nm.group(2)
    minutes = {'s': n/60, 'm': n, 'h': n*60, 'd': n*1440}[unit]
    if minutes > 15:
        stale.append({"id": cron_id, "name": name, "age": next_col, "status": status})
print(json.dumps(stale))
PYEOF

STALE_JSON=$(cat /tmp/cron-stale.json 2>/dev/null | tail -1)
rm -f /tmp/cron-stale.json

if [ -z "$STALE_JSON" ] || [ "$STALE_JSON" = "[]" ]; then
  log "OK: no stale crons"
  exit 0
fi

STALE_COUNT=$(echo "$STALE_JSON" | python3 -c "import json,sys; print(len(json.load(sys.stdin)))")
say "STALE: $STALE_COUNT cron(s) with next-fire in the past"

FIXED=0
FAILED=0
while IFS=$'\t' read -r id name age status; do
  [ -z "$id" ] && continue
  say "  - $name ($id) next-fire stuck at '$age' (status: $status)"
  # disable then enable to force nextRunAtMs recompute
  if openclaw cron disable --id "$id" >/dev/null 2>&1 \
     && openclaw cron enable --id "$id" >/dev/null 2>&1; then
    say "    recovered via disable+enable"
    FIXED=$((FIXED+1))
  else
    say "    CRITICAL: disable+enable cycle failed for $name"
    FAILED=$((FAILED+1))
  fi
done < <(echo "$STALE_JSON" | python3 -c "
import json, sys
for c in json.load(sys.stdin):
    print(f\"{c['id']}\t{c['name']}\t{c['age']}\t{c['status']}\")
")

if [ "$FAILED" -gt 0 ]; then
  say "CRITICAL: $FAILED cron(s) could not be auto-recovered"
  exit 1
fi
say "OK: $FIXED cron(s) recovered"
exit 0
