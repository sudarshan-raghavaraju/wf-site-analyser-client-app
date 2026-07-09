import type { Config } from 'tailwindcss';
import { tokens } from './src/renderer/components/theme';

export default {
  content: ['./src/renderer/**/*.{ts,tsx,html}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: tokens.colors.primary,
          dark: '#004EAD',
          accent: '#1D4ED8',
          light: '#DBEAFE',
          lighter: '#D8E2FF',
          surface: '#E6EBFF',
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: tokens.colors.primary,
          700: '#1D4ED8',
          800: '#004EAD',
          900: '#0C3877',
          950: '#082349',
        },
        neutral: {
          50: tokens.colors.neutral[50],
          100: tokens.colors.neutral[100],
          150: '#EDEEEF',
          200: tokens.colors.neutral[200],
          250: '#E1E3E4',
          300: tokens.colors.neutral[300],
          400: tokens.colors.neutral[400],
          500: tokens.colors.neutral[500],
          600: tokens.colors.neutral[600],
          650: '#64748B',
          700: tokens.colors.neutral[700],
          750: '#555F6D',
          800: tokens.colors.neutral[800],
          900: tokens.colors.neutral[900],
          950: tokens.colors.neutral[950],
        },
        surface: {
          page: tokens.colors.neutral[50],
          card: '#FFFFFF',
          sidebar: '#F1F5F9',
          header: '#D6E0F1',
          dark: '#0F172A',
        },
        success: {
          DEFAULT: tokens.colors.success,
          dark: '#15803D',
          light: '#22C55E',
          surface: '#DCFCE7',
        },
        warning: {
          DEFAULT: tokens.colors.warning,
          dark: tokens.colors['warning-dark'],
          light: '#F97316',
          surface: '#FFF7ED',
        },
        error: {
          DEFAULT: tokens.colors.error,
          dark: '#8F3500',
          surface: '#FFDBCD',
        },
        info: {
          DEFAULT: '#0EA5E9',
          surface: '#EFF6FF',
        },
        figma: {
          DEFAULT: '#7E22CE',
          surface: '#FAF5FF',
        },
        csv: {
          DEFAULT: '#C2410C',
          surface: '#FFF7ED',
        },
      },
      borderRadius: {
        sm: tokens.borderRadius.input,
        input: tokens.borderRadius.input,
        card: tokens.borderRadius.card,
        lg: tokens.borderRadius.modal,
        modal: tokens.borderRadius.modal,
        xl: '16px',
        full: tokens.borderRadius.full,
      },
      boxShadow: {
        subtle: tokens.shadows.subtle,
        sm: tokens.shadows.subtle,
        medium: tokens.shadows.medium,
        md: tokens.shadows.medium,
        lg: '0 25px 50px rgba(0, 0, 0, 0.25)',
      },
      fontSize: {
        xs: [tokens.typography.small.fontSize, { lineHeight: '1.4' }],
        sm: [tokens.typography.caption.fontSize, { lineHeight: '1.4' }],
        base: [tokens.typography.body.fontSize, { lineHeight: tokens.typography.body.lineHeight }],
        lg: ['18px', { lineHeight: '1.6' }],
        xl: ['20px', { lineHeight: '1.3' }],
        '2xl': [tokens.typography.h2.fontSize, { lineHeight: tokens.typography.h2.lineHeight }],
        '3xl': [tokens.typography.h1.fontSize, { lineHeight: tokens.typography.h1.lineHeight }],
        h1: [
          tokens.typography.h1.fontSize,
          {
            lineHeight: tokens.typography.h1.lineHeight,
            fontWeight: String(tokens.typography.h1.fontWeight),
          },
        ],
        h2: [
          tokens.typography.h2.fontSize,
          {
            lineHeight: tokens.typography.h2.lineHeight,
            fontWeight: String(tokens.typography.h2.fontWeight),
          },
        ],
        h3: [
          tokens.typography.h3.fontSize,
          {
            lineHeight: tokens.typography.h3.lineHeight,
            fontWeight: String(tokens.typography.h3.fontWeight),
          },
        ],
        h4: [
          tokens.typography.h4.fontSize,
          {
            lineHeight: tokens.typography.h4.lineHeight,
            fontWeight: String(tokens.typography.h4.fontWeight),
          },
        ],
        body: [tokens.typography.body.fontSize, { lineHeight: tokens.typography.body.lineHeight }],
        caption: [
          tokens.typography.caption.fontSize,
          { lineHeight: tokens.typography.caption.lineHeight },
        ],
        small: [
          tokens.typography.small.fontSize,
          { lineHeight: tokens.typography.small.lineHeight },
        ],
        label: ['12px', { lineHeight: '1.4', fontWeight: '700', letterSpacing: '0.05em' }],
        'nav-title': ['20px', { lineHeight: '1', fontWeight: '900' }],
        'body-lg': ['18px', { lineHeight: '1.6', fontWeight: '400' }],
        xxs: [tokens.typography.xxs.fontSize, { lineHeight: tokens.typography.xxs.lineHeight }],
        display: [
          tokens.typography.display.fontSize,
          { lineHeight: tokens.typography.display.lineHeight },
        ],
      },
      spacing: {
        4.5: '18px',
        13: '52px',
        15: '60px',
        27: '27px',
        30: '30px',
      },
      width: {
        sidebar: '240px',
      },
      maxWidth: {
        content: '1152px',
      },
      height: {
        header: '64px',
      },
      fontFamily: {
        sans: ["'Inter'", 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
