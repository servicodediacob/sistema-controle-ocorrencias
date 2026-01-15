import { forwardRef, InputHTMLAttributes } from 'react';

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(({ className = '', ...props }, ref) => (
  <input
    ref={ref}
    className={`w-full rounded-md border border-border bg-background px-3 py-2 text-text focus:border-blue-400 focus:outline-none focus-visible:ring-1 focus-visible:ring-blue-400 ${className}`}
    {...props}
  />
));

Input.displayName = 'Input';

export default Input;
