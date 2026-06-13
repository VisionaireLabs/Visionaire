#!/usr/bin/env bash
# consolidate-memory.sh — Post-session memory consolidation
#
# Reads today's episodic daily note, extracts candidate facts (bullet/numbered
# list items), deduplicates against MEMORY.md, and appends new facts with a
# datestamp.
#
# Usage:
#   bash scripts/consolidate-memory.sh [YYYY-MM-DD]
#
# Environment variables (all optional):
#   WORKSPACE_PATH   Root directory of the Visionaire workspace
#                    (default: directory containing this script's parent)
#   MEMORY_FILE      Path to long-term memory file
#                    (default: $WORKSPACE_PATH/MEMORY.md)
#   DAILY_NOTES_DIR  Directory containing daily notes (YYYY-MM-DD.md)
#                    (default: $WORKSPACE_PATH/memory)
#   DRY_RUN          Set to "1" to print proposed additions without writing
#                    (default: unset / disabled)

set -euo pipefail

# ── Resolve paths ─────────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_PATH="${WORKSPACE_PATH:-$(dirname "$SCRIPT_DIR")}"
MEMORY_FILE="${MEMORY_FILE:-${WORKSPACE_PATH}/MEMORY.md}"
DAILY_NOTES_DIR="${DAILY_NOTES_DIR:-${WORKSPACE_PATH}/memory}"

# ── Target date ───────────────────────────────────────────────────────────────
TARGET_DATE="${1:-$(date +%Y-%m-%d)}"
DAILY_NOTE="${DAILY_NOTES_DIR}/${TARGET_DATE}.md"

# ── Validate inputs ───────────────────────────────────────────────────────────
if [[ ! -f "$DAILY_NOTE" ]]; then
  echo "[consolidate-memory] No daily note found at: $DAILY_NOTE" >&2
  echo "[consolidate-memory] Nothing to consolidate." >&2
  exit 0
fi

if [[ ! -f "$MEMORY_FILE" ]]; then
  echo "[consolidate-memory] MEMORY.md not found at: $MEMORY_FILE" >&2
  exit 1
fi

# ── Extract candidate facts ───────────────────────────────────────────────────
# Lines starting with "- " or "* " (bullets) or "N. " (numbered lists)
# that are at least 20 chars long (noise filter).
extract_facts() {
  grep -E '^[[:space:]]*[-*]|^[[:space:]]*[0-9]+\.' "$1" \
    | sed -E 's/^[[:space:]]*[-*][[:space:]]+//' \
    | sed -E 's/^[[:space:]]*[0-9]+\.[[:space:]]+//' \
    | sed 's/^[[:space:]]*//; s/[[:space:]]*$//' \
    | awk 'length($0) >= 20'
}

CANDIDATES=$(extract_facts "$DAILY_NOTE")

if [[ -z "$CANDIDATES" ]]; then
  echo "[consolidate-memory] No candidate facts found in $DAILY_NOTE."
  exit 0
fi

# ── Deduplicate against MEMORY.md ─────────────────────────────────────────────
# A fact is considered "already present" if its first 60 chars appear anywhere
# in MEMORY.md (case-insensitive, stripped of markdown).
NEW_FACTS=()
while IFS= read -r fact; do
  [[ -z "$fact" ]] && continue
  snippet="${fact:0:60}"
  if ! grep -qi "$snippet" "$MEMORY_FILE"; then
    NEW_FACTS+=("$fact")
  fi
done <<< "$CANDIDATES"

if [[ ${#NEW_FACTS[@]} -eq 0 ]]; then
  echo "[consolidate-memory] All candidate facts already present in MEMORY.md."
  exit 0
fi

# ── Build consolidation block ─────────────────────────────────────────────────
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
BLOCK="\n\n<!-- consolidated: ${TARGET_DATE} at ${TIMESTAMP} -->"
for fact in "${NEW_FACTS[@]}"; do
  BLOCK+="\n- ${fact}"
done

# ── Write or dry-run ──────────────────────────────────────────────────────────
if [[ "${DRY_RUN:-}" == "1" ]]; then
  echo "[consolidate-memory] DRY RUN — would append to $MEMORY_FILE:"
  printf '%b\n' "$BLOCK"
else
  printf '%b\n' "$BLOCK" >> "$MEMORY_FILE"
  echo "[consolidate-memory] Appended ${#NEW_FACTS[@]} new fact(s) to $MEMORY_FILE."
fi

exit 0
