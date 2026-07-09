---
name: component
description: Follow project conventions when generating any new React component, hook, store, or feature for the wf-site-analyser Electron desktop app. Use for file location, naming, exports, styling, state, forms, and tests.
allowed-tools: Read, Write, Edit, Glob, Grep
---

You are generating new code for the wf-site-analyser Electron desktop app.
Follow the conventions below — they reflect choices already made by the team.

## File locations

| Kind of code                       | Location                                                                 |
| ---------------------------------- | ------------------------------------------------------------------------ |
| Reusable UI primitives             | `src/renderer/components/` (e.g. `Button.tsx`, `Modal.tsx`, `Input.tsx`) |
| Feature screens / area-specific UI | `src/renderer/features/<area>/`                                          |
| Page-level routes                  | `src/renderer/pages/`                                                    |
| Hooks                              | `src/renderer/hooks/`                                                    |
| Zustand stores                     | `src/renderer/store/`                                                    |
| Shared types (cross-process)       | `src/shared/types.ts`                                                    |
| Main process code                  | `src/main/`                                                              |
| Preload (IPC bridge)               | `src/preload/`                                                           |
| Tests                              | `src/renderer/__tests__/<mirrors-source-path>/`                          |

## File & symbol naming

- **Component file:** `PascalCase.tsx` (e.g. `LoginScreen.tsx`).
- **Hook file:** `camelCase.ts` starting with `use` (e.g. `useDebounce.ts`).
- **Store file:** `camelCaseStore.ts` (e.g. `sessionStore.ts`).
- **Test file:** mirror the source file with `.test.tsx` (e.g. `LoginScreen.test.tsx`).
- **Export:** named export, not default — `export function Foo()` not `export default Foo`.

## Component pattern

Use this shape — see `src/renderer/components/Modal.tsx` for a canonical example:

```tsx
import React from 'react';

export interface FooProps {
  // explicit props, no `any`
  open: boolean;
  onClose: () => void;
  className?: string;
}

export function Foo({ open, onClose, className = '' }: FooProps): React.ReactElement {
  return <div className={`base-classes ${className}`}>...</div>;
}
```

### React imports — what's actually needed

- The project is on **React 19 with the new JSX transform**. `'react/react-in-jsx-scope': 'off'` is set in `eslint.config.js`, so **pure JSX no longer requires `import React from 'react'`**.
- **Only import `React`** when you reference the `React.*` namespace — e.g. `React.ReactElement`, `React.ReactNode`, `React.memo`, `React.FC`.
- For hooks and utilities, use named imports: `import { useState, useEffect } from 'react';`.

- Explicit return type `React.ReactElement` (or `JSX.Element`) — no implicit returns.
- Props interface exported alongside the component so consumers can extend.
- Use `className` prop to allow downstream styling.

## Styling

- **Tailwind only** — no inline `style={}` objects, no CSS modules, no styled-components.
- Use the existing design tokens in `src/renderer/components/theme.ts` where they exist.
- For conditional classes, use the array-join pattern from `Modal.tsx`:
  ```tsx
  className={['base', condition && 'extra', className].filter(Boolean).join(' ')}
  ```

### Inline-style exception

Inline `style={}` is acceptable **only** when the value is computed at runtime by a
third-party library and can't be expressed as a static utility class — e.g. virtualizers
that compute pixel offsets, drag-and-drop libraries, or canvas/SVG measurement code.
Comment why. Example:

```tsx
{
  /* @tanstack/react-virtual computes pixel offsets at runtime — these cannot be Tailwind classes */
}
<div style={{ top: virtualRow.start, height: virtualRow.size }} />;
```

## State

- **Local state:** `useState` / `useReducer` — keep state with the component that owns it.
- **Shared state:** Zustand store in `src/renderer/store/`. Subscribe via selectors:
  ```tsx
  const user = useSessionStore((s) => s.user);
  ```
- **Server-ish state (IPC-driven):** Call `window.api.<method>()` directly from `useEffect` or an event handler. Don't reinvent React Query.

## Forms

- Use `react-hook-form` + `zod` (both already installed).
- Declare schema with Zod, infer the TS type from it.
- Validate on submit via `@hookform/resolvers/zod`.

## Electron IPC

- All IPC goes through `window.api.<method>()`.
- Never import `electron` in renderer code (see `security` skill).
- To add a new IPC: declare channel + types in `src/shared/types.ts`, implement handler in `src/main/ipc/`, expose in `src/preload/index.ts`.

## Tests

- Vitest + `@testing-library/react` + `@testing-library/user-event`.
- Test file lives in `src/renderer/__tests__/<mirror-path>/Foo.test.tsx`.
- Test behavior, not implementation — query by role/label/text, not by class name.

### Mock IPC

The global `window.api` is stubbed once in `src/renderer/__tests__/setup.ts` via
`Object.defineProperty(window, 'api', { value: {...} })`. In individual tests, override
specific methods with:

```ts
vi.mocked(window.api['analysis:start']).mockResolvedValue({ id: 'abc' });
```

### Keyboard activation

When testing button-like elements, verify activation via **both `Enter` and `Space`**.
Native `<button>` handles both, but the explicit test catches regressions if the element
is ever switched to a `<div role="button">` (which only auto-handles `Enter`).

```ts
it('activates on Enter', async () => {
  const handleClick = vi.fn();
  render(<CloseButton onClick={handleClick} />);
  screen.getByRole('button').focus();
  await userEvent.keyboard('{Enter}');
  expect(handleClick).toHaveBeenCalledOnce();
});

it('activates on Space', async () => {
  const handleClick = vi.fn();
  render(<CloseButton onClick={handleClick} />);
  screen.getByRole('button').focus();
  await userEvent.keyboard(' ');
  expect(handleClick).toHaveBeenCalledOnce();
});
```

## Never do

- ❌ Default exports.
- ❌ Inline `style={{ ... }}` instead of Tailwind utilities.
- ❌ `any` type (use `unknown` + narrowing).
- ❌ Mutating Zustand store state directly — always go through the store's setter.
- ❌ Importing `electron` in a renderer file.
- ❌ Skipping tests for new components — at minimum, a smoke test.

## Verification before completing the task

1. Is the file in the right folder per the table above?
2. Are exports named (not default)?
3. Are Tailwind utilities used (not inline styles)?
4. Is the prop type interface exported?
5. Is there at least a smoke test in `__tests__/`?
6. Did `npm run typecheck` and `npm run lint` pass on the touched files?

If any answer is wrong, fix it before reporting the work complete.
