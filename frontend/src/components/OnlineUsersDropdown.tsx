// Caminho: frontend/src/components/OnlineUsersDropdown.tsx

import React, { useState } from 'react';
import { useChat } from '../contexts/ChatProvider';
import { useAuth } from '../contexts/AuthProvider';
import Icon from './Icon';

// Ícones para o componente
const USER_ICON_PATH = "M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z";
const CHEVRON_DOWN_PATH = "M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z";

interface OnlineUsersDropdownProps {
  isCollapsed: boolean;
}

const OnlineUsersDropdown: React.FC<OnlineUsersDropdownProps> = ({ isCollapsed }) => {
  const { onlineUsers, openChatWith } = useChat();
  const { usuario } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const otherOnlineUsers = onlineUsers.filter(u => u.id !== usuario?.id);

  if (isCollapsed) {
    return null;
  }

  return (
    <div className="w-full">
      {/* ======================= INÍCIO DA CORREÇÃO ======================= */}
      {/* Botão que controla a visibilidade do dropdown */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        // Classes de estilo alteradas para adicionar um fundo azul e texto branco
        className="flex w-full items-center justify-between rounded-md bg-blue-600 p-3 text-left text-white transition-colors hover:bg-blue-700"
      >
        <div className="flex items-center gap-4">
          <Icon path={USER_ICON_PATH} />
          <span className="font-semibold">Usuários Online</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-green-500 px-2 py-0.5 text-xs font-bold text-white">
            {otherOnlineUsers.length}
          </span>
          <Icon
            path={CHEVRON_DOWN_PATH}
            className={`transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </button>
      {/* ======================= FIM DA CORREÇÃO ======================= */}

      {/* Lista de usuários (o dropdown em si) */}
      {isOpen && (
        <div className="mt-2 max-h-48 overflow-y-auto rounded-md bg-background p-2">
          {otherOnlineUsers.length > 0 ? (
            <ul className="space-y-1">
              {otherOnlineUsers.map(user => (
                <li key={user.id}>
                  <button
                    onClick={() => openChatWith(user.id)}
                    className="flex w-full items-center justify-between gap-3 rounded p-2 text-left text-sm text-text transition-colors hover:bg-gray-700"
                  >
                    <span className="truncate font-medium text-text-strong">{user.nome}</span>
                    <span className="text-xs text-blue-500 hover:text-blue-400">Chat</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="p-2 text-center text-sm text-gray-500">
              Nenhum outro usuário online.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default OnlineUsersDropdown;
