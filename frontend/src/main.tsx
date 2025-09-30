// Caminho: frontend/src/main.tsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './contexts/AuthProvider.tsx';
import { NotificationProvider } from './contexts/NotificationContext.tsx';
import { DataProvider } from './contexts/DataProvider.tsx';
import { ChatProvider } from './contexts/ChatProvider.tsx';
import { ThemeProvider } from './contexts/ThemeProvider.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';
import { SocketProvider } from './hooks/useSocket';

const rootElement = document.getElementById('root');

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <ErrorBoundary>
        <ThemeProvider>
          <NotificationProvider>
            <AuthProvider>
              <SocketProvider>
                <DataProvider>
                  <ChatProvider>
                    <App />
                  </ChatProvider>
                </DataProvider>
              </SocketProvider>
            </AuthProvider>
          </NotificationProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </React.StrictMode>,
  );
} else {
  console.error("Elemento 'root' não encontrado no DOM.");
}
