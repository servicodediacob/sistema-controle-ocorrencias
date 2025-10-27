// frontend/src/components/SystemStatusIndicator.tsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';

type SystemStatus = 'ok' | 'degraded' | 'error' | 'loading';

interface SystemStatusIndicatorProps {
  isCollapsed: boolean;
}

type ServiceKey = 'database' | 'auth' | 'sisgpo' | string;

interface DiagnosticService {
  status: 'ok' | 'error' | 'degraded';
  message: string;
  details?: string;
}

interface DiagnosticsReport {
  geral?: {
    status?: 'ok' | 'error' | 'degraded';
    timestamp?: string;
  };
  servicos?: Record<ServiceKey, DiagnosticService>;
}

const SERVICE_LABELS: Record<ServiceKey, string> = {
  database: 'Banco de dados',
  auth: 'Autenticacao',
  sisgpo: 'SISGPO',
};

const formatServiceName = (key: ServiceKey): string => SERVICE_LABELS[key] ?? key;

const SystemStatusIndicator: React.FC<SystemStatusIndicatorProps> = ({ isCollapsed }) => {
  const [status, setStatus] = useState<SystemStatus>('loading');
  const [isHovered, setIsHovered] = useState(false);
  const [lastMessage, setLastMessage] = useState('Verificando...');

  const statusConfig = {
    ok: { color: 'bg-green-500', icon: 'OK', text: 'Sistema operacional' },
    degraded: { color: 'bg-yellow-500', icon: '!', text: 'Desempenho degradado' },
    error: { color: 'bg-red-600', icon: 'X', text: 'Falha detectada' },
    loading: { color: 'bg-gray-500', icon: '..', text: 'Verificando...' },
  };

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
        const res = await axios.get(`${apiBaseUrl}/diag`, {
          validateStatus: () => true,
        });

        const report = res.data as DiagnosticsReport;
        const services = report?.servicos ?? {};
        const serviceEntries = Object.entries(services);
        const failing = serviceEntries.find(([, svc]) => svc.status === 'error');
        const degraded = serviceEntries.find(([, svc]) => svc.status === 'degraded');

        if (res.status === 200 && (report?.geral?.status === 'ok' || report?.geral?.status === 'degraded')) {
          setStatus('ok');
          setLastMessage('Todos os servicos responderam com sucesso.');
          return;
        }

        if (failing) {
          const [serviceKey, serviceInfo] = failing;
          const detail = serviceInfo.details ? ` Detalhes: ${serviceInfo.details}` : '';
          setStatus('error');
          setLastMessage(`${formatServiceName(serviceKey)}: ${serviceInfo.message}.${detail}`);
          return;
        }



        setStatus('error');
        setLastMessage('Relatorio de diagnostico indisponivel ou em formato inesperado.');
      } catch (error) {
        setStatus('error');
        setLastMessage('API offline ou inacessivel.');
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
      <div
        className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-white text-xs font-semibold shadow-lg transition-all duration-300 ${color} ${
          isCollapsed ? 'justify-center' : ''
        }`}
      >
        <span>{icon}</span>
        {!isCollapsed && <span className="truncate">{text}</span>}
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
