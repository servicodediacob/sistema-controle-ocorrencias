// Caminho: frontend/src/components/ChatContainer.tsx
import { useChat } from '../contexts/ChatProvider';
import PrivateChatWindow from './PrivateChatWindow';

const ChatContainer = () => {
  const { openChats, conversations } = useChat();

  return (
    <div className="fixed bottom-0 right-24 z-50 flex items-end gap-4">
      {openChats.map((partnerId: number, index: number) => {
        const messages = conversations[partnerId] || [];
        const partnerName = messages.find(m => m.senderId === partnerId)?.senderName || `Usuário ${partnerId}`;

        return (
          <div
            key={partnerId}
            style={{
              transform: `translateX(-${index * 10}px)`,
            }}
          >
            <PrivateChatWindow
              partnerId={partnerId}
              partnerName={partnerName}
            />
          </div>
        );
      })}
    </div>
  );
};

export default ChatContainer;
