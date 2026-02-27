# Approval Queue

Actions that need Thor's approval before execution. Visionaire drafts, Thor approves.

## Rules
- **Always queue:** Social media posts, emails to external parties, spending money, public-facing content, deploying to production
- **Auto-approve:** File edits in workspace, web searches, reading data, internal cron tasks, memory updates
- **Escalate immediately:** Security concerns, credential handling, anything irreversible

## Pending Items
_None currently._

## Format
When adding items:
```
### [PENDING] <timestamp> — <action type>
**Action:** What will be done
**Draft:** The content/command
**Risk:** Low/Medium/High
**Waiting since:** <date>
```

## Completed
_Items move here after approval/rejection._
