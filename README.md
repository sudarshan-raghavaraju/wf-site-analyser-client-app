# WF Site Analyser – Client App

Desktop application for analysing web-site UI competency, built with **Electron + React 19 + TypeScript**.

## AI Agent guides

| File                                             | Purpose                                                                                 |
| ------------------------------------------------ | --------------------------------------------------------------------------------------- |
| [`CLAUDE.md`](CLAUDE.md)                         | Claude Code project memory — skills, conventions, commands auto-loaded on every session |
| [`AGENTS.md`](AGENTS.md)                         | Agent-agnostic workflow reference — same procedures written for any AI tool             |
| [`docs/design-tokens.md`](docs/design-tokens.md) | Design token pipeline, token file reference, and Figma sync guide                       |

## Prerequisites

- **Node.js** ≥ 20
- **npm** ≥ 10

## Quick Start

```bash
# Install dependencies
npm install

# Start in development mode (Electron + HMR)
npm run dev

# Run tests
npm test
```

## Scripts

| Command                 | Description                                        |
| ----------------------- | -------------------------------------------------- |
| `npm run dev`           | Launch Electron in dev mode with Vite HMR          |
| `npm run build`         | Compile & bundle for production                    |
| `npm run preview`       | Preview the production build locally               |
| `npm run typecheck`     | Run `tsc --noEmit` (strict)                        |
| `npm test`              | Run all Vitest tests (verbose)                     |
| `npm run test:watch`    | Run Vitest in watch mode                           |
| `npm run test:coverage` | Run tests with V8 coverage                         |
| `npm run build:tokens`  | Rebuild CSS custom properties from `tokens/*.json` |
| `npm run lint`          | ESLint check                                       |
| `npm run format`        | Prettier format                                    |

## Architecture

```
src/
├── main/              # Electron main process
│   ├── index.ts        ← app entry, BrowserWindow creation
│   ├── ipc/            ← IPC handler registrations
│   └── services/       ← native services (storage, updater, etc.)
├── preload/           # Preload scripts
│   └── index.ts        ← contextBridge + typed API surface
├── renderer/          # React app (Vite-bundled)
│   ├── App.tsx         ← root component
│   ├── index.tsx       ← createRoot entry
│   ├── components/     ← reusable UI components
│   ├── pages/          ← route-level page components
│   ├── hooks/          ← custom React hooks
│   ├── store/          ← Zustand state stores
│   ├── styles/         ← Tailwind CSS entry + globals
│   └── utils/          ← pure helpers / formatters
└── shared/            # Cross-process types & constants
    └── types.ts        ← IPC channel names, response types, ElectronAPI
```

### Key Design Decisions

| Concern               | Choice                                                              |
| --------------------- | ------------------------------------------------------------------- |
| Process isolation     | `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true` |
| IPC pattern           | `contextBridge` + `ipcRenderer.invoke` / `ipcMain.handle`           |
| Bundler               | **Vite** via `electron-vite`                                        |
| Styling               | **Tailwind CSS** (utility-first)                                    |
| State management      | **Zustand**                                                         |
| Routing               | **React Router v6**                                                 |
| Accessible primitives | **Radix UI**                                                        |
| Forms                 | **React Hook Form** + **Zod** validation                            |
| Testing               | **Vitest** + **React Testing Library** (`jsdom`)                    |

### Path Aliases

Configured in both `tsconfig.json` and `vitest.config.ts`:

| Alias        | Resolves to      |
| ------------ | ---------------- |
| `@/*`        | `src/renderer/*` |
| `@main/*`    | `src/main/*`     |
| `@shared/*`  | `src/shared/*`   |
| `@preload/*` | `src/preload/*`  |

## Design Tokens

Visual values (colors, typography, spacing, radii, shadows) are managed as structured JSON and compiled into CSS custom properties via [Style Dictionary](https://styledictionary.com/).

```
tokens/*.json  →  npm run build:tokens  →  src/renderer/styles/tokens.css
```

To sync tokens from Figma, use the `/figma-tokens` Claude Code skill:

```
/figma-tokens https://www.figma.com/design/<file-id>/...
```

See **[docs/design-tokens.md](docs/design-tokens.md)** for the full reference — token file structure, CSS variable naming, how to use tokens in components, and how the Figma sync skill works.

### Environment Configuration

Environment-specific variables live in `.env.*` files at the project root:

- `.env` – defaults (development)
- `.env.development` – local dev overrides
- `.env.staging` – staging builds
- `.env.production` – production builds

Key variables: `NODE_ENV`, `APP_STAGE`, `API_BASE_URL`, `UPDATE_SERVER_URL`.

## Git hooks (Husky)

`npm install` runs Husky via the `prepare` script and installs `.husky/pre-commit`. Hooks are modular — each gate lives in its own script and can be toggled independently.

### Layout

```
.husky/
├── pre-commit              # orchestrator — runs enabled hooks in order
├── hooks.local.example     # template for persistent local overrides
├── hooks/
│   ├── token-governance.sh # design-token pipeline checks
│   └── fallow-audit.sh     # fallow static analysis gate
```

### Hooks

| Hook             | Script                      | When it runs                                                                                                                       |
| ---------------- | --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Token governance | `hooks/token-governance.sh` | Staged files match `tokens/`, `tailwind.config`, `src/renderer/styles/`, `theme.ts`, or `style-dictionary.config`                  |
| Fallow audit     | `hooks/fallow-audit.sh`     | Staged files match `src/`, `tokens/`, `package.json`, or TypeScript/Vite/ESLint/Tailwind config, and `fallow` is installed locally |

The local Fallow hook is optional and does not download packages during commit. If `node_modules/.bin/fallow` is present, it audits against `origin/develop`; otherwise it skips locally. The PR workflow still runs Fallow in CI, matching [`.github/workflows/claude-pr-review.yml`](.github/workflows/claude-pr-review.yml).

### Enable or disable hooks

**One-off (single commit):**

```bash
HUSKY_HOOK_TOKEN_GOVERNANCE=0 git commit
HUSKY_HOOK_FALLOW_AUDIT=0 git commit
```

**Persistent local overrides (gitignored):**

```bash
cp .husky/hooks.local.example .husky/hooks.local
# Uncomment lines in hooks.local to disable hooks for all local commits
```

### Run manually

```bash
sh .husky/hooks/token-governance.sh
sh .husky/hooks/fallow-audit.sh
```

---

## Claude PR review (GitHub Actions)

Pull requests targeting `develop` trigger [`.github/workflows/claude-pr-review.yml`](.github/workflows/claude-pr-review.yml):

1. **fallow-audit** — static analysis on changed files (fails on `verdict: fail`)
2. **claude-review** — AI diff review on the PR diff

Generate a token with `claude setup-token` (Claude Pro or Max). Store it as the `CLAUDE_CODE_OAUTH_TOKEN` repository secret — never commit it to source.

| Where the PR is opened             | `CLAUDE_CODE_OAUTH_TOKEN` used                                                      |
| ---------------------------------- | ----------------------------------------------------------------------------------- |
| Fork repo → fork `develop`         | Secret on the **fork**                                                              |
| Upstream repo → upstream `develop` | Secret on **upstream**                                                              |
| Fork → upstream (cross-repo PR)    | **Skipped** — GitHub does not expose secrets to cross-repo `pull_request` workflows |

Use the development workflow below to work in a fork first, then promote changes to upstream for integration.

### Development workflow

#### Initial setup

1. Fork the upstream repository.
2. Sync the `develop` branch on your fork with upstream `develop` (keep it current throughout the project).
3. Add the `CLAUDE_CODE_OAUTH_TOKEN` secret to your **forked** repository (Settings → Secrets and variables → Actions), using a token from `claude setup-token`.

| Approach              | Best for                                  | How                                                                                           |
| --------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------- |
| **Repository secret** | Small team, shared subscription           | One admin sets `CLAUDE_CODE_OAUTH_TOKEN` under **Settings → Secrets and variables → Actions** |
| **Fork secret**       | Contributors working from a personal fork | Set `CLAUDE_CODE_OAUTH_TOKEN` on the **fork** repo (see fork workflow below)                  |

1. Create a feature branch from `develop` on your fork.
2. Implement and commit your changes (conventional commit messages; Husky runs fallow audit and token checks locally).
3. Before opening a PR, sync your fork’s `develop` with upstream `develop`, then rebase or merge `develop` into your feature branch.
4. Open a pull request on your **fork** — feature branch → fork `develop`. This runs fallow-audit and claude-review using the secret on your fork.

Repeat sync → develop → feature branch → fork PR for each feature.

#### Final step (promote to upstream)

When the feature is ready for upstream integration:

1. On the **upstream** repository, create a feature branch from `develop` (same branch name as on your fork, if possible).
2. Push the commits from your fork’s feature branch to that upstream feature branch.

**2. Set your Claude token on the fork**

GitHub does not expose upstream secrets to PRs opened from forks. Store your token on **your fork**:

```bash
export CLAUDE_CODE_OAUTH_TOKEN="sk-ant-oat01-..."
gh secret set CLAUDE_CODE_OAUTH_TOKEN \
  --body "$CLAUDE_CODE_OAUTH_TOKEN" \
  --repo <your-username>/wf-site-analyser-client-app
```

Or via the UI: **your-fork → Settings → Secrets and variables → Actions → New repository secret**.

**3. Branch, commit, push**

Pre-commit hooks run locally (token governance, plus Fallow only when installed locally). Push to your fork:

```bash
git checkout -b feature/my-change
git commit -m "feat: ..."
git push origin feature/my-change
```

**4. Open PR to upstream**

```bash
gh pr create --repo <org>/wf-site-analyser-client-app --base develop --head <your-username>:feature/my-change
```

**5. What runs where**

| PR type                  | Fallow pre-commit (local) | Upstream CI workflow                          | Claude token used                                                             |
| ------------------------ | ------------------------- | --------------------------------------------- | ----------------------------------------------------------------------------- |
| Branch PR (same repo)    | Yes                       | Yes — full review                             | Upstream secret or author's environment                                       |
| Fork PR → upstream       | Yes (local)               | Yes — but **no fork secrets on upstream run** | Upstream must provide token (repo secret or per-user environment on upstream) |
| PR within your fork only | Yes                       | Fork workflow + fork secret                   | Your fork secret                                                              |

For fork PRs into upstream, the Claude review step needs a token configured on the **upstream** repository (shared secret or per-user environment for the PR author). Your fork secret does not flow to upstream's workflow.

**Contributor checklist**

- [ ] Fork cloned, `npm install` (Husky hooks active)
- [ ] `claude setup-token` run locally
- [ ] Token stored on fork (for fork-only CI) **or** upstream admin created your GitHub Environment
- [ ] `origin` points to your fork, `upstream` points to org repo
- [ ] PRs target `develop` on upstream

**Maintainer checklist (upstream)**

- [ ] `CLAUDE_CODE_OAUTH_TOKEN` set as a repo secret **or** per-user GitHub Environments (one per contributor username)
- [ ] [`anthropics/claude-code-action`](https://github.com/anthropics/claude-code-action) OAuth token secret present before enabling the workflow on fork PRs
