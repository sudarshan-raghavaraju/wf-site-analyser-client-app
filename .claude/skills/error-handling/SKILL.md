---
name: error-handling
description: Apply error-handling patterns when generating code that calls IPC, fetches data, parses user input, or runs anything that can fail. Use whenever creating a new feature area, IPC handler, async operation, or component that surfaces errors to the user.
allowed-tools: Read, Write, Edit, Glob, Grep
---

You are generating code for the wf-site-analyser Electron desktop app.
Errors are inevitable — what matters is **what the user sees**, **what gets logged**, and
**whether the app keeps running**. Apply these patterns by default.

## Always do

### Error boundaries (React)

- Wrap **each feature area** in an `ErrorBoundary` (e.g. one around the Analysis screen, one
  around the Chat panel) — not every individual component.
- Boundary rendered fallback should be **useful**: an apology message, a "Retry" button
  (if recoverable), and a link to report the issue. Don't show a blank screen.
- Boundaries don't catch errors inside event handlers, async code, or `useEffect` — only
  rendering errors. Async failures must be handled explicitly (see below).

### IPC calls (`window.api.<method>`)

- **Every** `window.api.<method>()` call must be wrapped in `try/catch`. IPC can fail for
  many reasons: handler threw, channel not registered, main process crashed, validation rejected.
- On failure:
  - Show a user-facing message via `Toast` (the project's existing component) — not a console log
  - Use friendly language: _"Couldn't save your changes. Please try again."_, not the raw error
  - Log the technical detail via the centralized logger (PII-stripped — see below)
  - If recoverable, offer a Retry action

### Async operations in components

- For `useEffect` / event handler async work, use the same try/catch pattern.
- Track state explicitly: `loading`, `error`, `data` — don't conflate them. A loading spinner
  and an error message should never appear simultaneously.

### Surfacing errors to the user — when to use what

- **Toast** — for transient, non-blocking errors the user can recover from
  (network failure, save failed, IPC timeout). User can keep using the app.
- **Inline error text** — for form validation errors next to the input. Pair with
  `aria-invalid="true"` and `aria-describedby` for screen readers.
- **Modal / full-screen fallback** — for blocking errors that require user attention
  (auth expired, data corruption detected, required IPC unavailable). Use sparingly.
- **ErrorBoundary fallback** — only for unexpected render-time crashes. Surface a way to recover.

### Logging

- Use the project's centralized logger (do not sprinkle `console.error` everywhere).
- **Never log:** tokens, passwords, encrypted blobs, full request/response bodies, PII (emails,
  names, IP addresses).
- **Do log:** error name + message, stack trace, IPC channel name, operation timestamp,
  abstract context (e.g. `{ feature: 'auth', op: 'signIn' }`).
- For development debugging only: full payload logs OK behind an `if (import.meta.env.DEV)` guard.

## Never do

- ❌ Swallow errors silently: `catch (e) {}` with nothing in the handler. Always log AND surface
  to the user OR rethrow with context.
- ❌ `console.error(err)` in production code paths — use the project logger.
- ❌ Show raw error messages to users (`TypeError: undefined is not a function` helps nobody).
- ❌ Throw inside `useEffect` cleanup — it's swallowed by React and easily missed.
- ❌ Re-throw without context: `catch (e) { throw e; }` is pointless. Either handle it or wrap
  with more context.
- ❌ Wrap an entire app in one giant `ErrorBoundary` — boundary granularity should match
  feature granularity so one feature's crash doesn't take the whole app down.

## Project-specific patterns

### Canonical IPC try/catch

```ts
async function startAnalysis(config: AnalysisConfig) {
  try {
    setLoading(true);
    const result = await window.api['analysis:start'](config);
    setData(result);
  } catch (err) {
    logger.error('analysis:start failed', { err, feature: 'analysis' });
    toast.error('Couldn’t start analysis. Please try again.');
  } finally {
    setLoading(false);
  }
}
```

### Promise chains — `.then().catch()` (when async/await isn't an option)

If you use the promise-chain form (e.g. inside `useEffect`), the `.catch` handler is
**not optional** and must never be empty. Apply the same rules: log via the project
logger, surface to the user if recoverable, never swallow.

```ts
// ❌ WRONG — silent swallow.
useEffect(() => {
  window.api
    .getAppVersion()
    .then(setVersion)
    .catch(() => {});
}, []);

// ❌ STILL WRONG — bare console.error in production code.
useEffect(() => {
  window.api.getAppVersion().then(setVersion).catch(console.error);
}, []);

// ✅ RIGHT — log with context; decide whether to surface based on feature criticality.
useEffect(() => {
  window.api
    .getAppVersion()
    .then(setVersion)
    .catch((err) => {
      logger.warn('getAppVersion failed', { err, feature: 'app-version-badge' });
      // For non-critical UI, hiding the element (component returns null) is acceptable.
      // For critical operations, surface a Toast.
    });
}, []);
```

**Rule of thumb:** the minimum is one call to `logger`. Surfacing to the user is a separate
decision based on whether the failure affects the user's workflow.

### ErrorBoundary placement

- One per top-level feature: Analysis, Results, Chat, Settings, Auth.
- Place them in the feature's root layout/screen component, not at App.tsx (a single root
  boundary means one feature crash kills the entire app).

### Validation errors

- Zod schemas already in the project — use `safeParse` over `parse`:
  ```ts
  const result = schema.safeParse(input);
  if (!result.success) {
    setFieldErrors(result.error.flatten().fieldErrors);
    return;
  }
  ```
- For react-hook-form forms, pass the Zod resolver — error display is then automatic.

## Verification before completing the task

1. Are all `window.api.<method>()` calls wrapped in `try/catch`?
2. Does every failure path show something to the user (Toast / inline / modal — whichever fits)?
3. Are errors logged via the project logger, not raw `console.error`?
4. Did I check no PII / tokens are in the log payloads?
5. Is there an `ErrorBoundary` around the feature area I'm working in (or did I add one)?
6. Did I avoid silent `catch {}` blocks?

If any answer is wrong, fix it before reporting the work complete.
