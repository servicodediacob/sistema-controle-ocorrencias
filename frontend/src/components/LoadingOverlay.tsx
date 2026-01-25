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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-obsidian/90 backdrop-blur-md transition-opacity duration-200">
      <div className="flex flex-col items-center gap-5 rounded-sm border border-white/10 bg-charcoal/80 px-10 py-8 shadow-[0_0_40px_rgba(0,243,255,0.15)] backdrop-blur-xl">
        <div className="rounded-full bg-obsidian/50 p-4 border border-white/5">
          <div className="relative h-16 w-16">
            <div className="absolute inset-0 animate-spin rounded-full border-2 border-gray-700 border-t-neon-blue shadow-[0_0_15px_#00f3ff]" />
            <img src="/vite.svg" alt="Logo" className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 drop-shadow opacity-80 grayscale brightness-200" />
          </div>
        </div>
        <p className="text-sm font-bold tracking-[0.2em] text-neon-blue font-orbitron uppercase animate-pulse">
          {text}
        </p>
      </div>
    </div>,
    document.body
  );
};

export default LoadingOverlay;
