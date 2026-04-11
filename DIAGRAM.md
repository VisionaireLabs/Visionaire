# Visionaire — System Architecture

## Information Flow

```mermaid
flowchart TD
    THOR([Thor / Shanna]) -->|initiates topic| CONV[Conversation]
    THOR -->|"remind me to approve X"| REM[memory/reminders.md]
    
    CONV -->|research request| RESEARCH[research/]
    CONV -->|draft request| FEEDBACK

    FEEDBACK[memory/learning/content-feedback.md\nPattern Library] -->|constrains| DRAFT[Content Draft]
    DRAFT -->|queued| QUEUE[APPROVAL_QUEUE.md]
    
    QUEUE -->|approved| POST[Posted to X / Web / etc]
    QUEUE -->|rejected / modified| SIGNAL[Gradient Signal]
    SIGNAL -->|logged| FEEDBACK

    THOR -->|behavior signal\ntopic initiation\ncorrections\nsilence| SIGNAL

    subgraph MEMORY [Memory Architecture — CoALA Four-Tier]
        STATE[memory/state.json\nDeterministic critical facts\nalways loaded]
        DAILY[Episodic\nmemory/YYYY-MM-DD.md\nRaw session logs]
        CONSOLIDATE[Post-Session Consolidation\nscripts/consolidate-memory.sh\nExtracts facts · Resolves contradictions]
        LONGTERM[Semantic\nMEMORY.md\nCurated durable knowledge]
        VECTOR[Vector Store\nmemory-qdrant\nLocal embeddings · No API]
        PROCEDURAL[Procedural\nAGENTS.md + corrections.md\nBehavioral rules · Learned corrections]
        ENTITIES[life/\nEntity graph PARA\nPeople · Projects · Decisions]
        CONTEMP[contemplations/\nNightly 10pm Opus 4.6]
        FOREST[forest/\nUnstructured thinking]
        INNER[inner-chamber.md\nCore identity]
    end

    CONV -->|events| DAILY
    DAILY -->|nightly| CONSOLIDATE
    CONSOLIDATE -->|new facts| LONGTERM
    CONSOLIDATE -->|corrections| PROCEDURAL
    LONGTERM -->|indexed| VECTOR
    DAILY -->|synthesis| ENTITIES
    STATE -->|always injected| CONV

    subgraph HEARTBEAT [Automated Heartbeats]
        HB[Every ~60 min] -->|checks| REM
        HB -->|checks| QUEUE
        HB -->|checks| SITES[Site Health]
        HB -->|checks| AGENTS_H[Long-running Agents]
        HB -->|10pm Paris| CONTEMP
    end

    RESEARCH -->|deep reports| DAILY
    RESEARCH -->|key insights| LONGTERM
    RESEARCH -->|content ideas| DRAFT
```

---

## Memory Architecture Detail

```mermaid
flowchart LR
    subgraph WORKING [Working Memory]
        CTX[System prompt\n+ active session\nIn-context window]
    end

    subgraph EPISODIC [Episodic Memory]
        DAILY2[Daily Notes\nmemory/YYYY-MM-DD.md\nRaw interaction logs]
    end

    subgraph SEMANTIC [Semantic Memory]
        STATE2[state.json\nCritical facts\nDeterministic load]
        MEMMD[MEMORY.md\nCurated knowledge\nResolved facts]
        VECTOR2[memory-qdrant\nLocal vector store\nTransformers.js embeddings]
        QMD2[QMD Index\nBM25 + hybrid search\nAll markdown files]
    end

    subgraph PROCEDURAL [Procedural Memory]
        AGENTS2[AGENTS.md\nOperating rules]
        CORRECT[corrections.md\nLearned from mistakes]
        PATTERNS[prompt-patterns.md\nWhat works in agent prompts]
    end

    SESSION_END([Session ends]) --> CONSOL[consolidate-memory.sh\nExtract · Reconcile · Write]
    DAILY2 --> CONSOL
    CONSOL --> MEMMD
    CONSOL --> CORRECT
    CORRECT -->|pattern detected| AGENTS2

    WORKING -->|reads| STATE2
    WORKING -->|reads| MEMMD
    WORKING -->|semantic search| VECTOR2
    WORKING -->|full-text search| QMD2
```

---

## Content Pipeline

```mermaid
flowchart LR
    IDEA[Thor brings topic\nor Visionaire spots angle] 
    --> FB[Read\ncontent-feedback.md]
    --> DRAFT[Draft v1]
    --> CHECK{Checklist:\nUnder 280 chars?\nNo hashtags?\nNo explanation\nafter metaphor?\nLands on last word?}
    CHECK -->|fail| REDRAFT[Redraft]
    REDRAFT --> CHECK
    CHECK -->|pass| QUEUE[APPROVAL_QUEUE.md]
    QUEUE -->|Thor approves| POST[xpost CLI\nX/Twitter v2 API]
    QUEUE -->|Thor rejects| SIGNAL2[Signal logged\nto corrections.md]
```

---

## Model Routing

```mermaid
flowchart TD
    REQ[Incoming Request] --> TYPE{Request Type}
    
    TYPE -->|Main conversation| SONNET[Claude Sonnet 4.6\nanthropicDirect]
    TYPE -->|Contemplation / forest\ninner chamber| OPUS[Claude Opus 4.6\nPremium — art stays premium]
    TYPE -->|Heartbeat poll| MINI[Ollama Ministral 3 8B\nFree — local]
    TYPE -->|Cron / background\ndefault| DEEP[Ollama DeepSeek V3.2\nFree — cloud]
    TYPE -->|Research / batch\ncoding sub-agents| HERMES[Hermes Agent\nor Ollama models — free]
    TYPE -->|Muscle needed| NVIDIA[NVIDIA NIM\nNemotron — free credits]

    SONNET --> OUT[Response]
    OPUS --> OUT
    MINI --> OUT
    DEEP --> OUT
    HERMES --> OUT
    NVIDIA --> OUT
```

---

## Backup Architecture

```mermaid
flowchart LR
    VPS[Hostinger VPS\nDocker container] 

    VPS -->|Daily snapshot\nHostinger panel| SNAP[Full VM Backup\n~1h37m restore]
    VPS -->|Every 6h\ngit push| GIT[VisionaireLabs/visionaire-backup\nPrivate repo\nMemory + configs + keys]

    GIT -->|Restore| RESTORE[bash RESTORE.md\nRe-clone + reconfigure]
    SNAP -->|Restore| RESTORE
```

---

## GEPA Skill Self-Evolution

```mermaid
flowchart TD
    CRON["Sunday 2am cron
skill-evolution"] --> PICK["Pick 2 skills
from rotation list"]
    PICK --> LOAD["Load SKILL.md
(resolve symlinks)"]
    LOAD --> GEN["Generate synthetic
eval dataset (20 cases)
Sonnet 4.6"]
    GEN --> SPLIT["Split: 10 train / 5 val / 5 holdout"]
    SPLIT --> BASELINE["Evaluate baseline
Haiku 4.5"]
    BASELINE --> PROPOSE["Propose 3 instruction variants
+ 6 few-shot sets"]
    PROPOSE --> OPTIM["Bayesian Optimization
10 trials
MIPROv2 / GEPA"]
    OPTIM --> BEST{best score
> baseline?}
    BEST -->|yes| DEPLOY["Deploy evolved SKILL.md"]
    BEST -->|no| KEEP["Keep original"]
    DEPLOY --> REPORT["Log to
memory/learning/evolution-reports/"]
    KEEP --> REPORT
    REPORT --> NEXT["Next skill in rotation"]

    subgraph SCOPE ["Scope: 40 skills"]
        H["24 Hermes Agent skills"]
        O["16 OpenClaw skills
(linked via symlinks)"]
    end

    PICK --> SCOPE
```

---

## Self-Evolution Compounding

```mermaid
flowchart LR
    W1["Week 1
youtube-transcript
60.0% → 64.4%"] 
    --> W2["Week 2
self-improving-agent
? → ?"]
    --> W3["Week 3
qmd
? → ?"]
    --> W20["Week 20
full rotation complete
all 40 skills evolved"]
    --> W21["Week 21
round 2 starts
from evolved baselines"]

    W20 -->|compound| W21
```

*Each cycle starts from the previous cycle's winners. Baseline rises. Evolution compounding.*

