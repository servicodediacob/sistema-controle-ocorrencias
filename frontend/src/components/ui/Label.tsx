import { LabelHTMLAttributes } from 'react';

type LabelProps = LabelHTMLAttributes<HTMLLabelElement>;

export const Label = ({ className = '', ...props }: LabelProps) => (
  <label className={`block text-sm font-medium text-text-strong mb-1 ${className}`} {...props} />
);

export default Label;
