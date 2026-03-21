#!/usr/bin/env python3
"""Fetch YouTube transcript using yt-dlp (no VPN required)."""
import subprocess, sys, json, re, os, tempfile

def fetch_transcript(url_or_id, languages="en"):
    video_id = url_or_id
    if "youtube.com" in url_or_id or "youtu.be" in url_or_id:
        match = re.search(r"(?:v=|youtu\.be/)([A-Za-z0-9_-]{11})", url_or_id)
        if match:
            video_id = match.group(1)
    url = f"https://www.youtube.com/watch?v={video_id}"
    with tempfile.TemporaryDirectory() as tmpdir:
        result = subprocess.run(
            ["yt-dlp", "--skip-download", "--write-auto-sub", "--write-sub",
             "--sub-lang", languages.split(",")[0], "--sub-format", "vtt",
             "--output", f"{tmpdir}/%(id)s.%(ext)s", url],
            capture_output=True, text=True
        )
        for f in os.listdir(tmpdir):
            if f.endswith(".vtt"):
                with open(os.path.join(tmpdir, f)) as fp:
                    vtt = fp.read()
                # Strip VTT formatting
                lines = []
                for line in vtt.splitlines():
                    if "-->" in line or line.strip() == "" or line.startswith("WEBVTT") or re.match(r"^\d+$", line.strip()):
                        continue
                    clean = re.sub(r"<[^>]+>", "", line).strip()
                    if clean and (not lines or lines[-1] != clean):
                        lines.append(clean)
                return " ".join(lines)
    return result.stderr or "Could not fetch transcript"

if __name__ == "__main__":
    args = sys.argv[1:]
    if not args:
        print("Usage: fetch_transcript.py <video_id_or_url> [languages]")
        sys.exit(1)
    langs = args[1] if len(args) > 1 else "en"
    print(fetch_transcript(args[0], langs))
