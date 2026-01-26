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
    <div className="relative z-50" ref={popoverRef}>
      <button
        onClick={() => setIsOpen((open) => !open)}
        className={`relative rounded-full p-2 transition-all duration-300 focus:outline-none focus:ring-1 focus:ring-neon-blue ${hasUnreadMessages
            ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.4)]'
            : 'text-gray-400 hover:text-white hover:bg-white/10'
          }`}
        aria-label={hasUnreadMessages ? 'Novas mensagens privadas' : 'Usuarios online'}
      >
        <Icon path={USER_ICON_PATH} size={24} />
        {hasUnreadMessages && (
          <>
            <span className="pointer-events-none absolute -top-1 -right-1 inline-flex h-5 w-5 items-center justify-center rounded-sm bg-red-600 text-[10px] font-bold font-orbitron text-white shadow-lg border border-red-400">
              {totalUnread > 99 ? '99+' : totalUnread}
            </span>
            <span className="pointer-events-none absolute -top-1 -right-1 inline-flex h-5 w-5 rounded-sm bg-red-600 opacity-75 blur-[2px] animate-ping" />
          </>
        )}
        {otherOnlineUsers.length > 0 && !hasUnreadMessages && (
          <span
            className="pointer-events-none absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-sm text-[10px] font-bold font-orbitron text-white bg-green-600 shadow-[0_0_10px_#22c55e] border border-green-400"
          >
            {otherOnlineUsers.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-4 w-80 origin-top-right rounded-sm border border-white/10 bg-black/80 backdrop-blur-xl shadow-[0_0_30px_rgba(0,0,0,0.8)]">
          {/* Header Glint */}
          <div className="absolute top-0 left-0 h-[1px] w-full bg-gradient-to-r from-transparent via-neon-blue/50 to-transparent"></div>

          <div className="py-1">
            <div className="border-b border-white/10 px-4 py-3 text-xs font-bold font-orbitron uppercase tracking-widest text-gray-300 flex justify-between items-center bg-white/5">
              <span>Usuários Online</span>
              <span className="text-neon-blue drop-shadow-[0_0_5px_rgba(0,243,255,0.5)]">{otherOnlineUsers.length}</span>
            </div>

            <div className="max-h-80 overflow-y-auto custom-scrollbar">
              {otherOnlineUsers.length > 0 ? (
                otherOnlineUsers.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => {
                      openChatWith(user.id);
                      markConversationAsRead(user.id);
                      setIsOpen(false);
                    }}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm text-gray-300 transition-colors hover:bg-white/10 font-rajdhani border-b border-white/5 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <span className="block h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e]" />
                      </div>
                      <div className="truncate">
                        <p className="font-bold text-white tracking-wide">{user.nome}</p>
                        <p className="text-[10px] uppercase tracking-wider text-gray-500">{user.email}</p>
                      </div>
                    </div>
                    {unreadCounts[user.id] ? (
                      <div className="flex items-center gap-1.5">
                        <span className="relative inline-flex h-2 w-2">
                          <span className="absolute inline-flex h-full w-full rounded-full bg-red-600 opacity-75 animate-ping" />
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-red-600 shadow-[0_0_8px_#ef4444]" />
                        </span>
                        <span className="text-[10px] font-bold font-orbitron text-red-500">
                          {unreadCounts[user.id] > 99 ? '99+' : unreadCounts[user.id]}
                        </span>
                      </div>
                    ) : null}
                  </button>
                ))
              ) : (
                <p className="px-4 py-6 text-center text-xs text-gray-500 font-rajdhani uppercase tracking-widest">
                  Nenhum outro usuário online.
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
