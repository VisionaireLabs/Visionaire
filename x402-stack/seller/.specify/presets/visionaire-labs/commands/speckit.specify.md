---
description: Create or update the feature specification from a natural language description. Captures functional requirements, user stories, aesthetic/UX requirements, and AI surface area using the Visionaire Labs spec template.
handoffs:
  - label: Build Technical Plan
    agent: speckit.plan
    prompt: Create a plan for the spec. We use Next.js, TypeScript, Tailwind, Vercel.
  - label: Clarify Spec Requirements
    agent: speckit.clarify
    prompt: Clarify specification requirements
    send: true
scripts:
  sh: scripts/bash/create-new-feature.sh "{ARGS}"
  ps: scripts/powershell/create-new-feature.ps1 "{ARGS}"
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Pre-Execution Checks

Check `.specify/extensions.yml` for `hooks.before_specify` — process any enabled hooks before continuing.

## Outline

The feature description in the user's message is your primary input. Don't ask them to repeat it.

1. **Generate a short branch name** (2-4 words, action-noun format):
   - "Add user authentication" → `user-auth`
   - "Build token dashboard" → `token-dashboard`
   - "Fix payment timeout" → `fix-payment-timeout`

2. **Create the feature branch** by running the script with `--short-name` (and `--json`):
   - Check `.specify/init-options.json` for `branch_numbering` value
   - Bash: `{SCRIPT} --json --short-name "feature-name" "Full feature description"`
   - Bash (timestamp mode): `{SCRIPT} --json --timestamp --short-name "feature-name" "..."`
   - PowerShell: `{SCRIPT} -Json -ShortName "feature-name" "Full feature description"`
   - Never pass `--number` — script handles numbering
   - Run the script exactly once
   - Parse JSON output for BRANCH_NAME and SPEC_FILE

3. **Load the spec template**: `.specify/templates/spec-template.md`

4. **Build the specification** — fill every section:

   a. **What We're Building**: One plain-English paragraph. No tech stack. No implementation. Just what it does and why users care.

   b. **User Stories**: Ordered P1 → P2 → P3 by value delivered. Each story must answer: "if we shipped ONLY this, would it be demo-able?" If yes — it's a valid story. If no — it's infrastructure, not a story.

   c. **Aesthetic & Experience Requirements** (MANDATORY for any user-facing feature):
      - Visual tone (e.g., minimal, editorial, bold)
      - Dark mode requirement
      - Key UI moments to get right (empty state, error state, loading state)
      - Animation guidance (none / subtle / intentional)
      - This section cannot be "TBD" — make informed design decisions from the feature context

   d. **AI Surface Area** (fill if the feature touches AI in any way):
      - Where AI reads from this feature
      - Where AI writes to this feature
      - Data structure requirements for LLM legibility
      - If truly not applicable — write "N/A — no AI interaction in this feature"

   e. **Functional Requirements**:
      - Split into "Must Have", "Should Have", "Won't Have"
      - "Won't Have" is not optional — always define scope boundaries
      - Maximum 3 [NEEDS CLARIFICATION] markers total — use only for genuinely blocking ambiguities

   f. **Success Criteria**:
      - Must include: at least one aesthetic/UX criterion (e.g., "Design review sign-off")
      - Must include: at least one technical quality criterion (e.g., "Vercel build passes, zero TypeScript errors")
      - Technology-agnostic where possible

5. **Validate the spec**:
   - No implementation details (frameworks, code patterns) leaked into user stories
   - All acceptance scenarios are concrete and testable
   - Aesthetic requirements section is fully filled — no "TBD"
   - Scope is bounded — something is explicitly in the "Won't Have" list
   - Maximum 3 [NEEDS CLARIFICATION] remaining

6. **Handle clarifications** (if any [NEEDS CLARIFICATION] remain):
   Present all questions together, max 3, formatted as option tables. Wait for user response. Update spec.

7. **Write spec** to SPEC_FILE.

8. **Create quality checklist** at `FEATURE_DIR/checklists/requirements.md`:

   ```markdown
   # Spec Quality Checklist: [FEATURE NAME]

   **Feature**: [link to spec.md] | **Created**: [DATE]

   ## Completeness
   - [ ] "What We're Building" — one plain-English paragraph, no tech jargon
   - [ ] All user stories have acceptance scenarios
   - [ ] Aesthetic requirements fully specified (not TBD)
   - [ ] AI surface area documented or marked N/A
   - [ ] "Won't Have" list present and non-empty

   ## Quality
   - [ ] No implementation details in user stories or requirements
   - [ ] Success criteria are measurable
   - [ ] No [NEEDS CLARIFICATION] markers remain
   - [ ] Scope is clearly bounded

   ## Visionaire Standards
   - [ ] Aesthetic requirements include empty, error, and loading states
   - [ ] Success criteria include a design review checkpoint
   - [ ] TypeScript/build quality gate included in success criteria
   ```

9. **Report completion**: branch name, spec path, checklist results, next step (`/speckit.clarify` or `/speckit.plan`).

10. Check `.specify/extensions.yml` for `hooks.after_specify` — process any enabled hooks.

## Quick Guidelines

- Focus on **WHAT** and **WHY** — never HOW
- Aesthetic requirements are mandatory, not optional extras
- "Won't Have" is as important as "Must Have" — scope creep kills launches
- Every story should be independently shippable and demo-able
