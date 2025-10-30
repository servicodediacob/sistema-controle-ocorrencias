// Caminho: frontend/src/components/ChatContainer.tsx

import { useChat } from '../contexts/ChatProvider';
import PrivateChatWindow from './PrivateChatWindow';

const ChatContainer = () => {
  // 'openChats' agora é um array de números (IDs dos usuários)
  const { openChats } = useChat();

  const activeChatId = openChats[0];

  if (!activeChatId) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 sm:bottom-0 sm:left-auto sm:right-24 z-50 flex flex-col items-center sm:items-end sm:justify-end gap-4">
      <div key={activeChatId}>
        <PrivateChatWindow partnerId={activeChatId} />
      </div>
    </div>
  )
};

export default ChatContainer;
