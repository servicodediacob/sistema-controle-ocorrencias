// Caminho: frontend/src/components/PrivateChatWindow.tsx

import { useState, useEffect, useRef } from 'react';
import { useChat } from '../contexts/ChatProvider';
import { useAuth } from '../contexts/useAuth';

interface PrivateChatWindowProps {
  partnerId: number;
  partnerName: string;
}

function PrivateChatWindow({ partnerId, partnerName }: PrivateChatWindowProps) {
  const { usuario } = useAuth();
  const { conversations, sendMessage, closeChat } = useChat();
  
  const [newMessage, setNewMessage] = useState('');
  const messages = conversations[partnerId] || [];
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Efeito para rolar para a última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      sendMessage(partnerId, newMessage);
      setNewMessage('');
    }
  };

  return (
    <div className="flex h-[400px] w-72 flex-col rounded-lg bg-gray-800 shadow-2xl border border-gray-700">
      {/* Cabeçalho da Janela de Chat */}
      <div className="flex items-center justify-between flex-shrink-0 border-b border-gray-700 p-2">
        <h3 className="font-semibold text-white truncate text-sm pl-2">{partnerName}</h3>
        <button 
          onClick={() => closeChat(partnerId)} 
          className="flex items-center justify-center h-8 w-8 rounded-full text-gray-400 hover:bg-gray-600 hover:text-white"
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
              <div className={`max-w-[85%] rounded-lg px-3 py-2 ${isMe ? 'bg-teal-600' : 'bg-gray-600'}`}>
                <p className="text-sm text-white break-words">{msg.text}</p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input de Mensagem */}
      <div className="flex-shrink-0 border-t border-gray-700 p-2">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Digite..."
            className="flex-grow rounded-md border border-gray-600 bg-gray-700 p-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
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
