// Caminho: frontend/src/components/PwaInstallPrompt.tsx

import React, { useEffect, useRef, useState } from 'react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

const isStandaloneDisplay = () => {
  try {
    // Padrão (Chrome, Android)
    if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) return true;
    // iOS Safari
    // @ts-ignore
    if (typeof navigator !== 'undefined' && (navigator as any).standalone) return true;
  } catch {}
  return false;
};

const isMobileUA = () => /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
const isIOS = () => /iPhone|iPad|iPod/i.test(navigator.userAgent);

const DISMISS_KEY = '@siscob:pwaPromptDismissed';
const INSTALLED_KEY = '@siscob:pwaInstalled';

const PwaInstallPrompt: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [showIosHelp, setShowIosHelp] = useState(false);
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Se já instalado, não mostra
    if (isStandaloneDisplay()) {
      try { localStorage.setItem(INSTALLED_KEY, '1'); } catch {}
      return;
    }

    const dismissed = (() => { try { return localStorage.getItem(DISMISS_KEY) === '1'; } catch { return false; } })();
    const mobile = isMobileUA();

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      deferredPromptRef.current = e as BeforeInstallPromptEvent;
      if (!dismissed && mobile) {
        setVisible(true);
      }
    };

    const onAppInstalled = () => {
      try { localStorage.setItem(INSTALLED_KEY, '1'); } catch {}
      setVisible(false);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall as EventListener);
    window.addEventListener('appinstalled', onAppInstalled);

    // iOS: não dispara beforeinstallprompt; ainda assim podemos exibir instrução uma vez
    if (mobile && isIOS() && !dismissed) {
      // aguarda um pequeno tempo para não brigar com outros overlays
      const t = window.setTimeout(() => setVisible(true), 800);
      return () => {
        window.removeEventListener('beforeinstallprompt', onBeforeInstall as EventListener);
        window.removeEventListener('appinstalled', onAppInstalled);
        window.clearTimeout(t);
      };
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall as EventListener);
      window.removeEventListener('appinstalled', onAppInstalled);
    };
  }, []);

  if (!visible) return null;

  const handleInstallClick = async () => {
    const dp = deferredPromptRef.current;
    if (dp) {
      try {
        await dp.prompt();
        const choice = await dp.userChoice;
        if (choice.outcome === 'accepted') {
          try { localStorage.setItem(INSTALLED_KEY, '1'); } catch {}
          setVisible(false);
        } else {
          try { localStorage.setItem(DISMISS_KEY, '1'); } catch {}
          setVisible(false);
        }
      } catch {
        try { localStorage.setItem(DISMISS_KEY, '1'); } catch {}
        setVisible(false);
      }
    } else {
      // iOS instruções
      setShowIosHelp(true);
    }
  };

  const handleDismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, '1'); } catch {}
    setVisible(false);
  };

  return (
    <div className="fixed inset-x-0 bottom-4 z-[1100] flex justify-center px-3">
      <div className="glass-panel w-full max-w-md rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-white shadow-xl">
        <div className="flex items-start gap-3">
          <img src="/vite.svg" alt="logo" className="mt-0.5 h-6 w-6 flex-shrink-0" />
          <div className="flex-1 text-sm">
            {showIosHelp ? (
              <>
                <div className="font-semibold">Instale para usar offline</div>
                <div className="opacity-90">
                  No iOS, toque em Compartilhar e depois em "Adicionar à Tela de Início".
                </div>
              </>
            ) : (
              <>
                <div className="font-semibold">App Offline disponível</div>
                <div className="opacity-90">Instale este app no seu aparelho para uso rápido e offline.</div>
              </>
            )}
          </div>
        </div>
        <div className="mt-3 flex justify-end gap-2">
          <button onClick={handleDismiss} className="rounded-md bg-gray-600/70 px-3 py-1.5 text-xs font-semibold hover:bg-gray-600">Agora não</button>
          <button onClick={handleInstallClick} className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold hover:bg-blue-500">Instalar</button>
        </div>
      </div>
    </div>
  );
};

export default PwaInstallPrompt;

