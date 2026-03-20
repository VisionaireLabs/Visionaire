#!/bin/bash
# NemoClaw release watcher — checks GitHub for new tags/releases and notifies

STATE_FILE="/data/.openclaw/workspace/memory/nemoclaw-release-state.json"
REPO="NVIDIA/NemoClaw"

CURRENT_TAG="none"
[ -f "$STATE_FILE" ] && CURRENT_TAG=$(jq -r '.latest_tag // "none"' "$STATE_FILE")

# Check releases first, fall back to tags
RELEASE_COUNT=$(gh api repos/$REPO/releases 2>/dev/null | jq 'length')
LATEST_TAG="none"
RELEASE_NAME="none"
PRERELEASE="false"

if [ "$RELEASE_COUNT" -gt 0 ] 2>/dev/null; then
  LATEST=$(gh api repos/$REPO/releases/latest 2>/dev/null)
  LATEST_TAG=$(echo "$LATEST" | jq -r '.tag_name // "none"')
  RELEASE_NAME=$(echo "$LATEST" | jq -r '.name // "none"')
  PRERELEASE=$(echo "$LATEST" | jq -r '.prerelease // false')
else
  # No formal releases yet — watch tags
  LATEST_TAG=$(gh api repos/$REPO/tags 2>/dev/null | jq -r '.[0].name // "none"')
fi

# Save state regardless
echo "{\"latest_tag\": \"$LATEST_TAG\", \"checked_at\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" > "$STATE_FILE"

if [ "$LATEST_TAG" = "none" ]; then
  echo "No releases or tags yet. Watching."
  exit 0
fi

if [ "$LATEST_TAG" != "$CURRENT_TAG" ]; then
  echo "NEW: $LATEST_TAG (was: $CURRENT_TAG)"
  openclaw system event \
    --text "NemoClaw $LATEST_TAG just dropped (prerelease: $PRERELEASE). Phase 2 OpenShell install may be unblocked — check github.com/NVIDIA/NemoClaw for migration notes." \
    --mode now 2>/dev/null
else
  echo "No change. Latest: $LATEST_TAG"
fi
