// frontend/src/components/LoggedInUsersWidget.tsx

import { useChat } from '../contexts/ChatProvider';
import { useAuth } from '../contexts/useAuth';

function LoggedInUsersWidget() {
  const { onlineUsers, openChatWith } = useChat();
  const { usuario } = useAuth();

  const filteredOnlineUsers = onlineUsers.filter(u => u.id !== usuario?.id);

  return (
    // CORREÇÃO: Adicionado 'flex flex-col' e 'flex-1' para ocupar o espaço disponível.
    <div className="flex flex-col flex-1 rounded-lg bg-surface border border-border p-6 text-text min-w-[300px]">
      <h3 className="mt-0 border-b border-border pb-4 text-lg font-semibold text-text-strong">
        Usuários Online ({filteredOnlineUsers.length})
      </h3>
      {/* CORREÇÃO: Adicionado 'flex-grow' para que a lista ocupe o espaço vertical. */}
      <div className="mt-4 flex-grow max-h-60 overflow-y-auto">
        {filteredOnlineUsers.length > 0 ? (
          <ul className="space-y-3">
            {filteredOnlineUsers.map(user => (
              <li key={user.id} className="flex items-center justify-between gap-3 p-2 rounded-md hover:bg-border/50 transition-colors duration-200">
                <div className="flex items-center gap-3">
                  <span className="h-3 w-3 flex-shrink-0 rounded-full bg-green-500"></span>
                  <div>
                    <p className="font-semibold text-text-strong">{user.nome}</p>
                    <p className="text-xs text-text">{user.email}</p>
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
