#!/usr/bin/env python3
"""
Nightly session retrospective.
Asks: what worked, what needed correction, what signal was captured.
Writes to memory/learning/retrospectives/YYYY-MM-DD.md
"""
import json
import os
import sys
from datetime import datetime, timezone, timedelta
from pathlib import Path

WORKSPACE = Path("/data/.openclaw/workspace")
RETRO_DIR = WORKSPACE / "memory/learning/retrospectives"
EVENTS_FILE = WORKSPACE / "memory/events.jsonl"
CORRECTIONS_FILE = WORKSPACE / "memory/learning/corrections.md"

def get_today_events():
    if not EVENTS_FILE.exists():
        return []
    today = datetime.now(timezone.utc).date().isoformat()
    events = []
    for line in EVENTS_FILE.read_text().splitlines():
        try:
            e = json.loads(line)
            if e.get("ts", "").startswith(today):
                events.append(e)
        except:
            pass
    return events

def main():
    RETRO_DIR.mkdir(parents=True, exist_ok=True)
    today = datetime.now(timezone.utc).date().isoformat()
    retro_file = RETRO_DIR / f"{today}.md"

    if retro_file.exists():
        print(f"[retro] already exists for {today}, skipping")
        return

    events = get_today_events()
    event_summary = "\n".join(
        f"- [{e.get('type','')}] {e.get('summary', e.get('text', str(e)))}"
        for e in events
    ) or "- (none logged)"

    content = f"""# Retrospective — {today}

## Events Today
{event_summary}

## Signal Capture
<!-- What durable facts/patterns emerged today? -->
- 

## What Worked
<!-- First-try successes, clean tool calls, good routing decisions -->
- 

## What Needed Correction
<!-- Errors, misreads, wrong calls — link to corrections.md if logged -->
- 

## What Evaporated
<!-- Signal generated but not captured — things to fix -->
- 

## Carry Forward
<!-- One behavioral change to encode before next session -->
- 

---
_Auto-scaffolded by session-retrospective.py at {datetime.now(timezone.utc).isoformat()}_
"""
    retro_file.write_text(content)
    print(f"[retro] scaffolded {retro_file}")

if __name__ == "__main__":
    main()
