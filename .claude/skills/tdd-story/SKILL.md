---
name: tdd-story
description: Implement a user story using TDD — reads the story file, finds its test file, implements the component, and runs vitest until all tests are green.
argument-hint: '<story-id>  e.g. SA-601'
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

You are implementing the user story **$ARGUMENTS** using Test-Driven Development.

---

## PHASE 1 — UNDERSTAND

1. Find and read the story file:
   - Search `stories/**/$ARGUMENTS*.md` to locate it.
   - Read it fully: user story, acceptance criteria, design specs, technical notes, and every test case row.

2. Find and read the test file:
   - The story contains a **Test File** field — use that exact path under `src/renderer/__tests__/`.
   - Read every `describe`, `it()`, and assertion. Do not skim.

3. Before writing any code, list out:
   - All files you will create (component, sub-components, hooks, store slices, types)
   - The exact Tailwind classes, aria roles, data-testid values, and IPC calls each test expects

---

## PHASE 2 — IMPLEMENT

> **Apply the `component`, `a11y`, `performance`, and `security` skill conventions
> throughout implementation.** Those skills define file structure, accessible UI patterns,
> Electron boundary rules, and React performance defaults that should be respected at
> every step below.

4. Create all necessary files following the project conventions:
   - Components → `src/renderer/components/`
   - Feature screens → `src/renderer/features/<area>/`
   - Zustand stores → `src/renderer/store/`
   - Hooks → `src/renderer/hooks/`
   - Shared types → `src/shared/types.ts`

5. Tech stack to use:
   - **React 19** — functional components, TypeScript strict mode
   - **Tailwind CSS** — utility classes only, no inline styles
   - **Zustand** — for any global/shared state
   - **React Router v6** — `useParams`, `useNavigate`, `useSearchParams`
   - **Radix UI** — for accessible primitives (Dialog, Switch, Select, DropdownMenu, Tabs)
   - **React Hook Form + Zod** — for any form in the story
   - **window.api** — for all Electron IPC calls (never import electron directly in renderer)

---

## PHASE 3 — TDD LOOP

6. Run the test file:

   ```
   npx vitest run <test-file-path> --reporter=verbose
   ```

7. Read every failure carefully:
   - Identify the exact assertion that fails
   - Fix only the component — never the test file
   - Make the smallest change that fixes the failure

8. Re-run after each fix. Repeat until the output shows every test case as **✓ green**.

9. Once all tests pass, run the full area to catch regressions:
   ```
   npx vitest run src/renderer/__tests__/<area>/ --reporter=verbose
   ```

---

## HARD RULES

- **Never modify a test file** — not even whitespace or imports.
- **Never skip or comment out a test case.**
- **Never add `data-testid`, class names, or aria attributes just to make a test pass** — implement the real behaviour the test describes.
- If a test assertion appears impossible or contradictory, **stop and report it** before continuing.
- The story is only done when **every single test case is green**.
