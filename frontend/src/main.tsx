// Caminho: frontend/src/main.tsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './contexts/AuthProvider.tsx';
import { NotificationProvider } from './contexts/NotificationContext.tsx';
import { DataProvider } from './contexts/DataProvider.tsx'; // 1. Importe o novo provedor

const rootElement = document.getElementById('root');

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <AuthProvider>
        <NotificationProvider>
          {/* 2. Envolva o App com o DataProvider */}
          <DataProvider>
            <App />
          </DataProvider>
        </NotificationProvider>
      </AuthProvider>
    </React.StrictMode>,
  );
} else {
  console.error("Elemento 'root' não encontrado no DOM.");
}
