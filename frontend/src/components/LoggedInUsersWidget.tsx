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
  if (months >= 1) return `${Math.floor(months)} mes${months >= 2 ? 'es' : ''}`;

  const days = seconds / 86_400;
  if (days >= 1) return `${Math.floor(days)} dia${days >= 2 ? 's' : ''}`;

  const hours = seconds / 3_600;
  if (hours >= 1) return `${Math.floor(hours)}h`;

  const minutes = seconds / 60;
  if (minutes >= 1) return `${Math.floor(minutes)}min`;

  return 'agora';
};

function LoggedInUsersWidget() {
  const { onlineUsers, openChatWith, unreadCounts, markConversationAsRead } = useChat();
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
        Usuarios Online ({filteredUsers.length})
      </h3>
      <div className="mt-4 max-h-60 flex-grow overflow-y-auto">
        {filteredUsers.length > 0 ? (
          <ul className="space-y-3">
            {filteredUsers.map((user) => {
              const unread = unreadCounts[user.id] ?? 0;
              return (
                <li
                  key={user.id}
                  className={`flex items-center justify-between gap-3 rounded-md p-2 transition-colors duration-200 ${
                    unread ? 'border border-red-500/40 bg-red-500/5 hover:bg-red-500/10' : 'hover:bg-border/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="relative h-3 w-3 flex-shrink-0">
                      {unread ? (
                        <span className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75 animate-ping" />
                      ) : null}
                      <span
                        className={`relative inline-flex h-3 w-3 rounded-full ${
                          unread ? 'bg-red-600' : 'bg-green-500'
                        }`}
                      />
                    </span>
                    <div>
                      <p className="font-semibold text-text-strong">{user.nome}</p>
                      <p className="text-xs text-text">Online ha {formatTimeAgo(user.loginTime)}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      openChatWith(user.id);
                      markConversationAsRead(user.id);
                    }}
                    className="flex items-center gap-2 text-sm text-blue-500 transition-colors hover:text-blue-400"
                  >
                    Chat
                    {unread ? (
                      <span className="rounded-full bg-red-600 px-1.5 text-xs font-semibold text-white">
                        {unread > 99 ? '99+' : unread}
                      </span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="py-4 text-center text-text">Nenhum outro usuario online.</p>
        )}
      </div>
    </div>
  );
}

export default LoggedInUsersWidget;
