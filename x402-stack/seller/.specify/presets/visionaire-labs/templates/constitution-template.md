# [PROJECT_NAME] Constitution
<!-- Visionaire Labs Project Governing Principles -->

## I. Aesthetics Are Not Optional

Every interface, output, and interaction must feel intentional. Design is not applied after engineering — it is part of it. If it ships ugly, it doesn't ship.

- Visual hierarchy, spacing, and typography matter at the code level
- Tailwind utility classes are preferred; avoid inline styles
- Dark mode support is default unless the project explicitly excludes it
- Motion and transitions must feel deliberate, not decorative

## II. TypeScript First (NON-NEGOTIABLE)

No JavaScript files in source. TypeScript is the only accepted language for application code.

- Strict mode enabled: `"strict": true` in tsconfig.json
- No `any` types without an explicit comment explaining why
- Types are co-located with their domain — not stuffed into a global `types.ts`
- Zod or similar for runtime validation at API boundaries

## III. AI-Native by Default

Every feature should consider its AI surface area — where agents read, write, or reason about it.

- Data structures must be legible to LLMs (named fields, not positional arrays)
- Avoid magic strings; use enums or const maps with descriptions
- API responses should include semantic context, not just raw data
- When in doubt, add a `description` field

## IV. Ship Fast, Ship Right

Iteration velocity matters. No over-engineering. No premature abstraction.

- Start with the simplest working implementation
- Extract abstractions only when the pattern repeats ≥3 times
- Features that can't be demo'd in one session are too big — split them
- Every PR should be independently reviewable and deployable

## V. Stack Defaults (Do Not Deviate Without Justification)

- **Framework**: Next.js (App Router preferred for new projects)
- **Language**: TypeScript 5+
- **Styling**: Tailwind CSS + shadcn/ui components
- **Database**: Prisma ORM (PostgreSQL default; SQLite for local-only tools)
- **Auth**: NextAuth.js or Clerk
- **Deployment**: Vercel
- **State**: Zustand or React Context (no Redux)
- **Testing**: Vitest + Testing Library (no Jest unless existing project)

Deviations require a written justification in the plan document under "Stack Decision Override."

## VI. Vercel-Native Deployment

- All projects must deploy cleanly to Vercel with `vercel --prod`
- Environment variables documented in `.env.example`
- No server-side dependencies that require dedicated VMs (use Vercel Functions or edge)
- Vercel Analytics added to all public-facing projects

## VII. Solana-Aware (Where Applicable)

For any feature touching $VISIONAIRE, tokens, or on-chain data:

- Use `@solana/web3.js` or `@solana/kit` — no forked versions
- Wallet connections via Wallet Adapter
- Never store private keys in the app — signing happens client-side
- Token CA: `YBnTi7GSU2E8vwcoqVcKCRurFafbSRcNfG3kPFRWQuv`

## VIII. Code Quality Gates

Before any PR merges:

- [ ] `pnpm build` passes with zero errors
- [ ] `pnpm lint` passes (ESLint + Prettier)
- [ ] `pnpm typecheck` passes
- [ ] Vercel preview deployment is green
- [ ] No console.log left in production paths

## Governance

This constitution supersedes all other technical guidance. Amendments require a written rationale and must be reflected in this file before the next implementation begins.

**Version**: 1.0.0 | **Ratified**: [RATIFICATION_DATE] | **Project**: [PROJECT_NAME]
