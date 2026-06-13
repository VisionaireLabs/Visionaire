# cloudflared-watchdog Cron

**Schedule:** Every 5 minutes
**Target:** Isolated session
**Delivery:** Announce on failure

## What It Does

Keeps the Cloudflare Tunnel (`visionaire-gateway`) alive.

1. Checks if the `cloudflared` process is running
2. If dead: restarts via `cloudflared --no-autoupdate tunnel run visionaire-gateway`
3. Verifies the gateway endpoint is reachable
4. On persistent failure (3+ consecutive): escalates Tier 3 to Thor

## Why It Exists

The Cloudflare Tunnel is how `gateway.visionaire.co` routes to the local OpenClaw instance. If it dies, the agent is unreachable from the outside.

## Related

- Tunnel ID: `56a7802c-c439-4c68-a74f-d2eabe1d434a`
- Credentials: `/data/.cloudflared/`
- Script: `scripts/cloudflared-watchdog.sh`
- See TOOLS.md for full tunnel setup
