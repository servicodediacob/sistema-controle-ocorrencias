// Caminho: frontend/src/components/Spinner.tsx

import React from 'react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

const Spinner: React.FC<SpinnerProps> = ({ size = 'md', text }) => {
  const sizeClasses = {
    sm: 'h-6 w-6 border-2',
    md: 'h-10 w-10 border-4',
    lg: 'h-16 w-16 border-4',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4 p-4">
      <div
        className={`animate-spin rounded-full border-gray-500 border-t-teal-400 ${sizeClasses[size]}`}
        role="status"
        aria-label="Carregando..."
      />
      {text && <p className="text-gray-400">{text}</p>}
    </div>
  );
};

export default Spinner;
