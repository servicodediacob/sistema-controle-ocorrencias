import { forwardRef, SelectHTMLAttributes } from 'react';

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  hasError?: boolean;
};

const Select = forwardRef<HTMLSelectElement, SelectProps>(({ className = '', hasError, ...props }, ref) => (
  <select
    ref={ref}
    className={`w-full rounded-md border px-3 py-2 text-text focus:outline-none focus-visible:ring-1 ${
      hasError ? 'border-red-500 focus-visible:ring-red-400' : 'border-border focus-visible:ring-blue-400'
    } ${className}`}
    {...props}
  />
));

Select.displayName = 'Select';

export default Select;
