import React, { useEffect, useRef, useState } from 'react';
import { useChat } from '../contexts/ChatProvider';
import { useAuth } from '../contexts/AuthProvider';
import Icon from './Icon';

const USER_ICON_PATH =
  'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z';

const OnlineUsersPopover: React.FC = () => {
  const { onlineUsers, openChatWith, unreadCounts, totalUnread, markConversationAsRead } = useChat();
  const { usuario } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const otherOnlineUsers = onlineUsers.filter((user) => user.id !== usuario?.id);
  const hasUnreadMessages = totalUnread > 0;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={popoverRef}>
      <button
        onClick={() => setIsOpen((open) => !open)}
        className={`relative rounded-full p-2 transition focus:outline-none focus:ring-2 focus:ring-white ${
          hasUnreadMessages
            ? 'bg-red-600/20 text-red-300 hover:bg-red-600/30 hover:text-red-100'
            : 'text-gray-400 hover:bg-gray-700 hover:text-white'
        }`}
        aria-label={hasUnreadMessages ? 'Novas mensagens privadas' : 'Usuarios online'}
      >
        <Icon path={USER_ICON_PATH} size={24} />
        {hasUnreadMessages && (
          <>
            <span className="pointer-events-none absolute -top-1 -right-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white shadow-lg">
              {totalUnread > 99 ? '99+' : totalUnread}
            </span>
            <span className="pointer-events-none absolute -top-1 -right-1 inline-flex h-5 w-5 rounded-full bg-red-600 opacity-75 blur-[1px] animate-ping" />
          </>
        )}
        {otherOnlineUsers.length > 0 && (
          <span
            className={`pointer-events-none absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold text-white ${
              hasUnreadMessages ? 'bg-red-600' : 'bg-green-600'
            }`}
          >
            {otherOnlineUsers.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 origin-top-right rounded-md border border-border bg-surface shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1">
            <div className="border-b border-border px-4 py-2 text-sm font-semibold text-text-strong">
              Usuarios Online ({otherOnlineUsers.length})
            </div>
            <div className="max-h-80 overflow-y-auto">
              {otherOnlineUsers.length > 0 ? (
                otherOnlineUsers.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => {
                      openChatWith(user.id);
                      markConversationAsRead(user.id);
                      setIsOpen(false);
                    }}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm text-text transition-colors hover:bg-gray-200 dark:hover:bg-gray-700"
                  >
                    <div className="flex items-center gap-3">
                      <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full bg-green-500" />
                      <div className="truncate">
                        <p className="font-semibold text-text-strong">{user.nome}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                      </div>
                    </div>
                    {unreadCounts[user.id] ? (
                      <div className="flex items-center gap-1.5">
                        <span className="relative inline-flex h-2.5 w-2.5">
                          <span className="absolute inline-flex h-full w-full rounded-full bg-red-600 opacity-75 animate-ping" />
                          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-600" />
                        </span>
                        <span className="text-xs font-semibold text-red-600">
                          {unreadCounts[user.id] > 99 ? '99+' : unreadCounts[user.id]}
                        </span>
                      </div>
                    ) : null}
                  </button>
                ))
              ) : (
                <p className="px-4 py-4 text-center text-sm text-text">
                  Nenhum outro usuario online no momento.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OnlineUsersPopover;
