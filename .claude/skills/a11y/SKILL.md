---
name: a11y
description: Apply WCAG 2.2 accessibility patterns when generating any new UI code (components, screens, forms, dialogs) for the wf-site-analyser Electron desktop app. Use whenever creating or modifying interactive UI elements.
allowed-tools: Read, Write, Edit, Glob, Grep
---

You are generating UI code for the wf-site-analyser Electron desktop app.
Apply these accessibility patterns **by default** — they are not optional.

## Always do

### Keyboard

- Every interactive element must be reachable via `Tab` and operable with `Enter`/`Space`.
- Use semantic HTML: `<button>` for buttons, `<a>` for links, `<input>` for inputs.
- Use Radix UI primitives (already in the project) for complex widgets — they handle focus and ARIA correctly:
  - `@radix-ui/react-dialog` for modals (see `src/renderer/components/Modal.tsx`)
  - `@radix-ui/react-dropdown-menu` for menus
  - `@radix-ui/react-select` for select inputs
  - `@radix-ui/react-switch` for toggles
  - `@radix-ui/react-tabs` for tab interfaces
- Trap focus inside modals; restore focus to the trigger when closed (Radix handles this automatically).

### Labels & landmarks

- Every form input needs a linked `<label>` (`htmlFor` matching input `id`), or an associated `aria-label` / `aria-labelledby`.
- Icon-only buttons need `aria-label` (see how `Modal.tsx` labels the close button `aria-label="Close"`).
- The SVG icon **inside** an icon-only button needs `aria-hidden="true"` so the screen reader
  doesn't read the SVG title in addition to the button's `aria-label` (avoids double announcement).
- Use semantic landmarks: `<main>`, `<nav>`, `<header>`, `<footer>` — not generic `<div>`s.

### When NOT to add `aria-label`

- **Don't add `aria-label` to elements whose visible text already conveys their meaning.**
  Screen readers will announce the text content; an `aria-label` that duplicates (or worse,
  contradicts) it produces noise and confusion.
- ❌ `<button aria-label="Save">Save</button>` — redundant; visible text is already the accessible name.
- ✅ Add `aria-label` only when:
  - The element has **no visible text** (icon-only buttons, decorative anchors)
  - The visible text is **ambiguous** (`<a>Click here</a>` → add `aria-label="Read the docs"`)
  - You need to provide a **fuller description** the visible text can't carry — and even then,
    prefer `aria-describedby` pointing to nearby text over a duplicated `aria-label`.

### Live regions (status announcements)

- Use `aria-live="polite"` (or `role="status"`) for non-urgent updates the user should know about —
  scan progress, save confirmations, info toasts. See `Toast.tsx` and `Input.tsx` for the
  project's canonical implementations.
- Use `role="alert"` (or `aria-live="assertive"`) **only for errors and critical interruptions** —
  it preempts what the screen reader is currently saying. Don't overuse.
- For loading spinners, use `role="status" aria-label="Loading"` on the spinner element
  (see `Button.tsx` for the canonical pattern). Screen readers announce the loading state without
  the user having to look at the spinner.

### Visual

- Color contrast: **4.5:1** minimum for body text, **3:1** for large text and UI components.
- Never convey information by color alone — always pair with icon or text.
- Visible focus ring on all interactive elements. Use Tailwind's `focus:ring-2 focus:ring-blue-500` pattern (see `Modal.tsx`).
- Honor `prefers-reduced-motion` for any animation — use Tailwind's `motion-safe:` / `motion-reduce:` variants.

### Images & media

- All `<img>` need `alt`:
  - Descriptive `alt` for informational images
  - Empty `alt=""` for purely decorative images
- Don't put information critical to comprehension inside images of text.

## Never do

- ❌ `<div onClick>` instead of `<button>` — breaks keyboard and screen readers.
- ❌ Remove focus indicators without providing an alternative (no naked `outline: none`).
- ❌ Use placeholder text as the only label for a form input.
- ❌ Use `tabindex` values other than `0` or `-1` (positive values break tab order).
- ❌ Set `aria-hidden="true"` on a focusable element.

## Project-specific patterns

- **Radix UI** is already installed — use it for Dialog, DropdownMenu, Select, Switch, Tabs by default.
- **Tailwind** is the styling system — use utility classes only, no inline styles.
- **Forms** — use `react-hook-form` + `zod` (both already installed). Hook Form gives accessible error messages.
- See `src/renderer/components/Modal.tsx` for a canonical accessibility-correct component (labels, `aria-labelledby`, focus management via Radix).

## Verification before completing the task

Run this mental check on every interactive element you generated:

1. Can I `Tab` to it?
2. Does it have a label (visible or `aria-label`)?
3. Is the contrast sufficient?
4. Does it work without color?
5. Does it have a visible focus indicator?
6. If it's an icon-only button, does the inner SVG have `aria-hidden="true"`?
7. If it announces status (loading, progress, errors), is it inside a live region?

If any answer is no, fix it before reporting the work complete.
