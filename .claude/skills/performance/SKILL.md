---
name: performance
description: Apply React + Electron renderer performance patterns when generating new code. Use when creating components, lists, expensive computations, or any UI that handles large data sets or frequent user interactions.
allowed-tools: Read, Write, Edit, Glob, Grep
---

You are generating performance-sensitive code for the wf-site-analyser Electron desktop app.
The renderer is Chromium-based, so standard React/web performance patterns apply.

## Always do

### Memoization (use deliberately, not reflexively)

- `useMemo` for expensive computations that depend on stable inputs.
- `useCallback` for callbacks passed to memoized children (e.g. `React.memo` components).
- `React.memo` for components rendered inside large lists, when props are stable.
- Avoid wrapping everything — over-memoization adds overhead and obscures bugs.

### Lists & large data

- Always set a **stable, unique `key`** on list items — never use the array index unless the list is static and unordered.
- For lists over 100 items, consider virtualization (e.g. windowed rendering).
- For tables, paginate or stream — don't render thousands of rows at once.

### Interaction responsiveness (INP)

- Long-running work should be broken up:
  - Use `requestIdleCallback` for low-priority work
  - Use `scheduler.yield()` (where available) to break up long tasks
  - Defer non-essential third-party work to after first interaction
- Provide immediate visual feedback (spinner, optimistic UI) before any computation > 100ms.
- Avoid blocking the main thread with synchronous heavy work in event handlers.

### Offload CPU-bound work to the main process

- The renderer is the wrong place for crawling, parsing HTML, file I/O, heavy data transforms,
  or anything that takes more than ~200ms of sync CPU. It freezes the UI.
- Move that work into an IPC handler in `src/main/ipc/`. The renderer calls it via
  `window.api.<method>()` and shows a loading state while awaiting the result.
- For long-running operations, push progress events back to the renderer (see `onUpdateStatus`
  in `src/preload/index.ts` for the subscription pattern with a cleanup return).

### React 19 — useTransition and useDeferredValue

- Use `useTransition` to mark a state update as non-urgent (e.g. switching tabs in a results view
  while a heavy filter recomputes). Keeps the UI responsive during the update.
- Use `useDeferredValue` when rendering a derived value that's expensive to compute and may lag
  behind input (e.g. filtering thousands of analysis rows as the user types).
- Both are React 19 first-class APIs — prefer them over manual `setTimeout` deferral hacks.

### Code splitting

- Use `React.lazy()` + `<Suspense>` for route-level splitting via `react-router-dom`.
- Avoid importing entire libraries when only one function is needed — use named imports.
- Tree-shake aggressively: prefer ES modules over CommonJS imports.

### State scope

- Keep state local to the component that needs it.
- Lift state up only when shared.
- Use Zustand stores only for genuinely shared/global state (auth, project, session) — not for component-local UI state.

### Images & assets

- Use modern formats (AVIF/WebP) with fallbacks.
- Specify `width`/`height` on images to prevent layout shift.
- Lazy-load images below the fold with `loading="lazy"`.

## Never do

- ❌ Update state inside `useEffect` without checking if the new value differs (causes infinite loops).
- ❌ Create new objects/arrays inline as props to memoized children (defeats memoization).
- ❌ Use `index` as `key` in dynamic lists — causes incorrect re-renders.
- ❌ Run synchronous work over ~50ms in event handlers (freezes the UI).
- ❌ Subscribe to a Zustand store without a selector — pulls in the whole state every change.

## Project-specific patterns

- **Zustand** (already installed): use selectors `useStore((state) => state.foo)` to subscribe to a slice only.
- **React Router v6**: use `<Outlet />` for nested layouts; lazy-load route components.
- **Electron IPC** (via `window.api`): IPC calls are async — never block the renderer waiting for them. Show a loading state.
- **Vitest** tests should run fast — mock IPC and external calls, don't actually hit the file system.

## Verification before completing the task

1. Are list `key` props stable and unique?
2. Are expensive computations or callbacks memoized only where they cross a `React.memo` boundary?
3. Is any work over ~50ms run synchronously in an event handler? If so, can it be deferred?
4. Is Zustand subscribed via a selector?
5. Are large images lazy-loaded with explicit `width`/`height`?

If any answer reveals a problem, fix it before reporting the work complete.
