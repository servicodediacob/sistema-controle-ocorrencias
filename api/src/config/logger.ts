import pino from 'pino';

// Configurações do logger
const loggerConfig = {
  level: process.env.LOG_LEVEL || 'info', // Nível mínimo de log a ser exibido
  transport: process.env.NODE_ENV !== 'production' 
    ? {
        // Em desenvolvimento, usa um formato mais legível
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:dd/mm/yyyy HH:MM:ss',
          ignore: 'pid,hostname',
        },
      }
    : undefined, // Em produção, usa o formato JSON padrão, otimizado para máquinas
};

const logger = pino(loggerConfig);

export default logger;
