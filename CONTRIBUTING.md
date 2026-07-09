# Contributing to WF Site Analyser

## Testing

### Test stack

| Layer                 | Tool                           | What to test                                           |
| --------------------- | ------------------------------ | ------------------------------------------------------ |
| Shared utils / stores | Vitest                         | Pure functions, Zustand store actions, type validators |
| React components      | Vitest + React Testing Library | Render output, user interaction, state changes         |
| IPC handlers          | Vitest                         | Main-process handlers with mocked Electron APIs        |
| Full app flows        | Playwright                     | Navigation, form submission, Electron window behaviour |

### Running tests

```bash
npm test                # Run all Vitest unit/component tests once
npm run test:watch      # Watch mode — re-runs on file change
npm run test:coverage   # Run with V8 coverage (HTML + lcov reports in ./coverage/)
npm run test:e2e        # Run Playwright E2E tests (requires E2E_ENABLED=true + built app)
```

### Writing unit / component tests

Test files live alongside the code they test or in `src/renderer/__tests__/<area>/`.

```ts
// src/renderer/__tests__/components/MyComponent.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { MyComponent } from '@/components/MyComponent';

describe('MyComponent', () => {
  it('renders the expected heading', () => {
    render(<MyComponent title="Hello" />);
    expect(screen.getByRole('heading', { name: /hello/i })).toBeInTheDocument();
  });
});
```

### Mocking IPC / Electron APIs

`window.api` is mocked globally in `src/renderer/__tests__/setup.ts`.
Every `vi.fn()` mock resets between tests via `beforeEach(() => vi.clearAllMocks())`.

Override a single mock inside a test:

```ts
vi.mocked(window.api.getAppVersion).mockResolvedValueOnce('9.9.9');
```

### Coverage thresholds

Coverage is enforced by Vitest at **≥ 50%** for lines, functions, branches, and statements.
Running `npm run test:coverage` will fail the process if any metric drops below the threshold.

Coverage is measured over `src/**/*.{ts,tsx}` excluding test files, entry points, and
`features/**` / `services/**` (which are excluded until their own tests are added).

### Writing E2E tests

E2E tests live in `e2e/` and use `@playwright/test` with Electron's `_electron.launch()`.

```ts
// e2e/my-flow.spec.ts
import { test, expect, _electron as electron } from '@playwright/test';
import path from 'path';

test('my flow works end-to-end', async () => {
  test.skip(!process.env.E2E_ENABLED, 'requires built app + E2E_ENABLED=true');

  const app = await electron.launch({
    args: [path.join(process.cwd(), 'out/main/index.js')],
  });
  const window = await app.firstWindow();
  // ... assertions
  await app.close();
});
```

Build the app first, then run:

```bash
npm run build
E2E_ENABLED=true npm run test:e2e
```

### Conventions

- **Never modify a test file to make it pass** — fix the implementation instead.
- **No `test.skip`** without a comment explaining when to un-skip.
- **No `@ts-ignore`** in test files — fix the type.
- Use `getByRole` > `getByLabelText` > `getByText` > `getByTestId` (in that priority order).
- Prefer `userEvent` over `fireEvent` for user interactions.
- Each test file must import only from `@testing-library/*`, `vitest`, and project aliases (`@/`).
