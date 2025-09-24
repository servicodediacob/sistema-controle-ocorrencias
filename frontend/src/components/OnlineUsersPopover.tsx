// Caminho: frontend/src/components/OnlineUsersPopover.tsx

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/useAuth';
import { useChat } from '../contexts/ChatProvider'; // Hook para interagir com o contexto do chat

// Interface para o objeto de usuário recebido via WebSocket
interface LoggedInUser {
  id: number;
  nome: string;
  email: string;
}

function OnlineUsersPopover() {
  const { usuario, socket } = useAuth();
  const { openChatWith } = useChat(); // Função para abrir uma nova janela de chat
  
  const [users, setUsers] = useState<LoggedInUser[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Efeito para ouvir a lista de usuários online do servidor
  useEffect(() => {
    if (socket) {
      socket.on('update-logged-in-users', (userList: LoggedInUser[]) => {
        // Filtra para não mostrar o próprio usuário na lista
        setUsers(userList.filter(u => u.id !== usuario?.id));
      });

      // Função de limpeza para remover o listener quando o componente é desmontado
      return () => {
        socket.off('update-logged-in-users');
      };
    }
  }, [socket, usuario]);

  // Efeito para fechar o popover ao clicar fora dele
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Função para iniciar uma conversa ao clicar em um usuário
  const handleUserClick = (userId: number) => {
    openChatWith(userId); // Solicita ao ChatContext para abrir a janela
    setIsOpen(false);     // Fecha o popover após o clique
  };

  return (
    <div className="relative" ref={popoverRef}>
      {/* Ícone e contador no cabeçalho */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center gap-2 rounded-full p-2 text-gray-300 transition hover:bg-gray-700 hover:text-white"
        title="Usuários Online"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
        </svg>
        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-green-600 text-xs font-bold text-white">
          {/* O contador agora mostra o número de *outros* usuários online */}
          {users.length}
        </span>
      </button>

      {/* Dropdown/Popover com a lista de usuários */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 origin-top-right rounded-md bg-gray-700 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="border-b border-gray-600 px-4 py-3">
            <p className="text-sm font-semibold text-white">Iniciar Conversa</p>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {users.length > 0 ? (
              users.map(user => (
                <div key={user.id} onClick={( ) => handleUserClick(user.id)} className="flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-gray-600">
                  <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full bg-green-500"></span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-100">{user.nome}</p>
                    <p className="truncate text-xs text-gray-400">{user.email}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="px-4 py-5 text-center text-sm text-gray-400">Ninguém mais online.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default OnlineUsersPopover;
