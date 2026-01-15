import { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-blue-600 text-white hover:bg-blue-500 focus-visible:ring-blue-400',
  secondary: 'bg-surface text-text hover:bg-surface/80 border border-border focus-visible:ring-surface',
  danger: 'bg-red-600 text-white hover:bg-red-500 focus-visible:ring-red-400',
  ghost: 'bg-transparent text-text hover:bg-surface/70 focus-visible:ring-border',
};

export const Button = ({ variant = 'primary', className = '', children, ...props }: ButtonProps) => (
  <button
    className={`rounded-md px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background ${variantClasses[variant]} ${className}`}
    {...props}
  >
    {children}
  </button>
);

export default Button;
