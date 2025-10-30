import React, { useState } from 'react';
import { useChat } from '../contexts/ChatProvider';
import { useAuth } from '../contexts/AuthProvider';
import Icon from './Icon';

const USER_ICON_PATH =
  'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z';
const CHEVRON_DOWN_PATH =
  'M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z';

interface OnlineUsersDropdownProps {
  isCollapsed: boolean;
}

const OnlineUsersDropdown: React.FC<OnlineUsersDropdownProps> = ({ isCollapsed }) => {
  const {
    onlineUsers,
    openChatWith,
    unreadCounts,
    totalUnread,
    markConversationAsRead,
  } = useChat();
  const { usuario } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const otherOnlineUsers = onlineUsers.filter((user) => user.id !== usuario?.id);
  const hasUnread = totalUnread > 0;

  if (isCollapsed) {
    return null;
  }

  return (
    <div className="w-full">
      <button
        onClick={() => setIsOpen((value) => !value)}
        className={`flex w-full items-center justify-between rounded-md p-3 text-left transition-colors ${
          hasUnread ? 'bg-red-600/20 text-red-200 hover:bg-red-600/30' : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        <div className="flex items-center gap-4">
          <Icon path={USER_ICON_PATH} />
          <span className="font-semibold">Usuarios Online</span>
        </div>
        <div className="flex items-center gap-2">
          {hasUnread && (
            <>
              <span className="relative inline-flex h-5 w-5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75 animate-ping" />
                <span className="relative inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white">
                  {totalUnread > 99 ? '99+' : totalUnread}
                </span>
              </span>
            </>
          )}
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-bold text-white ${
              hasUnread ? 'bg-red-600' : 'bg-green-500'
            }`}
          >
            {otherOnlineUsers.length}
          </span>
          <Icon
            path={CHEVRON_DOWN_PATH}
            className={`transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {isOpen && (
        <div className="mt-2 max-h-48 overflow-y-auto rounded-md bg-background p-2 shadow-lg">
          {otherOnlineUsers.length > 0 ? (
            <ul className="space-y-1">
              {otherOnlineUsers.map((user) => {
                const unread = unreadCounts[user.id] ?? 0;
                return (
                  <li key={user.id}>
                    <button
                      onClick={() => {
                        openChatWith(user.id);
                        markConversationAsRead(user.id);
                      }}
                      className={`flex w-full items-center justify-between gap-3 rounded p-2 text-left text-sm text-text transition-colors ${
                        unread ? 'bg-red-500/10 hover:bg-red-500/20' : 'hover:bg-gray-700'
                      }`}
                    >
                      <span className="truncate font-medium text-text-strong">{user.nome}</span>
                      <div className="flex items-center gap-2">
                        <span className="relative inline-flex h-2.5 w-2.5">
                          {unread ? (
                            <>
                              <span className="absolute inline-flex h-full w-full rounded-full bg-red-600 opacity-75 animate-ping" />
                              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-600" />
                            </>
                          ) : (
                            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
                          )}
                        </span>
                        <span className="text-xs text-blue-400">Chat</span>
                        {unread ? (
                          <span className="rounded-full bg-red-600 px-1.5 text-xs font-semibold text-white">
                            {unread > 99 ? '99+' : unread}
                          </span>
                        ) : null}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="p-2 text-center text-sm text-gray-500">Nenhum outro usuario online.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default OnlineUsersDropdown;
