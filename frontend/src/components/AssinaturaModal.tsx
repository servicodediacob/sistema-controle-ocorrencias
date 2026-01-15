
// Caminho: frontend/src/components/AssinaturaModal.tsx

import React, { useEffect, useState } from 'react';

interface AssinaturaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (nome: string, funcao: string) => void;
  defaultNome?: string;
  defaultFuncao?: string;
  loading?: boolean;
}

const AssinaturaModal: React.FC<AssinaturaModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  defaultNome,
  defaultFuncao,
  loading = false,
}) => {
  const [nome, setNome] = useState(defaultNome || '');
  const [funcao, setFuncao] = useState(defaultFuncao || '');

  useEffect(() => {
    if (isOpen) {
      setNome(defaultNome || '');
      setFuncao(defaultFuncao || '');
    }
  }, [isOpen, defaultNome, defaultFuncao]);

  const handleConfirm = () => {
    const nomeLimpo = nome.trim();
    const funcaoLimpa = funcao.trim();

    if (nomeLimpo && funcaoLimpa) {
      onConfirm(nomeLimpo, funcaoLimpa);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl bg-surface border border-border shadow-lg p-8 m-4">
        <h2 className="text-2xl font-bold text-text-strong mb-6">Informações para Assinatura</h2>
        <div className="space-y-6">
          <div>
            <label htmlFor="nome" className="block text-sm font-medium text-text mb-2">
              Nome Completo
            </label>
            <input
              type="text"
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full rounded-md border border-border bg-background p-3 text-text-strong focus:ring-2 focus:ring-primary"
              placeholder="Digite seu nome completo"
            />
          </div>
          <div>
            <label htmlFor="funcao" className="block text-sm font-medium text-text mb-2">
              Função/Cargo
            </label>
            <input
              type="text"
              id="funcao"
              value={funcao}
              onChange={(e) => setFuncao(e.target.value)}
              className="w-full rounded-md border border-border bg-background p-3 text-text-strong focus:ring-2 focus:ring-primary"
              placeholder="Ex: Chefe do COPOM"
            />
          </div>
        </div>
        <div className="mt-8 flex justify-end space-x-4">
          <button
            onClick={onClose}
            disabled={loading}
            className="rounded-md border border-border bg-transparent px-6 py-2 font-semibold text-text-strong transition hover:bg-border/50 focus:outline-none focus:ring-2 focus:ring-border focus:ring-offset-2 focus:ring-offset-surface"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={!nome.trim() || !funcao.trim() || loading}
            className="rounded-md bg-teal-600 px-6 py-2 font-semibold text-white shadow-md transition hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-surface disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Processando...' : 'Confirmar e Baixar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssinaturaModal;
