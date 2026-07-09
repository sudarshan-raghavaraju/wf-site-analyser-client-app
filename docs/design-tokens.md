# Design Tokens

Design tokens are the single source of truth for all visual values — colors, typography, spacing, border radii, and shadows. They are extracted from Figma, stored as structured JSON, and compiled into CSS custom properties that Tailwind and React components consume.

## Token pipeline

```
Figma file (source of design intent)
    │
    │  extracted via Figma REST API
    ▼
tokens/*.json              ← edit these when values change
    │
    │  npm run build:tokens  (Style Dictionary v5)
    ▼
src/renderer/styles/tokens.css    ← auto-generated, --wf-* CSS custom properties
    │
    │  @import in index.css
    ▼
src/renderer/styles/index.css     ← Tailwind base + token variables in :root
    │
    ├── src/renderer/components/theme.ts   ← JS/TS values for Tailwind config
    └── tailwind.config.ts                 ← Tailwind theme extension
```

Never edit `tokens.css` directly — it is overwritten on every build.

---

## Token source files

All source files live in `tokens/`. Each file owns one category.

### `tokens/color.json`

Organised into semantic groups:

| Group             | Purpose                                                                         |
| ----------------- | ------------------------------------------------------------------------------- |
| `color.primary.*` | Brand blue — default, dark, accent, light, lighter, surface                     |
| `color.neutral.*` | Gray scale — 50 (lightest) → 900 (darkest)                                      |
| `color.surface.*` | Named surfaces — page, card, sidebar, header, dark                              |
| `color.text.*`    | Text roles — primary, secondary, tertiary, muted, placeholder, disabled, subtle |
| `color.border.*`  | Border roles — default, light, subtle                                           |
| `color.success.*` | Green — default, dark, light, surface                                           |
| `color.warning.*` | Amber — default, light, surface                                                 |
| `color.error.*`   | Red — default, dark, surface                                                    |
| `color.info.*`    | Sky blue — default, surface                                                     |
| `color.figma.*`   | Figma input card accent — default, surface                                      |
| `color.csv.*`     | CSV input card accent — default, surface                                        |
| `color.white.*`   | White opacity variants — 20, 50, 70, 80, default                                |
| `color.black.*`   | Black opacity variants — 05, 20, 40                                             |

### `tokens/typography.json`

Primitive tokens only (no composite objects):

| Group               | Values                                 |
| ------------------- | -------------------------------------- |
| `font.family.base`  | `'Inter', system-ui, sans-serif`       |
| `font.size.*`       | xs (12px) → 3xl (48px) — 7 steps       |
| `font.weight.*`     | regular (400), bold (700), black (900) |
| `font.lineHeight.*` | tight (1.1) → looser (1.6) — 6 steps   |

### `tokens/spacing.json`

| Group                    | Values                                                               |
| ------------------------ | -------------------------------------------------------------------- |
| `spacing.*`              | 0–10 → 0px, 4px, 8px, 12px, 16px, 24px, 27px, 30px, 32px, 48px, 64px |
| `size.sidebar-width`     | 240px                                                                |
| `size.header-height`     | 64px                                                                 |
| `size.content-max-width` | 1152px                                                               |
| `size.content-width`     | 1040px                                                               |

### `tokens/border-radius.json`

| Token               | Value  | Usage                   |
| ------------------- | ------ | ----------------------- |
| `borderRadius.sm`   | 4px    | Table rows, small chips |
| `borderRadius.md`   | 8px    | Cards, inputs, buttons  |
| `borderRadius.lg`   | 12px   | Large cards, panels     |
| `borderRadius.xl`   | 16px   | Modals, drawers         |
| `borderRadius.full` | 9999px | Pill / FAB / avatar     |

### `tokens/shadow.json`

| Token                  | Value                          | Usage                  |
| ---------------------- | ------------------------------ | ---------------------- |
| `shadow.sm`            | `0 1px 2px rgba(0,0,0,0.05)`   | Cards, nav bar         |
| `shadow.md`            | `0 10px 15px rgba(0,0,0,0.10)` | Side nav, button hover |
| `shadow.lg`            | `0 25px 50px rgba(0,0,0,0.25)` | FAB, drawers, modals   |
| `shadow.blur-backdrop` | `blur(24px)`                   | Frosted glass nav bar  |

---

## Generated output

`npm run build:tokens` writes three files:

| File                              | Format                           | Use                                        |
| --------------------------------- | -------------------------------- | ------------------------------------------ |
| `src/renderer/styles/tokens.css`  | CSS custom properties in `:root` | Runtime — consumed by Tailwind and raw CSS |
| `src/renderer/styles/tokens.js`   | ES module exports                | Tooling / build scripts                    |
| `src/renderer/styles/tokens.d.ts` | TypeScript declarations          | Type safety in JS consumers                |

All CSS variable names follow the pattern `--wf-<category>-<name>`, for example:

```css
--wf-color-primary-default: #0265dc;
--wf-font-size-sm: 14px;
--wf-spacing-4: 16px;
--wf-border-radius-md: 8px;
--wf-shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
```

---

## How to use tokens in components

**Tailwind classes (preferred):**

```tsx
<div className="bg-surface-card text-text-primary shadow-sm rounded-card p-8">
```

**CSS custom properties (for raw CSS or complex values):**

```css
.my-component {
  background: var(--wf-color-surface-card);
  box-shadow: var(--wf-shadow-md);
  border-radius: var(--wf-border-radius-lg);
}
```

**JS/TS (for dynamic styles or non-CSS consumers):**

```ts
import { tokens } from '@/components/theme';
const style = { color: tokens.colors.primary };
```

---

## Updating tokens manually

1. Edit the relevant file in `tokens/` (read it first).
2. Run `npm run build:tokens` to regenerate `tokens.css`.
3. If a value in `theme.ts` also needs updating, edit it there — Tailwind re-reads it on next build.

Always include `px` units in spacing, font-size, and border-radius values. Bare numbers produce unit-less CSS output which is invalid.

---

## Token governance

A pre-commit hook (`/.husky/pre-commit`) runs automatically whenever any of these files are staged:

- `tokens/*.json`
- `tailwind.config.ts`
- `src/renderer/styles/` (any file)
- `src/renderer/components/theme.ts`
- `style-dictionary.config.json`

The hook runs `.claude/skills/figma-tokens/evals/checks/deterministic.sh` and blocks the commit if any check fails.

**Checks enforced:**

| Check                                             | What it catches                                                    |
| ------------------------------------------------- | ------------------------------------------------------------------ |
| All 5 `tokens/*.json` exist and are valid JSON    | Accidental deletion or malformed edits                             |
| `tokens.css` has `:root` with `--wf-*` properties | Failed or empty build                                              |
| `px` units on spacing, border-radius, font-size   | Bare-number values that produce invalid CSS                        |
| Color values are hex, `rgba()`, or `var()`        | `undefined` or raw number values                                   |
| No `[object Object]` in output                    | Composite typography objects that Style Dictionary can't serialize |
| `index.css` imports `tokens.css` first            | Missing or reordered import that breaks CSS variable resolution    |
| `npm run build:tokens` exits 0                    | Build errors in the Style Dictionary pipeline                      |
| TypeScript: no errors in token files              | Type regressions in `theme.ts` or `tailwind.config.ts`             |

**Run manually at any time:**

```bash
bash .claude/skills/figma-tokens/evals/checks/deterministic.sh
```

**Run the full eval suite** (deterministic + fixture extraction + optional model rubric):

```bash
bash .claude/skills/figma-tokens/evals/run.sh           # deterministic + fixture
bash .claude/skills/figma-tokens/evals/run.sh --rubric  # + Claude rubric grader
```

**Bypass for a draft commit** (use sparingly):

```bash
git commit --no-verify -m "wip: partial token changes"
```

---

## Syncing tokens from Figma

Use the `/figma-tokens` Claude Code skill to automate the full extraction and sync process.

### Prerequisites

- A Figma personal access token — generate one at **Figma → Settings → Security → Personal access tokens**.
- The Figma file URL for this project.

### Running the skill

```
/figma-tokens https://www.figma.com/design/<file-id>/...
```

The skill will:

1. Fetch the full Figma file tree via the REST API.
2. Attempt to read named variables (requires `file_variables:read` scope — falls back to node tree if unavailable).
3. Extract all colors, typography, spacing, radii, and shadows from the design.
4. Diff the extracted values against the existing `tokens/*.json` files.
5. Update only the values that changed.
6. Rebuild `tokens.css` via `npm run build:tokens`.
7. Sync `theme.ts` and `tailwind.config.ts`.
8. Report which token groups changed and flag any tokens absent from the new Figma file.

### Fresh project setup

If `tokens/` does not yet exist, the skill creates all source files, installs Style Dictionary, adds the `build:tokens` script to `package.json`, and wires the CSS import into `index.css`.

### Skill location

`.claude/skills/figma-tokens/SKILL.md`

---

## Style Dictionary configuration

The build is configured in `style-dictionary.config.json` at the project root.

```json
{
  "source": ["tokens/**/*.json"],
  "platforms": {
    "css": {
      "transforms": ["attribute/cti", "name/kebab", "color/css", "fontFamily/css"],
      "prefix": "wf",
      "buildPath": "src/renderer/styles/",
      "files": [
        {
          "destination": "tokens.css",
          "format": "css/variables",
          "options": { "outputReferences": true }
        }
      ]
    }
  }
}
```

The `name/kebab` transform converts `color.primary.default` → `--wf-color-primary-default`.
`outputReferences: true` means aliased tokens output `var()` references rather than resolved values, keeping the CSS self-documenting.
