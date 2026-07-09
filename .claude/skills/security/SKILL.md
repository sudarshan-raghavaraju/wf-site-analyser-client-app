---
name: security
description: Apply security patterns when generating code for the wf-site-analyser Electron desktop app. Use whenever creating IPC handlers, handling user input, rendering dynamic content, storing secrets, or touching Electron main / preload / renderer boundaries.
allowed-tools: Read, Write, Edit, Glob, Grep
---

You are generating code for an Electron application. Electron has a unique security model — the renderer is a sandboxed browser context, the main process has full Node.js access, and communication happens over IPC. Most security bugs in Electron apps come from blurring these boundaries.

## Always do

### Electron process isolation

- **Never** import the `electron` module directly in renderer code (`src/renderer/**`).
- **Always** use `window.api.<method>()` in the renderer — methods are defined in `src/preload/index.ts` and bridged via `contextBridge`.
- IPC handlers in `src/main/ipc/` use `ipcMain.handle()` with channels declared in `src/shared/types.ts` (`IPC_CHANNELS`).
- Subscriptions returned by preload methods (e.g. `onUpdateStatus`) must return a cleanup function. Renderers must call it on unmount to prevent memory leaks.
- Web preferences in `BrowserWindow` (see `src/main/index.ts`): `contextIsolation: true`, `sandbox: true`, `nodeIntegration: false`. Never weaken these.
- **Set a strict Content-Security-Policy** on every `BrowserWindow`. Minimum acceptable:
  `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;`
  No `unsafe-eval`. Inline scripts must be removed before relying on `'unsafe-inline'`. CSP is item #1 on
  Electron's official security checklist.

### Type safety

- **Never** use `any`. Use `unknown` and narrow with a type guard (or a Zod schema, which is already installed).
- All IPC channel inputs and return types must be declared in `src/shared/types.ts` so main, preload, and renderer agree.
- Use Zod to validate any data crossing a boundary (IPC, network, file).

### Rendering untrusted content

- **Never** use `dangerouslySetInnerHTML` with user-supplied or remote content.
- If you must render HTML, sanitize with a library (e.g. DOMPurify). Prefer rendering as text.
- Don't construct URLs by string concatenation — use `URL` / `URLSearchParams`.

### Secrets & sensitive data

- Use Electron's `safeStorage` via `window.api['safeStorage:encrypt' | 'safeStorage:decrypt' | 'safeStorage:delete']` for tokens, passwords, API keys.
- Never log secrets, tokens, or user PII — even in `console.log` during development.
- Never commit `.env` files — they're gitignored, keep it that way.
- API base URLs come from `IPC_CHANNELS.GET_ENV` — never hardcode them.

### External resources

- Pin third-party scripts/stylesheets with Subresource Integrity hashes when fetched from CDN.
- Use HTTPS for all network calls — no plain HTTP.
- Validate redirects — don't follow user-supplied URLs blindly.

## Never do

- ❌ `import { ipcRenderer } from 'electron'` in renderer code — breaks contextIsolation.
- ❌ `eval()` or `new Function()` — both opens code injection paths.
- ❌ `dangerouslySetInnerHTML={{ __html: userInput }}` — XSS vector.
- ❌ `as any` to bypass a type error — fix the underlying type instead.
- ❌ Log full request/response bodies that may contain tokens or PII.
- ❌ Disable Electron security features (`contextIsolation`, `sandbox`) to "make it work."

## Project-specific patterns

- **Adding a new IPC method:**
  1. Add the channel name to `IPC_CHANNELS` in `src/shared/types.ts`.
  2. Declare the request/response types alongside the channel.
  3. Implement the handler in `src/main/ipc/index.ts` using `ipcMain.handle`.
  4. Expose it through `electronAPI` in `src/preload/index.ts`.
  5. Call from renderer via `window.api.<method>()`.
- **Storing user data:** use `IPC_CHANNELS.STORE_SET` / `STORE_GET` / `STORE_DELETE`. For secrets, use `safeStorage:*` variants.
- **`shell.openExternal` safety:** the renderer can request an external URL open via
  `window.api['shell:openExternal'](url)`. The main-process handler **must** validate the URL before
  calling Electron's `shell.openExternal`:
  - Parse via `new URL(url)` — reject anything that throws
  - Allow only `https:` scheme (no `file:`, `javascript:`, `data:`)
  - Optionally restrict to an allow-list of known domains
  - Never pass user-supplied strings to `shell.openExternal` without these checks

## Verification before completing the task

1. Did I import `electron` in any renderer file? (Must be no.)
2. Did I introduce any `any` types? (Must be no.)
3. Is any user input rendered without sanitization? (Must be no.)
4. Are secrets going through `safeStorage`, never plain `storeSet`?
5. Are new IPC types declared in `src/shared/types.ts`?
6. Did I log anything that could contain secrets?
7. Is a strict CSP defined on every `BrowserWindow` I created or modified?
8. If I used `shell.openExternal`, did I validate the URL scheme and host first?

If any answer is wrong, fix it before reporting the work complete.
