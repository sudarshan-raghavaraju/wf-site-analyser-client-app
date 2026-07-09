import React from 'react';

type ButtonVariant = 'primary' | 'primary-gradient' | 'secondary' | 'ghost';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  loading?: boolean;
  children: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 border border-transparent',
  'primary-gradient':
    'bg-gradient-to-br from-primary-dark to-primary text-white hover:opacity-90 focus:ring-primary border border-transparent',
  secondary:
    'border border-blue-600 text-blue-600 bg-transparent hover:bg-blue-50 focus:ring-blue-500',
  ghost:
    'text-blue-600 bg-transparent hover:bg-blue-50 focus:ring-blue-500 border border-transparent',
};

export function Button({
  variant = 'primary',
  loading = false,
  disabled,
  children,
  className = '',
  ...props
}: ButtonProps): React.ReactElement {
  const isDisabled = disabled === true || loading;

  return (
    <button
      type="button"
      className={[
        'inline-flex items-center justify-center gap-2 rounded px-4 py-2 text-sm font-medium',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors',
        variantClasses[variant],
        isDisabled ? 'opacity-50 cursor-not-allowed' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      disabled={isDisabled}
      {...props}
    >
      {loading && (
        <span
          role="status"
          aria-label="Loading"
          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      )}
      {children}
    </button>
  );
}
