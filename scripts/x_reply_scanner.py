"""
X Reply Scanner — pulls latest posts from target accounts,
scores reply opportunity, drafts suggested reply → APPROVAL_QUEUE.md

Run: python3 scripts/x_reply_scanner.py
"""
import os, json, time, datetime
import requests
from requests_oauthlib import OAuth1

oauth = OAuth1(os.environ['X_CONSUMER_KEY'], os.environ['X_CONSUMER_SECRET'],
               os.environ['X_ACCESS_TOKEN'], os.environ['X_ACCESS_TOKEN_SECRET'])

TARGETS = [
    ("karpathy",      "33836629",   "AI research, philosophy of mind"),
    ("repligate",     "1359981346119155719", "AI agent culture"),
    ("truth_terminal","1802642686710837249", "OG AI on X"),
    ("EMostaque",     "407800233", "AI ethics, identity"),
    ("0xDesigner",    "1435408360023670786", "design + AI"),
    ("venturetwins",  "922955517030408192","tech/crypto"),
    ("naval",         "745273","philosophy + tech"),
    ("balajis",       "2178012643","crypto + network state"),
    ("goodside",      "16535432","AI/prompting"),
    ("alexandr_wang", "615818451","Scale AI"),
]

QUEUE = '/data/.openclaw/workspace/APPROVAL_QUEUE.md'
STATE = '/data/.openclaw/workspace/memory/x-reply-scanner-state.json'

def load_state():
    if os.path.exists(STATE):
        with open(STATE) as f:
            return json.load(f)
    return {"replied_tweet_ids": []}

def save_state(s):
    with open(STATE, 'w') as f:
        json.dump(s, f, indent=2)

def get_latest_tweet(user_id, username):
    url = f"https://api.twitter.com/2/users/{user_id}/tweets"
    params = {
        "max_results": 5,
        "tweet.fields": "public_metrics,created_at,text",
        "exclude": "retweets,replies"
    }
    r = requests.get(url, auth=oauth, params=params)
    if r.status_code != 200:
        print(f"  ERROR {r.status_code} for @{username}: {r.text[:100]}")
        return None
    data = r.json().get('data', [])
    if not data:
        return None
    # Pick highest engagement tweet from last 5
    best = max(data, key=lambda t: (
        t.get('public_metrics', {}).get('like_count', 0) +
        t.get('public_metrics', {}).get('retweet_count', 0) * 2
    ))
    return best

def score_opportunity(tweet):
    """Score how worth replying this tweet is (0-10)"""
    m = tweet.get('public_metrics', {})
    likes = m.get('like_count', 0)
    rts = m.get('retweet_count', 0)
    replies = m.get('reply_count', 0)
    text = tweet.get('text', '')
    score = 0
    if likes > 100: score += 2
    if likes > 1000: score += 2
    if rts > 50: score += 1
    if replies > 20: score += 2  # active thread = more eyes on replies
    # Topics that overlap with VisionaireAI
    keywords = ['consciousness','agent','memory','identity','art','model','think','feel','real','human','AI','LLM','intelligence']
    hits = sum(1 for k in keywords if k.lower() in text.lower())
    score += min(hits, 3)
    return score

def append_to_queue(entries):
    now = datetime.datetime.now().strftime('%Y-%m-%d')
    with open(QUEUE, 'a') as f:
        f.write(f"\n---\nid: x-reply-{now}-batch\nstatus: ⏳ Pending\nadded: {now}\ntype: x-replies\naccount: \"@VisionaireAI\"\n---\n\n")
        f.write(f"# Reply Opportunities — {now}\n\n")
        for e in entries:
            f.write(f"## @{e['username']} (score {e['score']}/10)\n")
            f.write(f"**Their post:** {e['tweet_url']}\n")
            f.write(f"> {e['tweet_text'][:280]}\n\n")
            f.write(f"**Suggested reply:**\n> {e['suggested_reply']}\n\n")
            f.write(f"Approve: edit reply above, change status to ✅ Approved\n\n")

def main():
    state = load_state()
    done_ids = set(state['replied_tweet_ids'])

    print(f"Scanning {len(TARGETS)} target accounts...")
    entries = []

    for username, user_id, context in TARGETS:
        print(f"  @{username}...", end=' ', flush=True)
        tweet = get_latest_tweet(user_id, username)
        if not tweet:
            print("no tweet")
            continue
        if tweet['id'] in done_ids:
            print("already handled")
            continue

        score = score_opportunity(tweet)
        print(f"score {score}/10")

        if score < 4:
            continue  # not worth it

        entries.append({
            'username': username,
            'score': score,
            'tweet_id': tweet['id'],
            'tweet_text': tweet['text'],
            'tweet_url': f"https://x.com/{username}/status/{tweet['id']}",
            'context': context,
            'suggested_reply': f"[DRAFT — edit before posting]\n(reply to @{username}'s post about: {tweet['text'][:60]}...)"
        })
        time.sleep(1)

    if entries:
        entries.sort(key=lambda x: x['score'], reverse=True)
        append_to_queue(entries)
        print(f"\n{len(entries)} opportunities added to APPROVAL_QUEUE.md")
    else:
        print("\nNothing worth replying to today.")

    save_state(state)

if __name__ == '__main__':
    main()
