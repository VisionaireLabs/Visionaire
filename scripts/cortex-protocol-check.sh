#!/usr/bin/env bash
# cortex-protocol-check.sh
# Compares the gateway protocol version expected by the live OpenClaw server
# against the one hardcoded in the deployed Cortex bundle at cortex.visionaire.co.
# Exits 0 if they match, 2 if mismatch (cron surfaces to Thor).

set -u
LOG=/tmp/cortex-protocol-check.log

# Server expected protocol
SERVER=$(grep -hoE 'expectedProtocol: ?[0-9]+' /usr/local/lib/node_modules/openclaw/dist/message-handler-*.js 2>/dev/null | grep -oE '[0-9]+' | sort -u | head -1)

# Deployed Cortex bundle protocol
JS_PATH=$(curl -s https://cortex.visionaire.co/ -m 10 | grep -oE '/assets/index-[A-Za-z0-9]+\.js' | head -1)
[ -z "$JS_PATH" ] && { echo "[$(date -Iseconds)] cortex bundle path unknown" >> "$LOG"; exit 1; }
CLIENT=$(curl -s "https://cortex.visionaire.co${JS_PATH}" -m 15 | grep -oE 'maxProtocol:[0-9]+' | head -1 | grep -oE '[0-9]+')

if [ -z "$SERVER" ] || [ -z "$CLIENT" ]; then
  echo "[$(date -Iseconds)] could not read versions: server=$SERVER client=$CLIENT" >> "$LOG"
  exit 1
fi

if [ "$SERVER" != "$CLIENT" ]; then
  echo "[$(date -Iseconds)] MISMATCH server=$SERVER deployed=$CLIENT" >> "$LOG"
  echo "PROTOCOL_MISMATCH server=$SERVER deployed_cortex=$CLIENT — rebuild + redeploy openclaw-deck"
  exit 2
fi

exit 0
