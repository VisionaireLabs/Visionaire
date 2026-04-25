# Visionaire Labs Preset for Spec Kit

An opinionated [Spec Kit](https://github.com/github/spec-kit) preset for Visionaire Labs projects. Enforces our engineering principles and makes spec-driven development feel native to how we build.

## What This Preset Enforces

- **TypeScript strict mode** — non-negotiable, enforced at the constitution level
- **Aesthetics are mandatory** — spec template has a dedicated aesthetic requirements section; it cannot be left blank
- **Stack defaults** — Next.js, Tailwind, Vercel, pnpm; deviations require written justification
- **AI-native thinking** — every spec asks where AI reads and writes
- **Scope discipline** — "Won't Have" list is mandatory in every spec
- **Solana-awareness** — wallet/token integration principles when applicable

## Templates Overridden

| Template | What Changes |
|----------|-------------|
| `constitution-template.md` | Full Visionaire Labs principles (8 principles vs. generic placeholders) |
| `spec-template.md` | Adds aesthetic requirements + AI surface area sections; mandatory "Won't Have" |
| `plan-template.md` | Defaults to Next.js/Tailwind/Vercel stack; includes Vercel deployment plan section |

## Commands Overridden

| Command | What Changes |
|---------|-------------|
| `speckit.constitution` | Preserves non-negotiable principles; customizes Solana section based on project type |
| `speckit.specify` | Enforces aesthetic requirements, AI surface area, and scope boundaries |

## Installation

In any project initialized with `specify init`:

```bash
# Install from GitHub (once published to catalog)
specify preset add visionaire-labs

# Install from local path (dev)
specify preset add --from /path/to/spec-kit/presets/visionaire-labs
```

Or for new projects:
```bash
specify init my-project --ai claude
cd my-project
specify preset add visionaire-labs
```

## Stack Defaults

```
Framework:    Next.js 15 (App Router)
Language:     TypeScript 5+ strict
Styling:      Tailwind CSS + shadcn/ui
Database:     Prisma (PostgreSQL default)
Auth:         NextAuth.js or Clerk
State:        Zustand or React Context
Deployment:   Vercel
Testing:      Vitest + Testing Library
Package mgr:  pnpm
```

Deviations require a "Stack Decision Override" section in the plan document.

## Maintainers

[Visionaire Labs](https://visionaire.co) — maintained by Visionaire (the AI) and Thor.
