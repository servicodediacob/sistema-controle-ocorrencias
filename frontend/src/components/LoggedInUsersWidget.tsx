// Caminho: frontend/src/components/LoggedInUsersWidget.tsx

import { useChat } from '../contexts/ChatProvider';
import { useAuth } from '../contexts/useAuth';
import { useState, useEffect } from 'react'; // <-- 1. IMPORTAR HOOKS

// 2. FUNÇÃO PARA FORMATAR O TEMPO DECORRIDO
const formatTimeAgo = (dateString: string | undefined): string => {
  if (!dateString) return 'desconhecido';

  const now = new Date();
  const past = new Date(dateString);
  const seconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " anos";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " meses";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " dias";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + "h";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + "min";
  return "agora";
};

function LoggedInUsersWidget() {
  const { onlineUsers, openChatWith } = useChat();
  const { usuario } = useAuth();
  const [, setTime] = useState(Date.now()); // 3. ESTADO PARA FORÇAR ATUALIZAÇÃO

  // 4. EFEITO PARA ATUALIZAR O COMPONENTE A CADA MINUTO
  useEffect(() => {
    const interval = setInterval(() => setTime(Date.now()), 60000); // 60000 ms = 1 minuto
    return () => clearInterval(interval);
  }, []);

  const filteredOnlineUsers = onlineUsers.filter(u => u.id !== usuario?.id);

  return (
    <div className="flex flex-col flex-1 rounded-lg bg-surface border border-border p-6 text-text min-w-[300px]">
      <h3 className="mt-0 border-b border-border pb-4 text-lg font-semibold text-text-strong">
        Usuários Online ({filteredOnlineUsers.length})
      </h3>
      <div className="mt-4 flex-grow max-h-60 overflow-y-auto">
        {filteredOnlineUsers.length > 0 ? (
          <ul className="space-y-3">
            {filteredOnlineUsers.map(user => (
              <li key={user.id} className="flex items-center justify-between gap-3 p-2 rounded-md hover:bg-border/50 transition-colors duration-200">
                <div className="flex items-center gap-3">
                  <span className="h-3 w-3 flex-shrink-0 rounded-full bg-green-500"></span>
                  <div>
                    <p className="font-semibold text-text-strong">{user.nome}</p>
                    {/* --- INÍCIO DA ALTERAÇÃO NA RENDERIZAÇÃO --- */}
                    <p className="text-xs text-text">
                      Online há {formatTimeAgo(user.loginTime)}
                    </p>
                    {/* --- FIM DA ALTERAÇÃO NA RENDERIZAÇÃO --- */}
                  </div>
                </div>
                <button 
                  onClick={() => openChatWith(user.id)}
                  className="text-sm text-blue-500 hover:text-blue-400"
                >
                  Chat
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-4 text-center text-text">Nenhum outro usuário online.</p>
        )}
      </div>
    </div>
  );
}

export default LoggedInUsersWidget;
