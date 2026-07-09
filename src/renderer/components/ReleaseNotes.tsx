import { Cog, Shield, Sparkles, Wrench, type LucideProps } from 'lucide-react';
import { type ComponentType, type ReactElement, type ReactNode } from 'react';

import type { ReleaseNote, ReleaseNoteCategory } from '@shared/types';

export type { ReleaseNoteCategory };

export type ReleaseNoteItem = ReleaseNote;

export interface ReleaseNotesProps {
  notes: ReleaseNoteItem[];
  className?: string;
}

const CATEGORY_LABEL: Record<ReleaseNoteCategory, string> = {
  feature: 'Feature',
  security: 'Security',
  ui: 'UI',
  bugfix: 'Bug fix',
};

const CATEGORY_TINT: Record<ReleaseNoteCategory, string> = {
  feature: 'text-primary',
  security: 'text-error',
  ui: 'text-primary-dark',
  bugfix: 'text-warning',
};

const CATEGORY_ICON: Record<ReleaseNoteCategory, ComponentType<LucideProps>> = {
  feature: Cog,
  security: Shield,
  ui: Sparkles,
  bugfix: Wrench,
};

// TODO(SA-202): populate ALLOWED_EXTERNAL_HOSTS dynamically from window.api.getEnv()
// once the update-server-url plumbing is in place. For now the list is hardcoded.
const ALLOWED_EXTERNAL_HOSTS = ['updates.example.com', 'docs.example.com'];

function renderDescription(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  // Match **bold** OR [label](https://url) — https-only so server-supplied
  // links can't render as http:// (mixed-content / downgrade risk).
  const re = /\*\*([^*]+)\*\*|\[([^\]]+)\]\((https:\/\/[^)]+)\)/g;
  let lastIndex = 0;
  let key = 0;
  let match: RegExpExecArray | null = re.exec(text);
  while (match !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    if (match[1]) {
      parts.push(
        <strong key={`s-${key}`} className="font-semibold">
          {match[1]}
        </strong>,
      );
    } else if (match[2] && match[3] && match[3].startsWith('https://')) {
      // Runtime guard in addition to the regex above — defence-in-depth so a
      // future regex change can't silently allow non-https hrefs.
      const href = match[3];
      const label = match[2];
      parts.push(
        <a
          key={`a-${key}`}
          href={href}
          onClick={(e) => {
            e.preventDefault();
            try {
              if (ALLOWED_EXTERNAL_HOSTS.includes(new URL(href).hostname)) {
                window.api['shell:openExternal']?.(href);
              }
            } catch {
              // malformed URL — do nothing
            }
          }}
          rel="noopener noreferrer"
          className="text-blue-600 underline cursor-pointer"
        >
          {label}
        </a>,
      );
    } else if (match[2]) {
      // Non-https link → render as plain text, drop the href.
      parts.push(match[2]);
    }
    key += 1;
    lastIndex = re.lastIndex;
    match = re.exec(text);
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return parts;
}

export function ReleaseNotes({ notes, className = '' }: ReleaseNotesProps): ReactElement | null {
  if (notes.length === 0) return null;

  const isScrollable = notes.length > 3;
  const listClasses = ['flex flex-col gap-4', isScrollable ? 'max-h-52 overflow-y-auto pr-1' : '']
    .filter(Boolean)
    .join(' ');

  const containerClasses = ['flex flex-col gap-3', className].filter(Boolean).join(' ');

  return (
    <section className={containerClasses}>
      <p className="text-xs uppercase tracking-[1.2px] text-neutral-600">Release Notes</p>
      <ul className={listClasses}>
        {notes.map((note) => {
          const Icon = CATEGORY_ICON[note.category];
          return (
            <li
              key={`${note.category}-${note.title}-${note.description}`}
              className="flex gap-3 items-start"
            >
              <span
                role="img"
                aria-label={CATEGORY_LABEL[note.category]}
                className={['mt-0.5 shrink-0', CATEGORY_TINT[note.category]].join(' ')}
              >
                <Icon size={16} aria-hidden="true" />
              </span>
              <div className="flex flex-col gap-1">
                <h4 className="text-sm font-semibold text-neutral-900">{note.title}</h4>
                <p className="text-xs text-neutral-700">{renderDescription(note.description)}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
