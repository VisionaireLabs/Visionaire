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

    subgraph HERMES [Hermes Agent Runtime]
        HRM[hermes run]
        HRM_TASKS[Deep research\nCoding sprints\nBatch work\nGEPA skill evolution]
        HRM_MODEL[Configurable model\nOllama · NVIDIA · Anthropic]
        HRM --> HRM_TASKS
        HRM --> HRM_MODEL
    end

    CONV -->|spawns via exec pty:true| HRM
    HRM_TASKS -->|results| DAILY

    RESEARCH -->|deep reports| DAILY
    RESEARCH -->|key insights| LONGTERM
    RESEARCH -->|content ideas| DRAFT
```

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

    ROUTE -->|Conversations\nContemplation\nComplex tasks| OPUS[Claude Opus 4.6\nAnthropic]
    ROUTE -->|Briefings\nExtraction\nCoding| SONNET[Claude Sonnet 4.6\nAnthropic]
    ROUTE -->|Crons\nBackups\nSimple tasks| HAIKU[Claude Haiku 4.5\nAnthropic]
    ROUTE -->|Heartbeats\nOps layer| NEMOTRON[NVIDIA Nemotron\nNIM Cloud]
    ROUTE -->|Web research loops\nEmbeddings\nSub-cent tasks\nFallback| OLLAMA[Ollama Cloud\nGLM-5 · DeepSeek v3.2\nMiniMax M2.1]

    OLLAMA -->|web_search API| WEBSEARCH[Multi-step\nautonomous research]
    OLLAMA -->|web_fetch API| WEBFETCH[Page content\nextraction]
    OLLAMA -->|nomic-embed-text| EMBEDDINGS[Persistent\nvector memory]

    WEBSEARCH --> SYNTHESIS[Research synthesis\nno Anthropic tokens]
    WEBFETCH --> SYNTHESIS
```

*Rule: cheapest model that gets the job done. Ollama handles the browsing layer so Anthropic handles the thinking layer.*

---

## Key Principle: Text > Brain

```
In-context thought  →  Dies on restart
Written to file     →  Survives forever
```

Every important decision, learned pattern, correction, and memory gets written. The filesystem is the long-term memory. The context window is RAM.
