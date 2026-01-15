// Caminho: frontend/src/components/LoadingOverlay.tsx

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
// Spinner customizado aqui apenas para o overlay (logo dentro do círculo)

interface LoadingOverlayProps {
  visible: boolean;
  text?: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ visible, text = 'Entrando...' }) => {
  const [mounted, setMounted] = useState(false);
  const previousOverflow = useRef<string>();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) {
      return;
    }

    if (visible) {
      previousOverflow.current = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    } else if (previousOverflow.current !== undefined) {
      document.body.style.overflow = previousOverflow.current;
    }

    return () => {
      if (previousOverflow.current !== undefined) {
        document.body.style.overflow = previousOverflow.current;
      }
    };
  }, [visible, mounted]);

  if (!mounted || !visible) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm transition-opacity duration-200">
      <div className="flex flex-col items-center gap-5 rounded-2xl bg-white/5 px-8 py-8 shadow-2xl backdrop-blur">
        <div className="rounded-full bg-white/10 p-4">
          <div className="relative h-20 w-20">
            <div className="absolute inset-0 animate-spin rounded-full border-4 border-gray-500/60 border-t-teal-400" />
            <img src="/vite.svg" alt="Logo" className="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 drop-shadow" />
          </div>
        </div>
        <p className="text-xl font-semibold tracking-wide text-white">
          {text}
        </p>
      </div>
    </div>,
    document.body
  );
};

export default LoadingOverlay;
