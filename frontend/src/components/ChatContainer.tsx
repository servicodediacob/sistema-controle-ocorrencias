// Caminho: frontend/src/components/ChatContainer.tsx

import { useChat } from '../contexts/ChatProvider';
import PrivateChatWindow from './PrivateChatWindow';

const ChatContainer = () => {
  // 'openChats' agora é um array de números (IDs dos usuários)
  const { openChats } = useChat();

  return (
    <div className="fixed bottom-0 left-0 right-0 sm:bottom-0 sm:left-auto sm:right-24 z-50 flex flex-col-reverse items-center sm:flex-row sm:items-end sm:justify-end gap-4">
      {/* Mapeia os IDs dos chats abertos para renderizar cada janela */}
      {openChats.map((userId) => (
        <div key={userId}>
          <PrivateChatWindow partnerId={userId} />
        </div>
      ))}
    </div>
  )
};

export default ChatContainer;
