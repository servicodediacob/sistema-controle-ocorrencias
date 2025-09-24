// Caminho: frontend/src/main.tsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './contexts/AuthProvider.tsx';
import { NotificationProvider } from './contexts/NotificationContext.tsx';
import { DataProvider } from './contexts/DataProvider.tsx';
import { ChatProvider } from './contexts/ChatProvider.tsx';
import { ThemeProvider } from './contexts/ThemeProvider.tsx'; // 1. Importe o ThemeProvider

const rootElement = document.getElementById('root');

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      {/* 2. Envolva todos os outros provedores com o ThemeProvider */}
      <ThemeProvider>
        <AuthProvider>
          <NotificationProvider>
            <DataProvider>
              <ChatProvider>
                <App />
              </ChatProvider>
            </DataProvider>
          </NotificationProvider>
        </AuthProvider>
      </ThemeProvider>
    </React.StrictMode>,
  );
} else {
  console.error("Elemento 'root' não encontrado no DOM.");
}
