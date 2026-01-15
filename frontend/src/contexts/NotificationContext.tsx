// Caminho: frontend/src/contexts/NotificationContext.tsx

import React, { createContext, useState, useContext, ReactNode, useCallback, useRef } from 'react';
import styled, { keyframes } from 'styled-components';

// ======================= INÍCIO DA CORREÇÃO =======================
// Adicionado 'warning' aos tipos permitidos
export type NotificationType = 'success' | 'error' | 'info' | 'warning';
// ======================= FIM DA CORREÇÃO =======================

export interface INotification {
  id: number;
  message: string;
  type: NotificationType;
}
interface INotificationContext {
  addNotification: (message: string, type: NotificationType) => void;
}

const NotificationContext = createContext<INotificationContext | null>(null);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<INotification[]>([]);
  const idCounterRef = useRef(0);

  const removeNotification = useCallback((id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const addNotification = useCallback((message: string, type: NotificationType) => {
    idCounterRef.current += 1;
    const id = idCounterRef.current;
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => removeNotification(id), 5000);
  }, [removeNotification]);

  return (
    <NotificationContext.Provider value={{ addNotification }}>
      {children}
      <NotificationContainer notifications={notifications} />
    </NotificationContext.Provider>
  );
};

export const useNotification = (): INotificationContext => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification deve ser usado dentro de um NotificationProvider');
  }
  return context;
};

const StyledContainer = styled.div`
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 2000;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const toastIn = keyframes`
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
`;

interface ToastProps {
  type: NotificationType;
}

const StyledToast = styled.div<ToastProps>`
  padding: 1rem 1.5rem;
  color: white;
  border-radius: 5px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  min-width: 250px;
  max-width: 400px;
  animation: ${toastIn} 0.5s ease;

  /* ======================= INÍCIO DA CORREÇÃO ======================= */
  /* Adicionado o estilo para o tipo 'warning' */
  background-color: ${({ type }) => {
    if (type === 'success') return '#2a9d8f';
    if (type === 'error') return '#e76f51';
    if (type === 'warning') return '#f4a261'; // Cor para aviso
    return '#3a7ca5'; // info
  }};
  /* ======================= FIM DA CORREÇÃO ======================= */
`;

interface NotificationContainerProps {
  notifications: INotification[];
}

const NotificationContainer: React.FC<NotificationContainerProps> = ({ notifications }) => {
  return (
    <StyledContainer>
      {notifications.map(notification => (
        <StyledToast key={notification.id} type={notification.type}>
          {notification.message}
        </StyledToast>
      ))}
    </StyledContainer>
  );
};
