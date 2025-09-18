import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import styled, { keyframes } from 'styled-components';

// --- Tipos (permanecem os mesmos) ---
export type NotificationType = 'success' | 'error' | 'info';
export interface INotification {
  id: number;
  message: string;
  type: NotificationType;
}
interface INotificationContext {
  addNotification: (message: string, type: NotificationType) => void;
}

// --- Contexto, Provedor e Hook (lógica permanece a mesma) ---
const NotificationContext = createContext<INotificationContext | null>(null);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<INotification[]>([]);

  const removeNotification = useCallback((id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const addNotification = useCallback((message: string, type: NotificationType) => {
    const id = Date.now();
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


// --- Componentes de UI com Styled Components ---

const StyledContainer = styled.div`
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 2000;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

// Animação de entrada do toast
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

// Props para o componente Toast
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

  /* Estilos baseados na prop 'type' */
  background-color: ${({ type }) => {
    if (type === 'success') return '#2a9d8f';
    if (type === 'error') return '#e76f51';
    return '#3a7ca5'; // info
  }};
`;

// Componente funcional que usa os componentes estilizados
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
