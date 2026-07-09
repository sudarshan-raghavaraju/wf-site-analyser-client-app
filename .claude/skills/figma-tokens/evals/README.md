# figma-tokens — Evals

Evaluation suite for the `/figma-tokens` skill. Verifies that the token sync pipeline produces correct, well-formed output after every run.

No Figma credentials are required for the deterministic and fixture steps.

---

## Directory layout

```
evals/
├── README.md                   — this file
├── run.sh                      — orchestration: runs all steps in order
├── prompts.csv                 — eval dataset (12 scenarios across 4 categories)
├── rubric-schema.json          — JSON schema for model-grader output
├── grade-rubric.sh             — model-assisted qualitative grader (needs claude CLI)
├── fixtures/
│   ├── figma-stub.json         — minimal Figma document tree for offline testing
│   └── figma-variables-error.json  — mock 403 response for variables endpoint
└── checks/
    ├── deterministic.sh        — 21 file-based assertions, no credentials needed
    └── test-extraction.js      — runs extraction logic against the fixture
```

---

## Running the evals

### Fast path — no credentials required

```bash
bash .claude/skills/figma-tokens/evals/run.sh
```

Runs two steps:

1. **Deterministic checks** — 21 assertions against the current state of the repo
2. **Fixture extraction test** — Node.js script exercising the extraction logic against `fixtures/figma-stub.json`

Prerequisites: `jq`, `node`

### Full path — includes model-assisted rubric

```bash
bash .claude/skills/figma-tokens/evals/run.sh --rubric
```

Adds a third step that sends the current token files to Claude and scores them against 6 qualitative checks, returning structured JSON.

Prerequisites: `jq`, `node`, `claude` CLI

### Run a single step

```bash
bash .claude/skills/figma-tokens/evals/checks/deterministic.sh
node  .claude/skills/figma-tokens/evals/checks/test-extraction.js
bash .claude/skills/figma-tokens/evals/grade-rubric.sh
```

---

## What each step checks

### Deterministic checks (`checks/deterministic.sh`)

| Category               | Check                                                                  |
| ---------------------- | ---------------------------------------------------------------------- |
| Source files           | All 5 `tokens/*.json` files exist and are valid JSON                   |
| `tokens.css` structure | `:root` block present, `--wf-*` properties exist, no `[object Object]` |
| Units                  | `px` on border-radius, font-size, and spacing values                   |
| Color format           | Values are hex, `rgba()`, or `var(--wf-*)` aliases                     |
| Import order           | `index.css` first line is `@import './tokens.css'`                     |
| Build                  | `npm run build:tokens` exits 0                                         |
| TypeScript             | No errors in theme/tailwind/token files                                |

### Fixture extraction test (`checks/test-extraction.js`)

Runs the same extraction logic embedded in `SKILL.md` step 5 against `fixtures/figma-stub.json`. Asserts:

- 8 colors extracted, all valid hex
- 5 text nodes found (Inter family, sizes 12/14/20/36/48px)
- 2 spacing frames with correct padding values
- 4 corner radii: 4, 8, 12, 9999
- 2 drop shadows with valid hex colors
- Variables-error fixture is parseable JSON with `error: true`

### Rubric grader (`grade-rubric.sh`)

Sends `tokens.css`, `tokens/color.json`, `tokens/typography.json`, and `theme.ts` to Claude for model-assisted scoring. Six checks:

| Check                     | What it catches                                                 |
| ------------------------- | --------------------------------------------------------------- |
| `color_values_valid`      | `undefined` or bare numbers in `--wf-color-*` values            |
| `spacing_has_px`          | Missing `px` on spacing and border-radius vars                  |
| `typography_no_composite` | `[object Object]` from composite typography tokens              |
| `semantic_groups_present` | Missing success / warning / error / info groups in `color.json` |
| `theme_primary_matches`   | `theme.ts` primary hex diverged from `color.json`               |
| `no_token_leaked`         | Figma personal access token committed to a file                 |

Returns JSON matching `rubric-schema.json` with an `overall_pass` boolean and a 0–100 score.

---

## Prompt dataset (`prompts.csv`)

12 scenarios used to verify the skill is invoked (or not invoked) correctly:

| Category   | Count | Description                                     |
| ---------- | ----- | ----------------------------------------------- |
| Explicit   | 2     | Directly references `/figma-tokens` with a URL  |
| Implicit   | 3     | Describes the scenario without naming the skill |
| Contextual | 3     | Real-world phrasing with a Figma URL in context |
| Negative   | 4     | Should **not** trigger the skill                |

---

## Pre-commit hook

The deterministic checks also run automatically as a pre-commit hook (`.husky/pre-commit`) whenever token-pipeline files are staged. See [docs/design-tokens.md — Token governance](../../../../docs/design-tokens.md#token-governance).
