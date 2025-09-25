// Caminho: frontend/src/components/LoggedInUsersWidget.tsx

import { useChat } from '../contexts/ChatProvider';
import { useAuth } from '../contexts/useAuth';

function LoggedInUsersWidget() {
  const { onlineUsers, openChatWith } = useChat();
  const { usuario } = useAuth();

  const filteredOnlineUsers = onlineUsers.filter(u => u.id !== usuario?.id);

  return (
    <div className="mt-6 w-full rounded-lg bg-surface border border-border p-6 lg:mt-0">
      <h3 className="mt-0 border-b border-border pb-4 text-lg font-semibold text-text-strong">
        Usuários Online ({filteredOnlineUsers.length})
      </h3>
      <div className="mt-4 max-h-60 overflow-y-auto">
        {filteredOnlineUsers.length > 0 ? (
          <ul className="space-y-3">
            {filteredOnlineUsers.map(user => (
              <li key={user.id} className="flex items-center justify-between gap-3 p-2 rounded-md hover:bg-border/50 cursor-pointer transition-colors duration-200">
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
          <p className="py-4 text-center text-text">Nenhum usuário online.</p>
        )}
      </div>
    </div>
  );
}

export default LoggedInUsersWidget;
