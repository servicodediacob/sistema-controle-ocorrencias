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

const rootElement = document.getElementById('root');

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      {/* 
        CORREÇÃO DEFINITIVA:
        Aninhar os provedores garante que o valor do contexto pai 
        esteja disponível para os filhos no momento em que eles são montados.
      */}
      <ErrorBoundary>
        <ThemeProvider>
          <NotificationProvider>
            <AuthProvider>
              {/* DataProvider e ChatProvider agora são filhos diretos do AuthProvider */}
              <DataProvider>
                <ChatProvider>
                  {/* O App agora é filho de todos os provedores e pode usar qualquer contexto */}
                  <App />
                </ChatProvider>
              </DataProvider>
            </AuthProvider>
          </NotificationProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </React.StrictMode>,
  );
} else {
  console.error("Elemento 'root' não encontrado no DOM.");
}
