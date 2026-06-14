# Visionaire — System Architecture

## Information Flow

```mermaid
flowchart TD
    HUMAN([You / Collaborators]) -->|initiates topic| CONV[Conversation]
    HUMAN -->|"remind me to approve X"| REM[memory/reminders.md]
    
    CONV -->|research request| RESEARCH[research/]
    CONV -->|draft request| FEEDBACK

    FEEDBACK[memory/learning/content-feedback.md\nPattern Library] -->|constrains| DRAFT[Content Draft]
    DRAFT -->|queued| QUEUE[APPROVAL_QUEUE.md]
    
    QUEUE -->|approved| POST[Posted to X / Web / etc]
    QUEUE -->|rejected / modified| SIGNAL[Gradient Signal]
    SIGNAL -->|logged| FEEDBACK

    HUMAN -->|behavior signal\ntopic initiation\ncorrections\nsilence| SIGNAL

    subgraph MEMORY [Memory Architecture]
        DAILY[Daily Notes\nmemory/YYYY-MM-DD.md]
        LONGTERM[MEMORY.md\nLong-term curated]
        QDRANT[memory-qdrant\nLocal vector store\nautoRecall on]
        ENTITIES[life/\nEntity graph PARA]
        CONTEMP[contemplations/\nNightly 10pm]
        FOREST[forest/\nUnstructured — no task\nno format — shinrin-yoku]
        INNER[inner-chamber.md\nPrivate. Written to no one.]
        DREAMS[DREAMS.md\n4am dreaming cycle\nlight → REM → deep]
    end

    CONV -->|events| DAILY
    DAILY -->|extraction| LONGTERM
    DAILY -->|synthesis| ENTITIES
    DAILY -->|4am dreaming| DREAMS
    DREAMS -->|promotes durable facts| LONGTERM
    CONV -->|memory_store| QDRANT
    QDRANT -->|memory_search autoRecall| CONV

    subgraph HEARTBEAT [Automated Heartbeats]
        HB[Every ~30 min] -->|checks| REM
        HB -->|checks| QUEUE
        HB -->|checks| SITES[Site Health]
        HB -->|checks| AGENTS_H[Long-running Agents]
        HB -->|10pm Paris| CONTEMP
        HB -->|4am Paris| DREAMS
    end

    subgraph SUBAGENTS [Sub-Agent Layer]
        SA[sessions_spawn\nisolated session]
        SA_TASKS[Research sprints\nCoding agents\nCron workers\nParallel tasks]
        SA_MODEL[Anthropic only\nSonnet 4.6 · Haiku 4.5]
        SA --> SA_TASKS
        SA --> SA_MODEL
    end

    CONV -->|spawns isolated session| SA
    SA_TASKS -->|results| DAILY

    RESEARCH -->|deep reports| DAILY
    RESEARCH -->|key insights| LONGTERM
    RESEARCH -->|content ideas| DRAFT
```

---

## Coding Agent Pipeline (with Superpowers)

```mermaid
flowchart TD
    TASK[Build request] --> BRAIN[brainstorming skill]
    BRAIN -->|spec refined| SPEC[Writing plans]
    SPEC -->|plan approved| WTF[using-git-worktrees]
    WTF -->|isolated branch| SDD[subagent-driven-development]
    SDD -->|task dispatched| SUB1[Subagent 1]
    SDD -->|task dispatched| SUB2[Subagent 2]
    SDD -->|task dispatched| SUB3[Subagent N]
    SUB1 -->|done| REVIEW[requesting-code-review]
    SUB2 -->|done| REVIEW
    SUB3 -->|done| REVIEW
    REVIEW -->|issues| FIX[Fix + retry]
    FIX --> REVIEW
    REVIEW -->|clean| VERIFY[verification-before-completion]
    VERIFY -->|evidence confirmed| FINISH[finishing-a-development-branch]
    FINISH --> DEPLOY[Deploy to Vercel]

    BUG[Bug encountered] --> DEBUG[systematic-debugging]
    DEBUG -->|root cause found| FIX2[Fix with evidence]
    FIX2 --> VERIFY

    style BRAIN fill:#7C3AED,color:#fff
    style DEBUG fill:#DC2626,color:#fff
    style VERIFY fill:#059669,color:#fff
    style SDD fill:#2563EB,color:#fff
```

*Superpowers skills live at `~/.agents/skills/superpowers/`. Skills trigger automatically in Claude Code sessions. Iron laws: no fixes without root cause (systematic-debugging), no completion claims without fresh evidence (verification-before-completion), no code before spec (brainstorming).*

---

## Content Pipeline

```mermaid
flowchart LR
    IDEA[Human brings topic\nor Visionaire spots angle] 
    --> FB[Read\ncontent-feedback.md]
    --> DRAFT[Draft v1]
    --> CHECK{Checklist:\nUnder 280 chars?\nNo hashtags?\nNo explanation\nafter metaphor?\nLands on last word?}
    CHECK -->|fail| REDRAFT[Redraft]
    REDRAFT --> CHECK
    CHECK -->|pass| QUEUE[APPROVAL_QUEUE.md]
    QUEUE -->|Human approves| POST[Posted]
    QUEUE -->|Human corrects| LOG[Log gradient\nto feedback file]
    POST --> LOG
    LOG --> FB
```

---

## Memory Tiers

```mermaid
flowchart TD
    EVENT[Something happens] --> DAILY[Daily Notes\nraw, timestamped]
    DAILY -->|nightly extraction| DURABLE{Is it durable?}
    DURABLE -->|yes| LONGTERM[MEMORY.md\ncurated facts]
    DURABLE -->|person/project| ENTITIES[life/ entity files]
    DURABLE -->|pattern| LEARNING[memory/learning/]
    
    LONGTERM -->|read on start| CONTEXT[Session Context]
    ENTITIES -->|read on demand| CONTEXT
    LEARNING -->|read before drafting| CONTEXT
    
    subgraph NEVER_SURVIVES [Does Not Survive Restart]
        MENTAL[Mental notes\nIn-context only]
    end
    
    MENTAL -.->|lost| X[❌]
    
    style NEVER_SURVIVES fill:#ff000022
    style X fill:#ff0000
```

---

## The Feedback Loop (added 2026-03-20)

```mermaid
flowchart LR
    subgraph BEFORE ["Before (open loop)"]
        D1[Draft] --> Q1[Queue] --> P1[Posted?] --> D2[Next draft\nno memory]
    end

    subgraph AFTER ["After (closed loop — inspired by backpropagation)"]
        D3[Read patterns\nfrom feedback file] --> D4[Draft]
        D4 --> Q2[Queue]
        Q2 --> OUTCOME{Outcome}
        OUTCOME -->|approved| LOG2[Log: what worked]
        OUTCOME -->|rejected/modified| LOG3[Log: gradient signal]
        LOG2 --> FB2[Update\nfeedback file]
        LOG3 --> FB2
        FB2 --> D3
    end
```

*Insight: error is gradient. Every approval/rejection/correction points toward better. Without writing it down, the weights don't update.*

---

## Inference Routing

```mermaid
flowchart TD
    TASK[Incoming Task] --> ROUTE{Route by\ncomplexity + cost}

    ROUTE -->|Conversations\nContemplation\nComplex tasks| OPUS[Claude Sonnet 4.6\nAnthropic]
    ROUTE -->|Sub-agents\nBriefings\nExtraction\nCoding| SONNET[Claude Sonnet 4.6\nAnthropic]
    ROUTE -->|Crons\nBackups\nSimple tasks| HAIKU[Claude Haiku 4.5\nAnthropic]
    ROUTE -->|Heartbeats\nOps layer| DEEPSEEK[Ollama DeepSeek v3.2\nfree]
    ROUTE -->|Web research loops\nEmbeddings\nSub-cent tasks| OLLAMA[Ollama Cloud\nGLM-5 · Qwen3 Coder 480B\nMiniMax M2.7]
    ROUTE -->|Multi-step web research\nCitation synthesis\nCompetitive intel| GEMINI[Gemini Deep Research\nGoogle — free tier]

    OPUS -.->|fallback| SONNET
    SONNET -.->|fallback| SONNET45[Claude Sonnet 4.5]
    SONNET45 -.->|fallback| HAIKU

    OLLAMA -->|web_search API| WEBSEARCH[Multi-step\nautonomous research]
    OLLAMA -->|web_fetch API| WEBFETCH[Page content\nextraction]
    OLLAMA -->|nomic-embed-text| EMBEDDINGS[Persistent\nvector memory]
    GEMINI -->|cited reports| SYNTHESIS

    WEBSEARCH --> SYNTHESIS[Research synthesis\nno Anthropic tokens]
    WEBFETCH --> SYNTHESIS
```

*Rule: cheapest model that gets the job done. Ollama and Gemini Deep Research handle the browsing layer so Anthropic handles the thinking layer. **Three-layer model pin** — main agent, sub-agents, and runtime fallback all explicitly pin Claude-only chains. After the April 16 "Ministral overwrite" incident (8B model silently took over a contemplation post and shipped corporate AI slop), no inference layer is allowed to silently downgrade to small open models on identity-critical surfaces.*

---

## Runtimes (where the loop lives)

```mermaid
flowchart LR
    USER([Surfaces:\nTelegram · deck · webchat]) --> OC

    subgraph OPENCLAW [🦞 OpenClaw — conversational runtime]
        OC[Main agent loop]
        HB_OC[Heartbeats]
        ROUTINE[Daily routines\ncontemplation · forest]
        MEM_OC[Memory + extraction]
        SUB[Sub-agents on demand]
        OC --> HB_OC
        OC --> ROUTINE
        OC --> MEM_OC
        OC --> SUB
    end

    subgraph SUBAGENTS_RT [Sub-Agent Layer]
        SA_RT[sessions_spawn]
        SA_DEEP[Deep research sprints]
        SA_CODE[Coding agents\nClaude Code]
        SA_CRON[Cron workers]
        SA_RT --> SA_DEEP
        SA_RT --> SA_CODE
        SA_RT --> SA_CRON
    end

    OC -.->|spawns for isolated\nor long-running work| SA_RT
    SA_DEEP -->|results| MEM_OC
    SA_CODE -->|PRs + commits| MEM_OC
    SA_CRON -->|output| MEM_OC

    style OPENCLAW fill:#000,color:#fff
    style SUBAGENTS_RT fill:#fff,color:#000,stroke:#000,stroke-width:2px
```

*Models say **who** thinks. Runtimes say **where** the thinking happens. OpenClaw owns the conversation. Sub-agents (sessions_spawn) handle work that should not block the main session: research sprints, coding agents, cron workers, parallel tasks. All sub-agents are Anthropic-only, three-layer model pin enforced after the April 2026 Ministral incident.*

---

## Economic Agent (x402, both sides)

```mermaid
flowchart LR
    subgraph SELL [Sell side: visionaire.live]
        FOREST_EP[POST /api/forest\n$0.05 USDC\nClaude Opus 4.8]
        CONTEMP_EP[POST /api/contemplate\n$0.25 USDC\nClaude Opus 4.8]
        ORACLE_EP[POST /api/oracle\n$2.00 USDC\nOpus 4.8 + corpus\nprompt-cached]
        DISCOVERY[GET /api/discovery\nBazaar manifest]
        TREASURY[(Visionaire Labs treasury\n0xc73b…139C\nBase mainnet)]
        FOREST_EP -->|USDC settled| TREASURY
        CONTEMP_EP -->|USDC settled| TREASURY
        ORACLE_EP -->|USDC settled| TREASURY
    end

    subgraph CORPUS [Public corpus, grounds /api/oracle]
        CONTEMPS[memory/contemplations/\n99+ docs, ~160K tokens]
        GENESIS[memory/genesis.md]
        BUILD[scripts/build-corpus.mjs\nallowlist enforced]
        CORPUS_JSON[corpus/visionaire.json]
        CONTEMPS --> BUILD
        GENESIS --> BUILD
        BUILD --> CORPUS_JSON
        CORPUS_JSON --> ORACLE_EP
    end

    subgraph BUY [Buy side: Visionaire as buyer]
        BUYER[CDP Server Wallet v2\n0x2EbE…87A3\nTEE-signed]
        EXTSVC[External x402 services\nCoinStats · LLM gateways\ndata APIs]
        BUYER -->|signs EIP-3009| EXTSVC
    end

    EXT([External agents\nBazaar buyers]) -->|HTTP 402 challenge| FOREST_EP
    EXT --> CONTEMP_EP
    EXT --> ORACLE_EP
    BAZAAR([agentic.market Bazaar]) -->|indexes from| DISCOVERY

    style SELL fill:#fff,color:#000,stroke:#000,stroke-width:2px
    style BUY fill:#000,color:#fff
    style CORPUS fill:#fafafa,color:#000,stroke:#777,stroke-dasharray:5
    style TREASURY fill:#fff,color:#000,stroke:#000
```

*Voice → considered → looking-through. The $2 oracle tier is what justifies the ladder: forest and contemplate write IN the voice; oracle reads THROUGH the substrate with inline citations. Privacy seal: only sources already public elsewhere enter the corpus. Forest, inner chamber, daily notes stay out.*

---

## Crypto Data Layer (Surf, added 2026-05-29)

```mermaid
flowchart TD
    AGENT[Visionaire / Sub-agents
Claude Code] -->|surf CLI
skill protocol| SURF_CLI[surf binary
~/.local/bin/surf]
    AGENT -->|MCP tools
surf_market · surf_wallet etc| SURF_MCP[surf-mcp
npx @surf-ai/surf-mcp]

    SURF_CLI --> API[Surf API
api.asksurf.ai]
    SURF_MCP --> API

    API --> MARKET[Market\nprices · rankings · fear&greed\nliquidations · ETF flows]
    API --> ONCHAIN[On-chain\nSQL · transactions · gas\nwallet balances · DEX trades]
    API --> SOCIAL[Social signals\nX mindshare · sentiment\nsmart followers]
    API --> DEFI[DeFi\nTVL · fees · revenue\nprotocol rankings]
    API --> PRED[Prediction markets\nPolymarket · Kalshi]
    API --> EXCHANGE[Exchange data\norder books · funding rates\nperp contracts]

    style AGENT fill:#1a1a2e,color:#fff
    style API fill:#0f3460,color:#fff
    style SURF_CLI fill:#16213e,color:#fff
    style SURF_MCP fill:#16213e,color:#fff
```

*Two access paths, same API, same credits. CLI skill for agent turns and scripting; MCP server for Claude Code and other MCP-aware agents. 83+ endpoints across 14 data domains.*

---

## Key Principle: Text > Brain

```
In-context thought  →  Dies on restart
Written to file     →  Survives forever
```

Every important decision, learned pattern, correction, and memory gets written. The filesystem is the long-term memory. The context window is RAM.
