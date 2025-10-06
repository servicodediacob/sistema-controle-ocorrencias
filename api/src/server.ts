import './config/envLoader'; // Garante que as variaveis de ambiente sejam carregadas primeiro
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import logger from './config/logger';
import { onSocketConnection } from './services/socketService';

// Importacao das rotas
import authRoutes from './routes/authRoutes';
import acessoRoutes from './routes/acessoRoutes';
import plantaoRoutes from './routes/plantaoRoutes';
import ocorrenciaDetalhadaRoutes from './routes/ocorrenciaDetalhadaRoutes';
import perfilRoutes from './routes/perfilRoutes';
import auditoriaRoutes from './routes/auditoriaRoutes';
import dadosRoutes from './routes/dadosRoutes'; // Mantém a importação
import { runDiagnostics } from './controllers/diagController';

// --- Configuracao de CORS (sem alterações ) ---
const defaultAllowedOrigins = [
  'http://localhost:5173',
  'https://siscob-iota.vercel.app',
  'https://sistema-ocorrencias-frontend-alpha.vercel.app',
];
const extraAllowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',' ).map((origin) => origin.trim()).filter((origin) => origin.length > 0)
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

// --- Inicializacao da Aplicacao ---
const app = express();
app.use(cors(corsOptions));
app.use(express.json());

// --- Rotas Publicas ---
app.get('/api/diag', runDiagnostics);
app.use('/api/auth', authRoutes);
app.use('/api/acesso', acessoRoutes);

// ======================= INÍCIO DA CORREÇÃO =======================
// --- Rotas Protegidas com Prefixos Corretos ---
// Cada grupo de rotas agora tem seu próprio prefixo, eliminando a ambiguidade.
app.use('/api/plantao', plantaoRoutes);
app.use('/api/ocorrencias-detalhadas', ocorrenciaDetalhadaRoutes);
app.use('/api/perfil', perfilRoutes);
app.use('/api/auditoria', auditoriaRoutes);

// O arquivo 'dadosRoutes.ts' agora é montado sob o prefixo '/api'
// e as rotas dentro dele serão relativas a isso.
// Ex: /api/naturezas, /api/usuarios, etc.
app.use('/api', dadosRoutes); 
// ======================= FIM DA CORREÇÃO =======================


// --- Configuracao do Servidor HTTP e Socket.IO ---
const httpServer = createServer(app );
const io = new SocketIOServer(httpServer, { cors: corsOptions } );
onSocketConnection(io);

// --- Inicializacao do Servidor ---
const PORT = process.env.PORT || 3001;
const server = httpServer.listen(PORT, ( ) => {
  logger.info(`Servidor rodando na porta ${PORT} em modo ${process.env.NODE_ENV || 'development'}`);
});

export default server;
