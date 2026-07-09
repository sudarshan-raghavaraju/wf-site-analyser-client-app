# Agent Skills

These skills give AI coding agents (Claude Code, etc.) project-specific guidelines to follow **while generating code** for the wf-site-analyser Electron desktop app.

Each skill is a self-contained `SKILL.md` with a YAML frontmatter that tells the agent **when** the skill applies. The agent reads the body for **how** to follow the project's conventions.

## Available skills

| Skill                                         | What it covers                                                                   | Triggered when generating                                                                      |
| --------------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| [`tdd-story`](./tdd-story/SKILL.md)           | TDD workflow for implementing a user story                                       | A story ticket (e.g. SA-601) needs implementation                                              |
| [`a11y`](./a11y/SKILL.md)                     | WCAG 2.2 accessibility patterns (keyboard, ARIA, contrast)                       | Any new UI: components, screens, forms, dialogs                                                |
| [`performance`](./performance/SKILL.md)       | React + Electron renderer performance (memoization, lists, INP)                  | Components with lists, expensive computation, or frequent interactions                         |
| [`security`](./security/SKILL.md)             | Electron security boundaries, type safety, secrets handling                      | New IPC handlers, user input handling, secret storage, anything crossing main/preload/renderer |
| [`component`](./component/SKILL.md)           | Project conventions: file location, naming, Tailwind, Radix, forms, state, tests | Any new component, hook, store, or feature                                                     |
| [`error-handling`](./error-handling/SKILL.md) | ErrorBoundary placement, IPC try/catch, Toast vs modal vs inline, safe logging   | Code that calls IPC, fetches data, parses input, or surfaces failures to users                 |

## How agents use these skills

1. At session start, the agent reads each `SKILL.md` frontmatter and registers the skill by `name` + `description`.
2. When your request matches a skill's description, the agent loads the full `SKILL.md` and follows its instructions for that task.
3. Multiple skills can apply to one task — e.g. generating a new component triggers `component`, `a11y`, and possibly `performance` together.

## Adding a new skill

1. Create a folder under `.claude/skills/<short-name>/`.
2. Add `SKILL.md` with YAML frontmatter at the top:
   ```yaml
   ---
   name: short-name
   description: One sentence describing when this skill should fire.
   allowed-tools: Read, Write, Edit, Glob, Grep
   ---
   ```
3. Write the body as concrete project-specific guidance (what to do, what not to do, examples).
4. Update this README's table with the new skill.

## Source

The `a11y`, `performance`, and `security` skills are inspired by [`addyosmani/web-quality-skills`](https://github.com/addyosmani/web-quality-skills) but **rewritten as code-generation guidelines** (not audit instructions), and adapted to this project's specific stack (Electron, React 19, Tailwind, Radix, Zustand, Vitest).
