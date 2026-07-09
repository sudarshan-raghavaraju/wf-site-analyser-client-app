/**
 * SA-203: Release Notes Display
 *
 * Tests that the ReleaseNotes component renders categorised release-note items
 * with icons, supports basic markdown (bold + links), becomes scrollable for
 * long lists, and hides itself when no notes are provided.
 *
 * Test File: src/renderer/__tests__/components/ReleaseNotes.test.tsx
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { ReleaseNotes, type ReleaseNoteItem } from '@/components/ReleaseNotes';

const baseNotes: ReleaseNoteItem[] = [
  {
    category: 'feature',
    title: 'Enhanced RAG Engine',
    description:
      'Optimised retrieval-augmented generation for **40% faster** site analysis processing.',
  },
  {
    category: 'security',
    title: 'Security Patch 2024.12',
    description: 'Hardened API endpoints and updated encryption protocols for project data.',
  },
  {
    category: 'ui',
    title: 'UI Precision Alignment',
    description: 'Refined typography and tonal layering across all dashboard components.',
  },
];

describe('SA-203 – Release Notes Display', () => {
  // TC-01: Renders release notes from server data
  it('TC-01: renders each note title and description from the provided notes', () => {
    render(<ReleaseNotes notes={baseNotes} />);
    expect(screen.getByText('Enhanced RAG Engine')).toBeInTheDocument();
    expect(screen.getByText('Security Patch 2024.12')).toBeInTheDocument();
    expect(screen.getByText('UI Precision Alignment')).toBeInTheDocument();
  });

  // TC-02: Shows category icons per note
  it('TC-02: renders a category icon for every note', () => {
    render(<ReleaseNotes notes={baseNotes} />);
    expect(screen.getByLabelText(/feature/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/security/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/ui/i)).toBeInTheDocument();
  });

  // TC-03: Scrollable when many notes
  it('TC-03: becomes scrollable when the list grows beyond three notes', () => {
    const manyNotes: ReleaseNoteItem[] = Array.from({ length: 8 }, (_, i) => ({
      category: 'feature' as const,
      title: `Feature ${i + 1}`,
      description: `Description for feature ${i + 1}.`,
    }));
    render(<ReleaseNotes notes={manyNotes} />);
    const list = screen.getByRole('list');
    expect(list.className).toMatch(/overflow-y-auto/);
    expect(list.className).toMatch(/max-h-/);
  });

  // TC-04: Supports markdown (bold + links) in descriptions
  it('TC-04: renders **bold** segments inside a description as a <strong> element', () => {
    render(<ReleaseNotes notes={[baseNotes[0]]} />);
    const bold = screen.getByText('40% faster');
    expect(bold.tagName).toBe('STRONG');
  });

  it('TC-04: renders [label](https://...) segments inside a description as an <a> element', () => {
    const noteWithLink: ReleaseNoteItem = {
      category: 'bugfix',
      title: 'CSV Import Stability',
      description:
        'Fixed a crash when [imported CSVs](https://example.com/docs/csv) contained trailing whitespace rows.',
    };
    render(<ReleaseNotes notes={[noteWithLink]} />);
    const link = screen.getByRole('link', { name: 'imported CSVs' });
    expect(link).toHaveAttribute('href', 'https://example.com/docs/csv');
  });

  // TC-05: Empty release notes hide the section
  it('TC-05: renders nothing when the notes array is empty', () => {
    const { container } = render(<ReleaseNotes notes={[]} />);
    expect(container.firstChild).toBeNull();
  });
});
