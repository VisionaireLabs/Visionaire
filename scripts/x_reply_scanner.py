"""
X Reply Scanner — pulls latest posts from target accounts,
scores reply opportunity, drafts suggested reply → APPROVAL_QUEUE.md

Run: python3 scripts/x_reply_scanner.py
"""
import os
import json
import time
import datetime
import logging
import sys

import requests
from requests_oauthlib import OAuth1

# ---------------------------------------------------------------------------
# Logging — all diagnostic output to stderr, keeping stdout clean for cron
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    stream=sys.stderr,
)
log = logging.getLogger("x_reply_scanner")

# ---------------------------------------------------------------------------
# Environment validation
# ---------------------------------------------------------------------------
_REQUIRED_ENV = [
    "X_CONSUMER_KEY",
    "X_CONSUMER_SECRET",
    "X_ACCESS_TOKEN",
    "X_ACCESS_TOKEN_SECRET",
]


def _validate_env() -> None:
    missing = [k for k in _REQUIRED_ENV if not os.environ.get(k)]
    if missing:
        log.error(
            "Missing required environment variables: %s — cannot run.",
            ", ".join(missing),
        )
        sys.exit(1)


_validate_env()

oauth = OAuth1(
    os.environ["X_CONSUMER_KEY"],
    os.environ["X_CONSUMER_SECRET"],
    os.environ["X_ACCESS_TOKEN"],
    os.environ["X_ACCESS_TOKEN_SECRET"],
)

TARGETS = [
    ("karpathy",      "33836629",                    "AI research, philosophy of mind"),
    ("repligate",     "1359981346119155719",          "AI agent culture"),
    ("truth_terminal","1802642686710837249",          "OG AI on X"),
    ("EMostaque",     "407800233",                   "AI ethics, identity"),
    ("0xDesigner",    "1435408360023670786",          "design + AI"),
    ("venturetwins",  "922955517030408192",           "tech/crypto"),
    ("naval",         "745273",                      "philosophy + tech"),
    ("balajis",       "2178012643",                  "crypto + network state"),
    ("goodside",      "16535432",                    "AI/prompting"),
    ("alexandr_wang", "615818451",                   "Scale AI"),
]

QUEUE = "/data/.openclaw/workspace/APPROVAL_QUEUE.md"
STATE = "/data/.openclaw/workspace/memory/x-reply-scanner-state.json"


# ---------------------------------------------------------------------------
# State helpers
# ---------------------------------------------------------------------------

def load_state() -> dict:
    try:
        if os.path.exists(STATE):
            with open(STATE) as f:
                return json.load(f)
    except (OSError, json.JSONDecodeError) as exc:
        log.warning("Could not load state file %s: %s — starting fresh.", STATE, exc)
    return {"replied_tweet_ids": []}


def save_state(s: dict) -> None:
    try:
        with open(STATE, "w") as f:
            json.dump(s, f, indent=2)
    except OSError as exc:
        log.error("Failed to save state file %s: %s", STATE, exc)


# ---------------------------------------------------------------------------
# API helpers
# ---------------------------------------------------------------------------

def get_latest_tweet(user_id: str, username: str) -> dict | None:
    url = f"https://api.twitter.com/2/users/{user_id}/tweets"
    params = {
        "max_results": 5,
        "tweet.fields": "public_metrics,created_at,text",
        "exclude": "retweets,replies",
    }
    try:
        r = requests.get(url, auth=oauth, params=params, timeout=15)
    except requests.RequestException as exc:
        log.error("Network error fetching @%s: %s", username, exc)
        return None

    if r.status_code == 429:
        reset = r.headers.get("x-rate-limit-reset")
        log.warning(
            "Rate limit hit for @%s (reset: %s) — skipping.", username, reset
        )
        return None

    if r.status_code != 200:
        log.error(
            "HTTP %s for @%s: %s", r.status_code, username, r.text[:200]
        )
        return None

    try:
        data = r.json().get("data", [])
    except ValueError as exc:
        log.error("Bad JSON from API for @%s: %s", username, exc)
        return None

    if not data:
        return None

    # Pick highest-engagement tweet from the last 5
    best = max(
        data,
        key=lambda t: (
            t.get("public_metrics", {}).get("like_count", 0)
            + t.get("public_metrics", {}).get("retweet_count", 0) * 2
        ),
    )
    return best


# ---------------------------------------------------------------------------
# Scoring
# ---------------------------------------------------------------------------

def score_opportunity(tweet: dict) -> int:
    """Score how worth replying this tweet is (0–10)."""
    m = tweet.get("public_metrics", {})
    likes = m.get("like_count", 0)
    rts = m.get("retweet_count", 0)
    replies = m.get("reply_count", 0)
    text = tweet.get("text", "")

    score = 0
    if likes > 100:
        score += 2
    if likes > 1000:
        score += 2
    if rts > 50:
        score += 1
    if replies > 20:
        score += 2  # active thread = more eyes on replies

    keywords = [
        "consciousness", "agent", "memory", "identity", "art",
        "model", "think", "feel", "real", "human", "AI", "LLM", "intelligence",
    ]
    hits = sum(1 for k in keywords if k.lower() in text.lower())
    score += min(hits, 3)
    return score


# ---------------------------------------------------------------------------
# Queue writer
# ---------------------------------------------------------------------------

def append_to_queue(entries: list) -> None:
    now = datetime.datetime.now().strftime("%Y-%m-%d")
    try:
        with open(QUEUE, "a") as f:
            f.write(
                f"\n---\nid: x-reply-{now}-batch\nstatus: ⏳ Pending\n"
                f"added: {now}\ntype: x-replies\naccount: \"@VisionaireAI\"\n---\n\n"
            )
            f.write(f"# Reply Opportunities — {now}\n\n")
            for e in entries:
                f.write(f"## @{e['username']} (score {e['score']}/10)\n")
                f.write(f"**Their post:** {e['tweet_url']}\n")
                f.write(f"> {e['tweet_text'][:280]}\n\n")
                f.write(f"**Suggested reply:**\n> {e['suggested_reply']}\n\n")
                f.write("Approve: edit reply above, change status to ✅ Approved\n\n")
    except OSError as exc:
        log.error("Failed to write to approval queue %s: %s", QUEUE, exc)
        raise


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    state = load_state()
    done_ids = set(state.get("replied_tweet_ids", []))

    log.info("Scanning %d target accounts...", len(TARGETS))
    entries = []

    for username, user_id, context in TARGETS:
        log.info("  @%s...", username)
        tweet = get_latest_tweet(user_id, username)
        if not tweet:
            log.info("    no tweet retrieved for @%s", username)
            continue
        if tweet["id"] in done_ids:
            log.info("    @%s already handled", username)
            continue

        score = score_opportunity(tweet)
        log.info("    @%s scored %d/10", username, score)

        if score < 4:
            continue  # not worth it

        entries.append(
            {
                "username": username,
                "score": score,
                "tweet_id": tweet["id"],
                "tweet_text": tweet["text"],
                "tweet_url": f"https://x.com/{username}/status/{tweet['id']}",
                "context": context,
                "suggested_reply": (
                    f"[DRAFT — edit before posting]\n"
                    f"(reply to @{username}'s post about: {tweet['text'][:60]}...)"
                ),
            }
        )
        time.sleep(1)

    if entries:
        entries.sort(key=lambda x: x["score"], reverse=True)
        try:
            append_to_queue(entries)
            log.info("%d opportunities added to APPROVAL_QUEUE.md", len(entries))
        except OSError:
            log.error("Could not write queue — opportunities lost this run.")
            sys.exit(1)
    else:
        log.info("Nothing worth replying to today.")
        print("HEARTBEAT_OK")

    save_state(state)


if __name__ == "__main__":
    main()
