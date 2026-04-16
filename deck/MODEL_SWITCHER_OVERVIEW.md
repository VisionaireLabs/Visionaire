# OpenClaw Deck — Model Switcher (High-Level)

## Context
This document describes the **model switcher capability in OpenClaw Deck** (the app in `~/openclaw-deck`).

## What’s in it right now
At a high level, model selection is currently implemented as a **per-agent model picker at agent creation time**.

### 1) Model field in agent configuration
- `AgentConfig` includes an optional `model` field.
- This makes model choice a first-class part of each agent’s definition.

### 2) Model selector in “New Agent” flow
- In `AddAgentModal`, there is a **Model** `<select>` input.
- Current model options in the UI:
  - `claude-sonnet-4-5`
  - `claude-opus-4-6`
- Selected model is included when creating a new agent.

### 3) Gateway propagation
- When creating an agent, Deck sends agent params to gateway via `createAgentOnGateway`.
- The payload includes `model`, so the gateway can apply that model override.

### 4) Existing/default agents
- Default agents in `App.tsx` are initialized with `model: "claude-sonnet-4-5"`.

## User-facing behavior
- Users can choose model when creating a new agent.
- Different agents can be configured with different models.
- Model appears to be used as agent-level config rather than a global one-click runtime switch for an existing active agent.

## Current scope (important)
This implementation is primarily:
- ✅ **Per-agent model assignment** (creation-time)
- ⚠️ Not yet a full **live switcher** for already-created agents in place (unless separately added elsewhere)

## Suggested next iteration (if desired)
To evolve this into a fuller “model switcher” experience:
1. Add model dropdown in each agent column header.
2. Call `agents.update` with new model for existing agents.
3. Persist model updates in local/session state.
4. Show active model badge in the UI.
5. Add optimistic update + rollback on gateway failure.

## Relevant files
- `src/types/index.ts` (`AgentConfig.model`)
- `src/components/AddAgentModal.tsx` (Model selector)
- `src/lib/store.ts` (`createAgentOnGateway` passes `model`)
- `src/App.tsx` (default agents include `model`)





