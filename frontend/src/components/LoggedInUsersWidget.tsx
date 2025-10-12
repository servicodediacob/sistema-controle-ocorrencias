import { useEffect, useState } from 'react';
import { useChat } from '../contexts/ChatProvider';
import { useAuth } from '../contexts/AuthProvider';

const formatTimeAgo = (dateString?: string): string => {
  if (!dateString) {
    return 'desconhecido';
  }

  const now = new Date();
  const past = new Date(dateString);
  const seconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  const years = seconds / 31_536_000;
  if (years >= 1) return `${Math.floor(years)} ano${years >= 2 ? 's' : ''}`;

  const months = seconds / 2_592_000;
  if (months >= 1) return `${Math.floor(months)} mês${months >= 2 ? 'es' : ''}`;

  const days = seconds / 86_400;
  if (days >= 1) return `${Math.floor(days)} dia${days >= 2 ? 's' : ''}`;

  const hours = seconds / 3_600;
  if (hours >= 1) return `${Math.floor(hours)}h`;

  const minutes = seconds / 60;
  if (minutes >= 1) return `${Math.floor(minutes)}min`;

  return 'agora';
};

function LoggedInUsersWidget() {
  const { onlineUsers, openChatWith } = useChat();
  const { usuario } = useAuth();
  const [, triggerRerender] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => triggerRerender(Date.now()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const filteredUsers = onlineUsers.filter((user) => user.id !== usuario?.id);

  return (
    <div className="flex min-w-[300px] flex-1 flex-col rounded-lg border border-border bg-surface p-6 text-text">
      <h3 className="mt-0 border-b border-border pb-4 text-lg font-semibold text-text-strong">
        Usuários Online ({filteredUsers.length})
      </h3>
      <div className="mt-4 max-h-60 flex-grow overflow-y-auto">
        {filteredUsers.length > 0 ? (
          <ul className="space-y-3">
            {filteredUsers.map((user) => (
              <li
                key={user.id}
                className="flex items-center justify-between gap-3 rounded-md p-2 transition-colors duration-200 hover:bg-border/50"
              >
                <div className="flex items-center gap-3">
                  <span className="h-3 w-3 flex-shrink-0 rounded-full bg-green-500" />
                  <div>
                    <p className="font-semibold text-text-strong">{user.nome}</p>
                    <p className="text-xs text-text">
                      Online há {formatTimeAgo(user.loginTime)}
                    </p>
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
