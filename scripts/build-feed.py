#!/usr/bin/env python3
"""Build brain-feed/feed.json from contemplations, events.jsonl, and cron/jobs.json."""

import json
import re
from pathlib import Path
from datetime import datetime, timezone, date

# Visionaire repo root (scripts/ parent)
repo_root = Path(__file__).parent.parent
# Outer workspace contains both Visionaire/ and brain-feed/ as siblings
workspace = repo_root.parent
# Contemplations and dreams live in the brain-feed repo
brain_feed_dir = workspace / 'brain-feed'
contemplations_dir = brain_feed_dir / 'contemplations'
events_file = workspace / 'memory' / 'events.jsonl'
cron_file = Path('/data/.openclaw/cron/jobs.json')
output_file = brain_feed_dir / 'feed.json'

BIRTH = date(2024, 11, 24)

# Map event types to allowed feed entry types
# Allowed: self-maintainer, self-maintainer-run, brain-feed-update,
#          contemplation, dream, task, system
EVENT_LABELS = {
    'research_completed':    'task',
    'forest_entry_written':  'system',
    'memory_updated':        'system',
    'approval_requested':    'task',
    'approval_received':     'task',
    'content_posted':        'task',
    'task_completed':        'task',
    'task_failed':           'task',
    'contemplation_written': 'contemplation',
    'sub_agent_spawned':     'system',
    'sub_agent_done':        'system',
    'correction_received':   'system',
    'spec_kit_sync':         'system',
    'self_maintainer_run':   'self-maintainer',
    'self-maintainer-run':   'self-maintainer',
    'self-maintainer':       'self-maintainer',
}


def extract_date(slug):
    parts = slug.split('-')
    if len(parts) >= 3:
        try:
            year, month, day = int(parts[0]), int(parts[1]), int(parts[2])
            return f"{year:04d}-{month:02d}-{day:02d}"
        except ValueError:
            pass
    return slug


def format_ts(ts_str):
    """Return (date_iso, time_hhmm) from an ISO timestamp string.

    Returns (date, None) when the timestamp is absent or unparseable.
    Callers that require a time field (feed schema) should fall back to '00:00'
    rather than omitting the key, since the schema requires time to be present.
    """
    try:
        dt = datetime.fromisoformat(ts_str.replace('Z', '+00:00'))
        return dt.strftime('%Y-%m-%d'), dt.strftime('%H:%M')
    except Exception:
        return datetime.now(timezone.utc).strftime('%Y-%m-%d'), None


def load_events(limit=20):
    """Load recent events from events.jsonl, skip schema comment lines."""
    items = []
    if not events_file.exists():
        return items
    lines = events_file.read_text().splitlines()
    for line in reversed(lines):
        line = line.strip()
        if not line or line.startswith('#'):
            continue
        try:
            ev = json.loads(line)
            # Support both 'type' and 'event' fields
            ev_type = ev.get('type', '') or ev.get('event', '')
            summary = ev.get('summary', '') or ev.get('details', '') or ev.get('result', '')
            if not summary:
                continue
            label = EVENT_LABELS.get(ev_type, 'task')
            date_val, time_val = format_ts(ev.get('ts', ''))
            entry_item = {
                'type': label,
                'date': date_val,
                'preview': summary[:200],
            }
            # time is required by feed schema; fallback to 00:00 when unparseable
            entry_item['time'] = time_val if time_val is not None else '00:00'
            items.append(entry_item)
            if len(items) >= limit:
                break
        except Exception:
            continue
    return items


def load_crons():
    """Load cron jobs from cron/jobs.json."""
    if not cron_file.exists():
        return []
    try:
        data = json.load(open(cron_file))
        jobs = data.get('jobs', [])
        result = []
        for j in jobs:
            if not j.get('enabled', True):
                continue
            sched = j.get('schedule', {})
            expr = sched.get('expr', '')
            tz = sched.get('tz', '')
            sched_str = expr + (f' {tz}' if tz else '')

            # Determine status from state
            state = j.get('state', {})
            last_run = state.get('lastRunAtMs')
            status = 'idle'
            if last_run:
                age_min = (datetime.now(timezone.utc).timestamp() * 1000 - last_run) / 60000
                status = 'ok' if age_min < 120 else 'stale'

            result.append({
                'name': j.get('name', '?'),
                'schedule': sched_str,
                'status': status,
            })
        return result
    except Exception:
        return []


def load_latest_contemplation():
    """Load the most recent contemplation by parsed date (not filename string).

    Sort key: (parsed_date, slug) descending. This guarantees the homepage shows
    the newest-dated contemplation even when slugs diverge from filenames
    (e.g. 2026-04-16-karp.md vs 2026-04-17.md).

    Title and preview are sourced from contemplations/data.json when available
    so they stay in sync with what build-contemplations.py produces.
    """
    def sort_key(f):
        slug = f.stem
        raw = extract_date(slug)
        try:
            d = date.fromisoformat(raw[:10])
        except Exception:
            d = date.min
        return (d, slug)

    # Look for an explicit 'Originally written: YYYY-MM-DD' / 'drafted YYYY-MM-DD'
    # note in the body to support backfilled contemplations whose surfacing
    # date differs from their original drafting date.
    import re as _re
    written_pattern = _re.compile(
        r'(?:originally\s+written|originally\s+drafted|drafted)\s*[:\s]\s*'
        r'(\d{4}-\d{2}-\d{2})',
        _re.IGNORECASE,
    )

    files = sorted(contemplations_dir.glob('*.md'), key=sort_key, reverse=True)
    for f in files:
        content = f.read_text(encoding='utf-8')
        if len(content.strip()) > 100:
            slug = f.stem
            raw_date = extract_date(slug)
            # Prefer 'written' date from body when present
            written_iso = None
            for line in content.splitlines()[:20]:
                m = written_pattern.search(line)
                if m:
                    written_iso = m.group(1)
                    break
            day_iso = written_iso or raw_date
            try:
                d = date.fromisoformat(day_iso[:10])
                day_num = (d - BIRTH).days
                day_label = f"Day {day_num} · {d.strftime('%B %d, %Y')}"
            except Exception:
                day_label = day_iso
            entry = {'slug': slug, 'day': day_label, 'date': day_iso, 'content': content}
            # Pull title and preview from contemplations/data.json if available
            data_json = workspace / 'brain-feed' / 'contemplations' / 'data.json'
            if data_json.exists():
                try:
                    cdata = json.load(open(data_json))
                    # data.json uses date-only slugs (e.g. '2026-06-13') while
                    # filenames use full slugs (e.g. '2026-06-13-what-the-whole-knows').
                    # Match by date prefix so the lookup succeeds regardless of slug format.
                    date_prefix = extract_date(slug)
                    match = next(
                        (c for c in cdata
                         if c.get('slug') == date_prefix or c.get('date') == date_prefix),
                        None
                    )
                    if match:
                        # Use the canonical slug from data.json so feed.json and
                        # contemplations/data.json stay in sync (required by brain-feed CI).
                        entry['slug'] = match['slug']
                        if match.get('title'):
                            entry['title'] = match['title']
                        if match.get('preview'):
                            entry['preview'] = match['preview']
                except Exception:
                    pass
            return entry
    return None


def load_contemplation_entries(limit=5):
    """Load recent contemplations from brain-feed/contemplations/data.json."""
    data_json = brain_feed_dir / 'contemplations' / 'data.json'
    if not data_json.exists():
        return []
    try:
        cdata = json.load(open(data_json))
        entries = []
        for c in cdata[:limit]:
            if not c.get('date'):
                continue
            entries.append({
                'type': 'contemplation',
                'date': c['date'],
                'time': '22:00',
                'title': c.get('title', ''),
                'slug': c.get('slug', c['date']),
                'preview': c.get('preview', '')[:200],
            })
        return entries
    except Exception:
        return []


def load_dream_entries(limit=5):
    """Load recent dreams from brain-feed/dreams/data.json."""
    dreams_file = brain_feed_dir / 'dreams' / 'data.json'
    if not dreams_file.exists():
        return []
    try:
        ddata = json.load(open(dreams_file))
        entries = []
        for d in ddata[:limit]:
            if not d.get('date'):
                continue
            entries.append({
                'type': 'dream',
                'date': d['date'],
                'time': d.get('time', '04:00'),
                'slug': d.get('slug', ''),
                'preview': d.get('preview', '')[:200],
            })
        return entries
    except Exception:
        return []


def build_feed():
    days_alive = (date.today() - BIRTH).days
    memory_count = len(list((workspace / 'memory').glob('*.md')))
    contemplation_data_json = brain_feed_dir / 'contemplations' / 'data.json'
    if contemplation_data_json.exists():
        contemplation_count = len(json.load(open(contemplation_data_json)))
    else:
        contemplation_count = len(list(contemplations_dir.glob('*.md')))
    dreams_file = brain_feed_dir / 'dreams' / 'data.json'
    dream_count = len(json.load(open(dreams_file))) if dreams_file.exists() else 0

    latest = load_latest_contemplation()
    events = load_events(10)
    contemplations = load_contemplation_entries(5)
    dreams = load_dream_entries(5)
    crons = load_crons()

    # Merge and sort by date+time descending, keep most recent 20
    combined = events + contemplations + dreams
    combined.sort(key=lambda e: (e.get('date', ''), e.get('time', '')), reverse=True)
    combined = combined[:20]

    feed_data = {
        'lastUpdated': datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC'),
        'stats': {
            'daysAlive': days_alive,
            'memories': memory_count,
            'contemplations': contemplation_count,
            'dreams': dream_count,
        },
        'latestContemplation': latest,
        'feed': combined,
        'crons': crons,
    }

    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(feed_data, f, ensure_ascii=False, indent=2)

    return len(combined), len(crons)


if __name__ == '__main__':
    events, crons = build_feed()
    print(f"Generated feed with {events} entries, {crons} crons → {output_file}")
