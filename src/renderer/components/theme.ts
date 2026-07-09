/**
 * SA-102: Design System — Design Tokens
 *
 * Single source of truth for JS/TS consumers (Tailwind config, components).
 * Values are derived from the Figma file (Site Analyser - E) via Style Dictionary.
 * The canonical token definitions live in /tokens/*.json.
 */

export interface TypographyToken {
  fontSize: string;
  lineHeight: string;
  fontWeight: number;
}

export interface Tokens {
  colors: {
    primary: string;
    neutral: Record<string, string>;
    success: string;
    warning: string;
    'warning-dark': string;
    error: string;
  };
  typography: {
    h1: TypographyToken;
    h2: TypographyToken;
    h3: TypographyToken;
    h4: TypographyToken;
    body: TypographyToken;
    caption: TypographyToken;
    small: TypographyToken;
    xxs: TypographyToken;
    display: TypographyToken;
  };
  spacing: Record<number, string>;
  borderRadius: {
    input: string;
    card: string;
    modal: string;
    full: string;
  };
  shadows: {
    subtle: string;
    medium: string;
    none: string;
  };
}

export const tokens: Tokens = {
  colors: {
    primary: '#0265DC',
    neutral: {
      50: '#F8F9FA',
      100: '#F3F4F5',
      200: '#EDEEEF',
      300: '#E1E3E4',
      400: '#C2C6D6',
      500: '#94A3B8',
      600: '#6B7280',
      700: '#424754',
      800: '#191C1D',
      900: '#0F172A',
      950: '#000000',
    },
    success: '#10B981',
    warning: '#F59E0B',
    'warning-dark': '#92400E',
    error: '#BA1A1A',
  },
  typography: {
    h1: { fontSize: '48px', lineHeight: '1.1', fontWeight: 400 },
    h2: { fontSize: '36px', lineHeight: '1.2', fontWeight: 400 },
    h3: { fontSize: '20px', lineHeight: '1.3', fontWeight: 700 },
    h4: { fontSize: '16px', lineHeight: '1.4', fontWeight: 400 },
    body: { fontSize: '14px', lineHeight: '1.5', fontWeight: 400 },
    caption: { fontSize: '12px', lineHeight: '1.4', fontWeight: 700 },
    small: { fontSize: '12px', lineHeight: '1.4', fontWeight: 400 },
    xxs: { fontSize: '10px', lineHeight: '1.25', fontWeight: 400 },
    display: { fontSize: '30px', lineHeight: '1.25', fontWeight: 400 },
  },
  spacing: {
    4: '4px',
    8: '8px',
    12: '12px',
    16: '16px',
    24: '24px',
    32: '32px',
    48: '48px',
    64: '64px',
  },
  borderRadius: {
    input: '4px',
    card: '8px',
    modal: '12px',
    full: '9999px',
  },
  shadows: {
    subtle: '0 1px 2px rgba(0, 0, 0, 0.05)',
    medium: '0 10px 15px rgba(0, 0, 0, 0.10)',
    none: 'none',
  },
};

export const darkTokens: Pick<Tokens, 'colors'> = {
  colors: {
    primary: '#3B82F6',
    neutral: {
      50: '#000000',
      100: '#0F172A',
      200: '#191C1D',
      300: '#424754',
      400: '#6B7280',
      500: '#94A3B8',
      600: '#C2C6D6',
      700: '#E1E3E4',
      800: '#EDEEEF',
      900: '#F3F4F5',
      950: '#F8F9FA',
    },
    success: '#34D399',
    warning: '#FBBF24',
    'warning-dark': '#92400E',
    error: '#F87171',
  },
};
