import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import Spinner from './Spinner';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onRetry: () => void;
  onConfirm: () => void;
  loading: boolean;
  generatingPreview: boolean;
  previewUrl: string | null;
  previewError: string | null;
  periodoLabel: string;
}

const RelatorioPreviewModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onRetry,
  onConfirm,
  loading,
  generatingPreview,
  previewUrl,
  previewError,
  periodoLabel,
}) => {
  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm px-4">
      <div className="w-full max-w-5xl rounded-xl border border-border bg-surface p-6 shadow-lg">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-text-strong">Pré-visualização do relatório</h2>
            <p className="text-sm text-text-weak">{periodoLabel}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-border px-3 py-1 text-sm font-medium text-text transition hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Fechar
          </button>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[2fr,1fr] xl:grid-cols-[2.3fr,1fr]">
          <div className="min-h-[400px] overflow-hidden rounded-xl border border-border bg-background">
            {generatingPreview ? (
              <div className="flex h-full min-h-[320px] items-center justify-center p-6">
                <Spinner text="Gerando preview..." />
              </div>
            ) : previewError ? (
              <div className="flex flex-col items-center justify-center gap-3 p-6 text-sm text-rose-600">
                <p className="text-center">Não foi possível gerar a pré-visualização.</p>
                <p className="text-center text-text-weak">Verifique sua conexão e tente novamente.</p>
                <button
                  type="button"
                  onClick={onRetry}
                  disabled={generatingPreview}
                  className="rounded-md bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Tentar novamente
                </button>
              </div>
            ) : previewUrl ? (
              <iframe
                title="Pré-visualização do relatório"
                src={previewUrl}
                className="h-full w-full border-0"
              />
            ) : (
              <div className="flex h-full min-h-[320px] flex-col items-center justify-center gap-2 p-6 text-text-weak">
                <p>Não há dados disponíveis para exibir no preview.</p>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4 text-sm text-text">
            <div className="space-y-2 rounded-xl border border-dashed border-border bg-surface p-4">
              <p>
                Ao confirmar, o mesmo PDF exibido aqui será:
              </p>
              <ul className="list-disc space-y-2 pl-4 text-xs text-text-weak">
                <li>Gerado e baixado para o seu dispositivo.</li>
                <li>Os dados do ciclo atual serão apagados para evitar duplicidade.</li>
                <li>Você poderá revisar um novo período usando os filtros de data.</li>
              </ul>
            </div>
            {previewUrl && (
              <a
                href={previewUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-md border border-border px-4 py-2 text-center text-sm font-semibold text-teal-600 transition hover:bg-teal-50"
              >
                Abrir preview em nova aba
              </a>
            )}
            <div className="mt-auto flex flex-wrap gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 min-w-[120px] rounded-md border border-border px-4 py-2 text-sm font-semibold text-text transition hover:bg-gray-100 dark:hover:bg-gray-700"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={loading || generatingPreview}
                className="flex-1 min-w-[160px] rounded-md bg-red-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? 'Processando...' : 'Gerar e limpar'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default RelatorioPreviewModal;
