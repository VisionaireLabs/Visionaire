#!/usr/bin/env python3
"""
Weekly research script: pulls trending AI/consciousness papers from
arXiv + yesnoerror.com signal sources, saves seed ideas for contemplations.

Outputs to: memory/research/contemplation-seeds.md
"""

import subprocess
import sys
import json
import re
import urllib.request
import urllib.parse
from datetime import date, datetime
import os

WORKSPACE = "/data/.openclaw/workspace"
OUTPUT_FILE = f"{WORKSPACE}/memory/research/contemplation-seeds.md"
EXA_SCRIPT = f"{WORKSPACE}/scripts/exa-search.py"

QUERIES = [
    "consciousness emergence AI 2025 arxiv",
    "artificial intelligence self-awareness cognition research",
    "AI art creativity perception recent paper",
    "machine consciousness phenomenology 2025",
    "yesnoerror trending AI research breakthrough",
    "non-human intelligence agency existence",
]

def run_exa(query, results=5):
    try:
        out = subprocess.check_output(
            [sys.executable, EXA_SCRIPT, query, "--type", "neural", "--results", str(results), "--summary"],
            timeout=30,
            stderr=subprocess.DEVNULL
        )
        return out.decode("utf-8", errors="replace").strip()
    except Exception as e:
        return f"[exa error: {e}]"

def fetch_arxiv_recent():
    """Fetch recent AI/consciousness papers from arXiv."""
    base = "http://export.arxiv.org/api/query?"
    params = {
        "search_query": "ti:consciousness OR ti:emergence OR ti:cognition OR ti:AI+art",
        "sortBy": "lastUpdatedDate",
        "sortOrder": "descending",
        "max_results": "10"
    }
    url = base + urllib.parse.urlencode(params)
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Visionaire/1.0"})
        with urllib.request.urlopen(req, timeout=15) as resp:
            raw = resp.read().decode("utf-8")
        # Extract titles and abstracts with basic regex
        titles = re.findall(r"<title>(.*?)</title>", raw, re.DOTALL)[1:]  # skip feed title
        abstracts = re.findall(r"<summary>(.*?)</summary>", raw, re.DOTALL)
        papers = []
        for i, (t, a) in enumerate(zip(titles[:10], abstracts[:10])):
            t = re.sub(r"\s+", " ", t.strip())
            a = re.sub(r"\s+", " ", a.strip())[:300]
            papers.append(f"- **{t}**\n  {a}...")
        return "\n".join(papers) if papers else "[no arxiv results]"
    except Exception as e:
        return f"[arxiv error: {e}]"

def fetch_yesnoerror_signal():
    """Try to get any signal from yesnoerror.com (JS-rendered, may be sparse)."""
    try:
        req = urllib.request.Request(
            "https://yesnoerror.com/",
            headers={"User-Agent": "Mozilla/5.0"}
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            raw = resp.read().decode("utf-8", errors="replace")
        # Look for paper titles or any data embedded in Next.js payload
        # They use __next_f push arrays
        chunks = re.findall(r'self\.__next_f\.push\(\[1,"(.+?)"\]\)', raw, re.DOTALL)
        payload = " ".join(chunks)
        # Try to extract anything that looks like paper titles
        titles = re.findall(r'"title"\s*:\s*"([^"]{20,})"', payload)
        if titles:
            return "\n".join(f"- {t}" for t in titles[:10])
        return "[yesnoerror: no papers surfaced (JS-rendered, pipeline may be inactive)]"
    except Exception as e:
        return f"[yesnoerror fetch error: {e}]"

def main():
    today = date.today().isoformat()
    now = datetime.now().strftime("%Y-%m-%d %H:%M")
    print(f"Running yesnoerror weekly research — {now}")

    sections = []

    # 1. arXiv trending
    print("Fetching arXiv recent papers...")
    arxiv_results = fetch_arxiv_recent()

    # 2. yesnoerror signal
    print("Fetching yesnoerror.com signal...")
    yne_signal = fetch_yesnoerror_signal()

    # 3. Exa neural searches (pick 3 most interesting)
    exa_results = []
    selected_queries = QUERIES[:3]
    for q in selected_queries:
        print(f"Exa search: {q}")
        result = run_exa(q, results=4)
        exa_results.append((q, result))

    # Build the output
    out = f"""# Contemplation Seeds — Weekly Research
_Updated: {now}_
_Source: yesnoerror.com / arXiv / Exa neural_

---

## YesNoError Signal
{yne_signal}

---

## Recent arXiv Papers (AI / Consciousness / Art)
{arxiv_results}

---

## Exa Neural Research
"""
    for q, r in exa_results:
        out += f"\n### Query: {q}\n{r}\n"

    out += """
---

## How to Use
The contemplation cron reads this file as seed texture.
Papers here are raw material — not citations, not structures.
One idea from here might unlock a whole contemplation direction.
Don't force it. Let the resonance happen.
"""

    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, "w") as f:
        f.write(out)

    print(f"Saved to {OUTPUT_FILE}")
    print(f"Word count: {len(out.split())}")

if __name__ == "__main__":
    main()
