#!/usr/bin/env bash
# validate-feed.sh — Validate feed.json before committing to brain-feed.
#
# Usage:
#   bash scripts/validate-feed.sh [path/to/feed.json]
#
# Defaults to feed.json in the current directory.
# Exits 0 if valid, non-zero with a descriptive error message if not.
#
# Schema rules (mirrors brain-feed/.github/workflows/validate.yml):
#   - Valid JSON
#   - Top-level: lastUpdated (string), stats (object), feed (array)
#   - Each feed entry: type (allowed values), date (YYYY-MM-DD), time (HH:MM), preview (non-empty)
#
# Allowed entry types:
#   self-maintainer, self-maintainer-run, brain-feed-update,
#   contemplation, dream, task, system

set -euo pipefail

FEED_FILE="${1:-feed.json}"

if [ ! -f "$FEED_FILE" ]; then
  echo "❌ validate-feed.sh: file not found: $FEED_FILE" >&2
  exit 1
fi

python3 - "$FEED_FILE" << 'PYEOF'
import json
import re
import sys

ALLOWED_TYPES = {
    "self-maintainer",
    "self-maintainer-run",
    "brain-feed-update",
    "contemplation",
    "dream",
    "task",
    "system",
}

DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
TIME_RE = re.compile(r"^\d{2}:\d{2}$")

path = sys.argv[1]
errors = []

# --- Parse JSON ---
try:
    with open(path) as f:
        data = json.load(f)
except json.JSONDecodeError as e:
    print(f"❌ {path}: invalid JSON — {e}", file=sys.stderr)
    sys.exit(1)

# --- Top-level required fields ---
for field in ("lastUpdated", "stats", "feed"):
    if field not in data:
        errors.append(f"missing top-level field: '{field}'")

if "stats" in data and not isinstance(data["stats"], dict):
    errors.append(f"'stats' must be an object, got {type(data['stats']).__name__}")

if "feed" in data and not isinstance(data["feed"], list):
    errors.append(f"'feed' must be an array, got {type(data['feed']).__name__}")

# --- Per-entry validation ---
if "feed" in data and isinstance(data["feed"], list):
    for i, entry in enumerate(data["feed"]):
        prefix = f"feed[{i}]"

        # type
        entry_type = entry.get("type", "")
        if not entry_type:
            errors.append(f"{prefix}: missing 'type'")
        elif entry_type not in ALLOWED_TYPES:
            errors.append(
                f"{prefix}: unknown type {entry_type!r} — allowed: {', '.join(sorted(ALLOWED_TYPES))}"
            )

        # date
        date = entry.get("date", "")
        if not date:
            errors.append(f"{prefix}: missing 'date'")
        elif not DATE_RE.match(date):
            errors.append(f"{prefix}: 'date' must be YYYY-MM-DD, got {date!r}")

        # time
        time_val = entry.get("time", "")
        if not time_val:
            errors.append(f"{prefix}: missing 'time'")
        elif not TIME_RE.match(time_val):
            errors.append(f"{prefix}: 'time' must be HH:MM, got {time_val!r}")

        # preview
        preview = entry.get("preview", "")
        if not preview or not str(preview).strip():
            errors.append(f"{prefix}: missing or empty 'preview'")

if errors:
    print(f"❌ {path}: {len(errors)} validation error(s):", file=sys.stderr)
    for e in errors:
        print(f"   • {e}", file=sys.stderr)
    sys.exit(1)

entry_count = len(data.get("feed", []))
print(f"✅ {path}: valid — {entry_count} entries, schema clean")
PYEOF
