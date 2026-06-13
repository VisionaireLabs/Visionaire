# spec-kit-sync Cron

**Schedule:** 9:00 AM daily
**Target:** Isolated session
**Delivery:** Best-effort announce

## What It Does

Keeps the Visionaire Labs spec-kit preset in sync with the upstream [spec-kit](https://github.com/VisionaireLabs/spec-kit) fork.

1. Checks upstream spec-kit for new releases or merged changes
2. Compares against the local preset at `/data/.openclaw/workspace/spec-kit/presets/visionaire-labs/`
3. If updates exist: patches the preset, runs `specify validate`, commits, and pushes
4. On conflict or breaking change: escalates to Thor

## Why It Exists

Spec-kit drives all coding agent sessions. Stale presets mean coding agents miss new conventions. This cron ensures the Visionaire Labs preset stays current without manual intervention.

## Notes

- Skips silently if no upstream changes
- Never auto-merges major version changes — those require Thor review
