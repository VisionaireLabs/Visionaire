# cowork-mcp-watchdog Cron

**Schedule:** On demand / periodic
**Target:** Isolated session
**Delivery:** Announce on failure

## What It Does

Monitors and restarts the Cowork MCP (Model Context Protocol) daemon when it goes down.

1. Checks if the Cowork MCP process is running
2. If dead: restarts it
3. Verifies the MCP is responding to health checks
4. Logs status to daily notes

## Notes

- Cowork MCP enables Claude Code agents to access shared tools and context
- Recovery is automatic for crashes; escalates to Thor only for persistent failures
