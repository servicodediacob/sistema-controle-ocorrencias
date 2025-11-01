// Caminho: frontend/src/components/LoadingOverlay.tsx

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Spinner from './Spinner';

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
      <div className="flex flex-col items-center gap-6 rounded-2xl bg-white/5 px-8 py-10 shadow-2xl backdrop-blur">
        <div className="rounded-full bg-white/10 p-6">
          <Spinner size="lg" />
        </div>
        <p className="text-2xl font-semibold tracking-wide text-white animate-pulse">
          {text}
        </p>
      </div>
    </div>,
    document.body
  );
};

export default LoadingOverlay;
