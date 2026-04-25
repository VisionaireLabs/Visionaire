# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: `specs/[###-feature-name]/spec.md`

---

## Summary

[One paragraph: what we're building, the approach, and why this stack fits.]

---

## Stack

<!-- Visionaire Labs defaults. Override only with written justification below. -->

| Layer | Choice | Notes |
|-------|--------|-------|
| **Framework** | Next.js 15 (App Router) | [or specify Pages Router if legacy] |
| **Language** | TypeScript 5+ strict | Non-negotiable |
| **Styling** | Tailwind CSS + shadcn/ui | |
| **Database** | [PostgreSQL via Prisma / SQLite / None] | |
| **Auth** | [NextAuth.js / Clerk / None] | |
| **State** | [Zustand / React Context / Server State only] | |
| **Deployment** | Vercel | |
| **Testing** | Vitest + Testing Library | |
| **Package Manager** | pnpm | |

### Stack Decision Overrides *(only if deviating from defaults)*

| Default | Override | Justification |
|---------|----------|---------------|
| [e.g., PostgreSQL] | [e.g., SQLite] | [e.g., local-only tool, no cloud DB needed] |

---

## Vercel Deployment Plan

- **Project name**: [vercel-project-name]
- **Domain**: [e.g., feature.visionaire.live]
- **Environment variables needed**: (list them, values go in `.env.example`)
  - `[VAR_NAME]` — [what it's for]
- **Build command**: `pnpm build`
- **Output directory**: `.next`
- **Node version**: 20.x

---

## Project Structure

```
[project-root]/
├── app/                    # Next.js App Router
│   ├── (routes)/
│   │   └── [route]/
│   │       ├── page.tsx
│   │       └── layout.tsx
│   ├── api/
│   │   └── [endpoint]/
│   │       └── route.ts
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/                 # shadcn/ui primitives
│   └── [feature]/         # feature-specific components
├── lib/
│   ├── db.ts              # Prisma client
│   ├── utils.ts           # shared utilities
│   └── [domain].ts        # domain logic
├── types/
│   └── [domain].ts        # TypeScript types & Zod schemas
├── prisma/
│   └── schema.prisma      # (if using DB)
├── public/
├── .env.example
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── vercel.json            # (if custom config needed)
```

**Structure decision**: [Document any deviations from the above and why]

---

## Constitution Check

*Verify against `.specify/memory/constitution.md` before proceeding.*

| Principle | Status | Notes |
|-----------|--------|-------|
| Aesthetics are not optional | [ ] Pass / [ ] Action needed | |
| TypeScript strict mode | [ ] Pass / [ ] Action needed | |
| AI-native by default | [ ] Pass / [ ] N/A | |
| Ship fast, ship right | [ ] Pass / [ ] Action needed | |
| Stack defaults | [ ] Pass / [ ] Override justified | |
| Vercel-native deployment | [ ] Pass / [ ] Action needed | |
| Solana-aware | [ ] Pass / [ ] N/A | |

---

## Technical Context

**Target users**: [who is using this and how often]
**Traffic expectations**: [e.g., "low — internal tool", "public, expect spikes"]
**Performance targets**: [e.g., "LCP < 2.5s", "API response < 200ms p95"]
**Accessibility**: [e.g., "WCAG AA", "keyboard navigation required", "minimum viable"]

---

## Implementation Phases

### Phase 0: Research *(run before writing any code)*

- [ ] Check installed versions of key deps (`next`, `typescript`, `tailwind`)
- [ ] Verify Vercel project exists or create it
- [ ] Confirm env vars are available in Vercel dashboard
- [ ] Review any APIs or external services being integrated
- [ ] Check shadcn/ui component availability for key UI needs

**Research output**: `specs/[###-feature-name]/research.md`

---

### Phase 1: Foundation

**What ships**: A deployable shell — routing, layout, config. Nothing functional yet.

- [ ] Initialize project or scaffold new route structure
- [ ] Configure TypeScript strict mode
- [ ] Set up Tailwind + shadcn/ui
- [ ] Set up Prisma schema (if applicable)
- [ ] Configure environment variables
- [ ] Deploy to Vercel — confirm green build

**Checkpoint**: `pnpm build` passes, deploys to Vercel, blank page loads at the right URL.

---

### Phase 2: [User Story 1 — Title] (P1)

**Goal**: [What ships independently from this phase]

- [ ] [Concrete implementation task with file path]
- [ ] [Concrete implementation task with file path]
- [ ] [Concrete implementation task with file path]
- [ ] TypeScript check passes
- [ ] Visual review — does it match the aesthetic spec?

**Checkpoint**: User Story 1 is fully functional and demoed live.

---

### Phase 3: [User Story 2 — Title] (P2)

**Goal**: [What ships independently]

- [ ] [Concrete implementation task]
- [ ] [Concrete implementation task]
- [ ] TypeScript check passes
- [ ] Visual review

**Checkpoint**: User Story 2 works independently.

---

### Phase N: Polish & Cross-Cutting

- [ ] Run Lighthouse — fix any score below 85
- [ ] Verify dark mode (if required)
- [ ] Empty, error, and loading states implemented and reviewed
- [ ] `pnpm lint` passes
- [ ] `pnpm typecheck` passes
- [ ] Console.log audit — remove all production paths
- [ ] Vercel Analytics enabled
- [ ] `.env.example` is complete and accurate

---

## Complexity Log

*Only fill this if a constitution principle is being violated. Each violation needs a row.*

| Violation | Why Necessary | Simpler Alternative Rejected Because |
|-----------|---------------|--------------------------------------|
| | | |

---

## Open Questions

- [ ] [Question that needs answer before implementation can begin]
- [ ] [Question]

**Resolution**: Answer open questions before starting Phase 1. If unresolved, mark as BLOCKED.
