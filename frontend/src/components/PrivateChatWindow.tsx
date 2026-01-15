// Caminho: frontend/src/components/PrivateChatWindow.tsx

import { useState, useEffect, useRef, useCallback } from 'react';
import { useChat } from '../contexts/ChatProvider';
import { useAuth } from '../contexts/AuthProvider';
import { formatTimestamp } from '../utils/date';
import { registrarAberturaChat, registrarFechamentoChat, registrarMensagemChat } from '../services/auditoriaService';
import './PrivateChatWindow.css'; // Importa o novo CSS

interface PrivateChatWindowProps {
  partnerId: number;
}

function PrivateChatWindow({ partnerId }: PrivateChatWindowProps) {
  const { usuario } = useAuth();
  const { conversations, sendMessage, closeChat, onlineUsers, markMessagesAsSeen } = useChat();
  const [isVisible, setIsVisible] = useState(false);
  
  const [newMessage, setNewMessage] = useState('');
  const messages = conversations[partnerId] || [];
  
  const partner = onlineUsers.find(u => u.id === partnerId);
  const partnerName = partner?.nome || `Usuário ${partnerId}`;
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Efeito para a animação de entrada
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (usuario) {
      registrarAberturaChat(usuario.id, partnerId);
    }
  }, [usuario, partnerId]);

  // Efeito para rolar para a última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const markAsSeen = useCallback(() => {
    markMessagesAsSeen(partnerId);
  }, [markMessagesAsSeen, partnerId]);

  useEffect(() => {
    markAsSeen();
  }, [markAsSeen]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      if (usuario) {
        registrarMensagemChat(usuario.id, partnerId, newMessage);
      }
      sendMessage(partnerId, newMessage);
      markAsSeen();
      setNewMessage('');
    }
  };

  return (
    <div
      className={`chat-window ${isVisible ? 'visible' : ''} flex flex-col bg-surface border border-border shadow-2xl rounded-lg`}
      onMouseEnter={markAsSeen}
      onFocusCapture={markAsSeen}
    >
      {/* Cabeçalho da Janela de Chat */}
      <div className="flex items-center justify-between flex-shrink-0 border-b border-border p-2">
        <div className="flex items-center gap-2 pl-2">
          {/* Indicador de status online */}
          <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full bg-green-500"></span>
          <h3 className="font-semibold text-text-strong truncate text-sm">{partnerName}</h3>
        </div>
        <button 
          onClick={() => {
            if (usuario) {
              registrarFechamentoChat(usuario.id, partnerId);
            }
            markAsSeen();
            closeChat(partnerId);
          }} 
          className="flex items-center justify-center h-8 w-8 rounded-full text-text hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-text-strong"
          title="Fechar conversa"
        >
          <span className="text-2xl font-light">&times;</span>
        </button>
      </div>

      {/* Área de Mensagens */}
      <div className="flex-grow space-y-3 overflow-y-auto p-3">
        {messages.map((msg, index) => {
          const isMe = msg.senderId === usuario?.id;
          return (
            <div key={index} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              <div className={`max-w-[85%] rounded-lg px-3 py-2 ${isMe ? 'bg-teal-600 text-white' : (msg.status === 'visualizado' ? 'bg-gray-600 text-white' : 'bg-gray-800 text-white')}`}>
                <p className="text-sm text-white break-words">{msg.text}</p>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                <span>{formatTimestamp(msg.timestamp)}</span>
                {isMe && (
                  <span title={msg.seenAt ? new Date(msg.seenAt).toLocaleString('pt-BR') : ''}>
                    {msg.status === 'visualizado' ? 'Visualizado' : 'Enviado'}
                  </span>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input de Mensagem */}
      <div className="flex-shrink-0 border-t border-border p-2">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Digite..."
            className="flex-grow rounded-md border border-border bg-background p-2 text-sm text-text-strong focus:outline-none focus:ring-2 focus:ring-teal-500"
            autoFocus
          />
          <button type="submit" className="rounded-md bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700">
            Enviar
          </button>
        </form>
      </div>
    </div>
  );
}

export default PrivateChatWindow;
