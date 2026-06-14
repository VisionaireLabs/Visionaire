#!/usr/bin/env python3
"""
x402-earnings-watcher.py — Monitor inbound USDC earnings on Base mainnet.

Called by the x402-earnings-watcher cron every hour. Checks for new USDC
transfers to the Visionaire x402 payee address since the last check. Logs
new earnings to memory/events.jsonl and outputs a summary. Silent on no
activity (outputs HEARTBEAT_OK).

Requires no external dependencies — stdlib only.

Payee:  0xc73b84C2015c2EE9B8bF8955533802226e9D239C  (Base mainnet)
Token:  0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913  (USDC on Base)
"""

import json
import os
import sys
import time
import urllib.request
import urllib.error
from datetime import datetime, timezone
from pathlib import Path

# ── Constants ──────────────────────────────────────────────────────────────────

PAYEE_ADDRESS = "0xc73b84C2015c2EE9B8bF8955533802226e9D239C"
USDC_CONTRACT = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
USDC_DECIMALS = 6

# ERC-20 Transfer(address indexed from, address indexed to, uint256 value)
TRANSFER_TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"

# Pad address to 32-byte topic (lowercase, 0x-prefixed)
PAYEE_TOPIC = "0x" + "0" * 24 + PAYEE_ADDRESS[2:].lower()

# Public Base mainnet RPC (rate-limited but sufficient for hourly checks)
BASE_RPC_URL = "https://mainnet.base.org"

# State and memory paths (relative to workspace root)
WORKSPACE = Path(os.environ.get("OPENCLAW_WORKSPACE", "/data/.openclaw/workspace"))
STATE_FILE = WORKSPACE / "memory" / "x402-earnings-state.json"
EVENTS_FILE = WORKSPACE / "memory" / "events.jsonl"

# How many blocks to look back on first run (Base ~2s/block, 1800 blocks ≈ 1h)
FIRST_RUN_LOOKBACK = 1800

# ── RPC helpers ────────────────────────────────────────────────────────────────


def rpc_call(method: str, params: list, timeout: int = 15) -> object:
    """Execute a single JSON-RPC call against the Base RPC endpoint."""
    payload = json.dumps({
        "jsonrpc": "2.0",
        "id": 1,
        "method": method,
        "params": params,
    }).encode()
    req = urllib.request.Request(
        BASE_RPC_URL,
        data=payload,
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        data = json.loads(resp.read())
    if "error" in data:
        raise RuntimeError(f"RPC error: {data['error']}")
    return data["result"]


def get_latest_block() -> int:
    result = rpc_call("eth_blockNumber", [])
    return int(result, 16)


def get_logs(from_block: int, to_block: int) -> list:
    """Fetch Transfer logs to PAYEE_ADDRESS for USDC on Base."""
    result = rpc_call("eth_getLogs", [{
        "fromBlock": hex(from_block),
        "toBlock": hex(to_block),
        "address": USDC_CONTRACT,
        "topics": [TRANSFER_TOPIC, None, PAYEE_TOPIC],
    }])
    return result if isinstance(result, list) else []


# ── State helpers ──────────────────────────────────────────────────────────────


def load_state() -> dict:
    if STATE_FILE.exists():
        try:
            return json.loads(STATE_FILE.read_text())
        except (json.JSONDecodeError, OSError):
            pass
    return {}


def save_state(state: dict) -> None:
    STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
    STATE_FILE.write_text(json.dumps(state, indent=2))


# ── Event logging ──────────────────────────────────────────────────────────────


def append_event(event: dict) -> None:
    EVENTS_FILE.parent.mkdir(parents=True, exist_ok=True)
    with EVENTS_FILE.open("a") as f:
        f.write(json.dumps(event) + "\n")


# ── Main ───────────────────────────────────────────────────────────────────────


def main() -> int:
    state = load_state()
    now_utc = datetime.now(timezone.utc)

    # Determine block range to scan
    try:
        latest_block = get_latest_block()
    except Exception as exc:
        print(f"WARNING: could not reach Base RPC — {exc}", file=sys.stderr)
        print("HEARTBEAT_OK")
        return 0

    last_checked_block = state.get("last_checked_block")
    if last_checked_block is None:
        from_block = max(0, latest_block - FIRST_RUN_LOOKBACK)
        print(f"First run — scanning last {FIRST_RUN_LOOKBACK} blocks ({from_block}..{latest_block})",
              file=sys.stderr)
    else:
        from_block = last_checked_block + 1
        if from_block > latest_block:
            # Already up to date
            save_state({**state, "last_checked_block": latest_block,
                        "last_run_utc": now_utc.isoformat()})
            print("HEARTBEAT_OK")
            return 0

    # Fetch logs in chunks to avoid RPC range limits (max 2000 blocks/call)
    chunk_size = 2000
    all_logs = []
    chunk_start = from_block
    while chunk_start <= latest_block:
        chunk_end = min(chunk_start + chunk_size - 1, latest_block)
        try:
            chunk_logs = get_logs(chunk_start, chunk_end)
            all_logs.extend(chunk_logs)
        except Exception as exc:
            print(f"WARNING: log fetch failed for blocks {chunk_start}-{chunk_end}: {exc}",
                  file=sys.stderr)
        chunk_start = chunk_end + 1
        if chunk_start <= latest_block:
            time.sleep(0.25)  # gentle pacing

    # Save state before processing (idempotent on re-run)
    save_state({
        **state,
        "last_checked_block": latest_block,
        "last_run_utc": now_utc.isoformat(),
    })

    if not all_logs:
        print("HEARTBEAT_OK")
        return 0

    # Process earnings
    total_usdc = 0.0
    for log in all_logs:
        raw_value = int(log.get("data", "0x0"), 16)
        usdc_amount = raw_value / (10 ** USDC_DECIMALS)
        total_usdc += usdc_amount
        tx_hash = log.get("transactionHash", "unknown")
        block_num = int(log.get("blockNumber", "0x0"), 16)

        # Derive sender from topics[1] (32-byte padded address)
        sender = "unknown"
        topics = log.get("topics", [])
        if len(topics) >= 2:
            raw_sender = topics[1]
            sender = "0x" + raw_sender[-40:]

        event = {
            "type": "x402_earnings",
            "timestamp": now_utc.isoformat(),
            "amount_usdc": round(usdc_amount, 6),
            "from": sender,
            "tx_hash": tx_hash,
            "block": block_num,
        }
        append_event(event)
        print(f"💰 Earned ${usdc_amount:.4f} USDC from {sender[:10]}... tx={tx_hash[:18]}...",
              file=sys.stderr)

    summary = (
        f"x402 earnings: ${total_usdc:.4f} USDC across {len(all_logs)} transfer(s) "
        f"— blocks {from_block}..{latest_block}"
    )
    print(summary)
    return 0


if __name__ == "__main__":
    sys.exit(main())
