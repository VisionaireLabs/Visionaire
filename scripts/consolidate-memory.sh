#!/usr/bin/env bash
# consolidate-memory.sh
# Post-session memory consolidation: extracts new facts from today's daily note,
# skips entries already in MEMORY.md, appends new ones with a datestamp.
#
# Usage: bash scripts/consolidate-memory.sh
# Env vars:
#   WORKSPACE    Path to the workspace directory (default: /data/.openclaw/workspace)
#   DATE         Date string YYYY-MM-DD for the daily note (default: today)

set -euo pipefail

WORKSPACE="${WORKSPACE:-/data/.openclaw/workspace}"
DATE="${DATE:-$(date +%Y-%m-%d)}"
DAILY_NOTE="$WORKSPACE/memory/$DATE.md"
MEMORY_FILE="$WORKSPACE/MEMORY.md"

if [[ ! -f "$DAILY_NOTE" ]]; then
  echo "No daily note found at $DAILY_NOTE — nothing to consolidate." >&2
  exit 0
fi

if [[ ! -f "$MEMORY_FILE" ]]; then
  echo "MEMORY.md not found at $MEMORY_FILE" >&2
  exit 1
fi

# Extract candidate facts: lines starting with - or * or numbered list items
# that are not already present verbatim in MEMORY.md
ADDED=0
while IFS= read -r line; do
  # Match bullet or numbered list items with content
  if [[ "$line" =~ ^[[:space:]]*[-*]\ +(.+)$ ]] || [[ "$line" =~ ^[[:space:]]*[0-9]+\.[[:space:]]+(.+)$ ]]; then
    fact="${BASH_REMATCH[1]:-}"
    # Skip empty or very short facts
    if [[ ${#fact} -lt 10 ]]; then
      continue
    fi
    # Skip if already present (exact substring match)
    if grep -qF "$fact" "$MEMORY_FILE" 2>/dev/null; then
      continue
    fi
    # Append with datestamp
    echo "" >> "$MEMORY_FILE"
    echo "- [$DATE] $fact" >> "$MEMORY_FILE"
    echo "  Appended: $fact"
    ((ADDED++)) || true
  fi
done < "$DAILY_NOTE"

if [[ $ADDED -eq 0 ]]; then
  echo "No new facts to consolidate from $DATE."
else
  echo "Consolidated $ADDED new fact(s) from $DATE into MEMORY.md."
fi
