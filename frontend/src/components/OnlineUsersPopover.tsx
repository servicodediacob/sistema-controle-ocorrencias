// Caminho: frontend/src/components/OnlineUsersPopover.tsx

import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../contexts/ChatProvider';
import { useAuth } from '../contexts/useAuth';
import Icon from './Icon';

const USER_ICON_PATH = "M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z";

const OnlineUsersPopover: React.FC = () => {
  const { onlineUsers, openChatWith } = useChat();
  const { usuario } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const otherOnlineUsers = onlineUsers.filter(u => u.id !== usuario?.id);

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
        onClick={() => setIsOpen(!isOpen)}
        className="relative rounded-full p-2 text-gray-400 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-white"
        aria-label="Usuários online"
      >
        <Icon path={USER_ICON_PATH} size={24} />
        {otherOnlineUsers.length > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-green-600 text-xs font-bold text-white">
            {otherOnlineUsers.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 origin-top-right rounded-md bg-surface shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none border border-border">
          <div className="py-1">
            <div className="border-b border-border px-4 py-2 text-sm font-semibold text-text-strong">
              Usuários Online ({otherOnlineUsers.length})
            </div>
            <div className="max-h-80 overflow-y-auto">
              {otherOnlineUsers.length > 0 ? (
                otherOnlineUsers.map(user => (
                  <button
                    key={user.id}
                    onClick={() => {
                      openChatWith(user.id);
                      setIsOpen(false);
                    }}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-text transition-colors hover:bg-gray-200 dark:hover:bg-gray-700"
                  >
                    <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full bg-green-500"></span>
                    <div className="flex-1 truncate">
                      <p className="font-semibold text-text-strong">{user.nome}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                    </div>
                  </button>
                ))
              ) : (
                <p className="px-4 py-4 text-center text-sm text-text">
                  Nenhum outro usuário online no momento.
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
