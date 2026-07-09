/**
 * Vitest v3 + jest-dom v6 compatibility shim.
 *
 * jest-dom's `toHaveValue` uses strict equality (===) for scalar values, so
 * asymmetric matchers like `expect.stringMatching(...)` always fail. This
 * shim overrides `toHaveValue` to delegate to `asymmetricMatch` when the
 * expected value is an asymmetric matcher.
 */
import { expect as vitestExpect } from 'vitest';

interface AsymmetricMatcher {
  asymmetricMatch: (received: unknown) => boolean;
}

function isAsymmetricMatcher(value: unknown): value is AsymmetricMatcher {
  return (
    value !== null &&
    typeof value === 'object' &&
    typeof (value as Record<string, unknown>).asymmetricMatch === 'function'
  );
}

function getSelectValue(el: HTMLSelectElement): string | string[] {
  if (el.multiple) {
    return Array.from(el.options)
      .filter((o) => o.selected)
      .map((o) => o.value);
  }
  return el.value;
}

function getInputValue(el: HTMLElement): string | string[] | number | boolean | null {
  const tag = el.tagName.toLowerCase();
  const type = (el as HTMLInputElement).type?.toLowerCase();
  if (tag === 'select') return getSelectValue(el as HTMLSelectElement);
  if (tag === 'textarea') return (el as HTMLTextAreaElement).value;
  if (type === 'number') {
    const v = (el as HTMLInputElement).value;
    return v === '' ? null : Number(v);
  }
  if (type === 'checkbox' || type === 'radio') return (el as HTMLInputElement).checked;
  return (el as HTMLInputElement).value;
}

function toHaveValueMatcher(
  this: { isNot: boolean },
  element: HTMLElement,
  expectedValue: unknown,
) {
  if (isAsymmetricMatcher(expectedValue)) {
    const actual = getInputValue(element);
    const pass = expectedValue.asymmetricMatch(actual);
    return {
      pass,
      message: () =>
        pass
          ? `Expected element NOT to have value matching ${String(expectedValue)}\nReceived: ${String(actual)}`
          : `Expected element to have value matching ${String(expectedValue)}\nReceived: ${String(actual)}`,
    };
  }
  const actual = getInputValue(element);
  const pass = expectedValue === undefined ? true : actual === expectedValue;
  return {
    pass,
    message: () =>
      pass
        ? `Expected element NOT to have value: ${String(expectedValue)}\nReceived: ${String(actual)}`
        : `Expected element to have value: ${String(expectedValue)}\nReceived: ${String(actual)}`,
  };
}

vitestExpect.extend({ toHaveValue: toHaveValueMatcher });
