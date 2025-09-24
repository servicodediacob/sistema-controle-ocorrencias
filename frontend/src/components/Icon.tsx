// frontend/src/components/Icon.tsx

import React from 'react';

// Este é o nosso ícone de fallback. Ele será exibido se um ícone solicitado não for encontrado.
const ICONE_DE_ERRO_PATH = "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z";

interface IconProps {
  path: string | undefined; // A prop 'path' agora pode ser undefined
  iconName?: string; // Prop opcional para nos ajudar no diagnóstico
  size?: number;
  className?: string;
}

const Icon: React.FC<IconProps> = ({ path, iconName, size = 24, className = '' }) => {
  // --- LÓGICA DE DIAGNÓSTICO E CORREÇÃO ---
  if (typeof path !== 'string' || path.trim() === '') {
    // 1. Se o path for inválido (undefined, nulo, ou vazio), logamos um erro detalhado.
    console.error(
      `[Diagnóstico de Ícone] Tentativa de renderizar um ícone inválido. ` +
      `O ícone com o nome '${iconName || 'desconhecido'}' não foi encontrado no objeto ICONS. ` +
      `Verifique se a chave existe e se o valor do path do SVG é uma string válida.`
    );

    // 2. Em vez de quebrar, renderizamos um ícone de erro substituto com um viewBox válido.
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24" // viewBox válido
        fill="red" // Cor vermelha para chamar a atenção
        className={`flex-shrink-0 ${className}`}
        aria-label={`Ícone de erro para ${iconName}`}
      >
        <path d={ICONE_DE_ERRO_PATH}></path>
      </svg>
    );
  }

  // Se o path for válido, renderiza o ícone normalmente com um viewBox válido.
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24" // viewBox válido
      fill="currentColor"
      className={`flex-shrink-0 ${className}`}
    >
      <path d={path}></path>
    </svg>
  );
};

export default Icon;
