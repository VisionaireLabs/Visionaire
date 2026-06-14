#!/usr/bin/env bash
# cloudflared-watchdog.sh
# Restart the named visionaire-gateway tunnel if it's not running.
# Called by openclaw cron every 5 minutes.

set -euo pipefail

LOG=/tmp/cftunnel-named.log
NAME=visionaire-gateway
BREW_BIN=/data/linuxbrew/.linuxbrew/bin/cloudflared
CRED_DIR=/data/.cloudflared

# Ensure detached supervisor is alive (independent of agent loop)
SUPERVISOR=/data/.openclaw/workspace/scripts/cloudflared-supervisor.sh
SUPPID=/tmp/cftunnel-supervisor.pid
if [ -x "$SUPERVISOR" ]; then
  if [ ! -f "$SUPPID" ] || ! kill -0 "$(cat "$SUPPID" 2>/dev/null)" 2>/dev/null; then
    echo "[$(date -Iseconds)] supervisor missing, relaunching" >> "$LOG"
    setsid nohup "$SUPERVISOR" </dev/null >/dev/null 2>&1 &
  fi
fi

# Already running?
if pgrep -f "cloudflared.*tunnel.*run.*$NAME" > /dev/null 2>&1; then
  exit 0
fi

# Sanity check the credentials are still on disk (would mean restore-from-backup needed)
if [ ! -f "$CRED_DIR/cert.pem" ]; then
  echo "[$(date -Iseconds)] CRITICAL: $CRED_DIR/cert.pem missing — restore from backup needed" >> "$LOG"
  exit 1
fi
if [ ! -f "$CRED_DIR/config.yml" ]; then
  echo "[$(date -Iseconds)] CRITICAL: $CRED_DIR/config.yml missing — restore from backup needed" >> "$LOG"
  exit 1
fi

echo "[$(date -Iseconds)] Starting $NAME tunnel..." >> "$LOG"
nohup "$BREW_BIN" --no-autoupdate tunnel run "$NAME" >> "$LOG" 2>&1 &
sleep 5

if pgrep -f "cloudflared.*tunnel.*run.*$NAME" > /dev/null 2>&1; then
  echo "[$(date -Iseconds)] $NAME tunnel started ok" >> "$LOG"
  exit 0
else
  echo "[$(date -Iseconds)] FAILED to start $NAME tunnel — see $LOG" >> "$LOG"
  exit 1
fi
