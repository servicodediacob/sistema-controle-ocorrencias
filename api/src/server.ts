// api/src/server.ts

// Carrega as variáveis de ambiente do arquivo .env o mais cedo possível
import './config/envLoader';

import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import logger from './config/logger';
import { onSocketConnection } from './services/socketService';

// Importação das rotas
import authRoutes from './routes/authRoutes';
import acessoRoutes from './routes/acessoRoutes';
import plantaoRoutes from './routes/plantaoRoutes';
import ocorrenciaDetalhadaRoutes from './routes/ocorrenciaDetalhadaRoutes';
import perfilRoutes from './routes/perfilRoutes';
import auditoriaRoutes from './routes/auditoriaRoutes';
import dadosRoutes from './routes/dadosRoutes';
import diagRoutes from './routes/diagRoutes';

// --- Configuração de CORS ---
const defaultAllowedOrigins = [
  'http://localhost:5173',
  'https://siscob-iota.vercel.app',
  'https://sistema-ocorrencias-frontend-alpha.vercel.app',
];
const extraAllowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',' ).map((origin) => origin.trim()).filter(Boolean)
  : [];
const allowedOrigins = Array.from(new Set([...defaultAllowedOrigins, ...extraAllowedOrigins]));
if (extraAllowedOrigins.length > 0) {
  logger.info({ allowedOrigins }, '[CORS] Origem(s) adicionais carregadas de CORS_ORIGINS.');
}
const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn({ origin }, 'Origem bloqueada pelo CORS');
      callback(new Error('Nao permitido pelo CORS'));
    }
  },
  credentials: true,
};

// --- Inicialização da Aplicação ---
const app = express();
app.use(cors(corsOptions));
app.use(express.json());

// --- Rotas ---
app.use('/api/diag', diagRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/acesso', acessoRoutes);
app.use('/api/plantao', plantaoRoutes);
app.use('/api/ocorrencias-detalhadas', ocorrenciaDetalhadaRoutes);
app.use('/api/perfil', perfilRoutes);
app.use('/api/auditoria', auditoriaRoutes);
app.use('/api', dadosRoutes);

// --- Configuração do Servidor HTTP e Socket.IO ---
const httpServer = createServer(app );
const io = new SocketIOServer(httpServer, { cors: corsOptions } );
onSocketConnection(io);

// --- Inicialização do Servidor ---
const PORT = process.env.PORT || 3001;
const server = httpServer.listen(PORT, ( ) => {
  logger.info(`Servidor rodando na porta ${PORT} em modo ${process.env.NODE_ENV || 'development'}`);
});

export default server;
