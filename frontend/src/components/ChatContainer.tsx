// Caminho: frontend/src/components/ChatContainer.tsx

import { useChat } from '../contexts/ChatProvider';
import PrivateChatWindow from './PrivateChatWindow';

const ChatContainer = () => {
  // 'openChats' agora é um array de números (IDs dos usuários)
  const { openChats } = useChat();

  return (
    <div className="fixed bottom-0 right-24 z-50 flex items-end gap-4">
      {/* Mapeia os IDs dos chats abertos para renderizar cada janela */}
      {openChats.map((userId, index) => (
        <div
          key={userId}
          style={{
            // Empilha as janelas de chat da direita para a esquerda
            transform: `translateX(-${index * 10}px)`,
          }}
        >
          <PrivateChatWindow partnerId={userId} />
        </div>
      ))}
    </div>
  );
};

export default ChatContainer;
