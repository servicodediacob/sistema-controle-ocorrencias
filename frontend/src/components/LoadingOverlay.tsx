// Caminho: frontend/src/components/LoadingOverlay.tsx

import React from 'react';
import Spinner from './Spinner';

interface LoadingOverlayProps {
  visible: boolean;
  text?: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ visible, text = 'Aguarde...' }) => {
  if (!visible) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm">
      <Spinner size="lg" />
      <p className="mt-4 text-xl font-semibold text-white">{text}</p>
    </div>
  );
};

export default LoadingOverlay;
