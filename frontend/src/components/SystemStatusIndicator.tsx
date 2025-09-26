// Caminho: frontend/src/components/SystemStatusIndicator.tsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Define os possíveis status do sistema
type SystemStatus = 'ok' | 'degraded' | 'error' | 'loading';

interface SystemStatusIndicatorProps {
  isCollapsed: boolean; // A prop que estava faltando ser passada
}

const SystemStatusIndicator: React.FC<SystemStatusIndicatorProps> = ({ isCollapsed }) => {
  const [status, setStatus] = useState<SystemStatus>('loading');
  const [isHovered, setIsHovered] = useState(false);
  const [lastMessage, setLastMessage] = useState('Verificando...');

  // Mapeia os status para cores e ícones
  const statusConfig = {
    ok: { color: 'bg-green-500', icon: '✓', text: 'Sistema Operacional' },
    degraded: { color: 'bg-yellow-500', icon: '!', text: 'Desempenho Degradado' },
    error: { color: 'bg-red-600', icon: '×', text: 'Falha Crítica' },
    loading: { color: 'bg-gray-500', icon: '…', text: 'Verificando...' },
  };

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
        await axios.get(`${apiBaseUrl}/diag`  );
        setStatus('ok');
        setLastMessage('Todos os serviços estão operacionais.');
      } catch (error: any) {
        if (axios.isAxiosError(error) && error.response) {
          setStatus('error');
          const services = error.response.data?.servicos;
          const failedService = services ? Object.keys(services).find(key => services[key].status === 'error') : 'desconhecido';
          setLastMessage(`Falha no serviço: ${failedService}.`);
          console.error("DIAGNÓSTICO FALHOU:", error.response.data);
        } else {
          setStatus('error');
          setLastMessage('API offline ou inacessível.');
          console.error("DIAGNÓSTICO FALHOU: API offline.", error);
        }
      }
    };

    checkStatus();
    const intervalId = setInterval(checkStatus, 30000);
    return () => clearInterval(intervalId);
  }, []);

  const { color, icon, text } = statusConfig[status];

  return (
    <div 
      className="relative w-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-white text-xs font-semibold shadow-lg transition-all duration-300 ${color} ${isCollapsed ? 'justify-center' : ''}`}>
        <span>{icon}</span>
        {!isCollapsed && (
          <span className="truncate">
            {text}
          </span>
        )}
      </div>

      {isHovered && (
        <div className="absolute bottom-full left-0 mb-2 w-full min-w-[220px] rounded-md bg-gray-900 p-3 text-sm text-white shadow-xl border border-gray-700 z-10">
          <p className="font-bold">Status do Sistema</p>
          <p className="mt-1 text-gray-300">{lastMessage}</p>
        </div>
      )}
    </div>
  );
};

export default SystemStatusIndicator;
