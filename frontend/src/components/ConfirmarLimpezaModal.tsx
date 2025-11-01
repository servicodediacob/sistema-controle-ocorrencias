import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}

const ConfirmarLimpezaModal: React.FC<Props> = ({ isOpen, onClose, onConfirm, loading }) => {
  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl border border-border bg-surface p-8 shadow-lg">
        <h2 className="mb-4 text-2xl font-bold text-text-strong">Gerar relatório e limpar dados?</h2>
        <div className="space-y-4 text-text">
          <p>Ao confirmar, as seguintes ações serão executadas:</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>O relatório em PDF será gerado e baixado.</li>
            <li>Os dados estatísticos do ciclo atual serão <strong>permanentemente apagados</strong> para evitar duplicidade.</li>
            <li>Para rever registros de um período específico, use o filtro informando data inicial e final dentro dos últimos 30 dias.</li>
          </ul>
          <p className="font-semibold text-amber-500">
            Esta ação não pode ser desfeita. Deseja continuar?
          </p>
        </div>
        <div className="mt-8 flex justify-end gap-4">
          <button
            onClick={onClose}
            disabled={loading}
            className="rounded-md px-6 py-2 font-semibold text-text transition hover:bg-gray-200 dark:hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex items-center justify-center rounded-md bg-red-700 px-6 py-2 font-semibold text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Processando...' : 'Gerar e Limpar'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ConfirmarLimpezaModal;
