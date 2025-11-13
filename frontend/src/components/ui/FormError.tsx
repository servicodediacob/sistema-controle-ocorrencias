import { ReactNode } from 'react';

const FormError = ({ message }: { message?: ReactNode }) => {
  if (!message) {
    return null;
  }
  return <p className="mt-1 text-sm text-red-400">{message}</p>;
};

export default FormError;
