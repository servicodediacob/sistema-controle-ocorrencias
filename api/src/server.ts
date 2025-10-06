// Caminho: api/src/server.ts
import perfilRoutes from './routes/perfilRoutes';
import auditoriaRoutes from './routes/auditoriaRoutes';
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
import dadosRoutes from './routes/dadosRoutes';
import { runDiagnostics } from './controllers/diagController';

// ======================= INÍCIO DA CORREÇÃO =======================
// --- Configuracao de CORS ---
// Adicionamos a nova URL de produção do frontend à lista de origens permitidas.
const defaultAllowedOrigins = [
  'http://localhost:5173', // Para desenvolvimento local
  'https://siscob-iota.vercel.app', // SUA NOVA URL DE PRODUÇÃO
  'https://sistema-ocorrencias-frontend-alpha.vercel.app', // URL antiga (pode ser mantida ou removida )
];
// ======================= FIM DA CORREÇÃO =======================

const extraAllowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map((origin) => origin.trim()).filter((origin) => origin.length > 0)
  : [];
const allowedOrigins = Array.from(new Set([...defaultAllowedOrigins, ...extraAllowedOrigins]));

if (extraAllowedOrigins.length > 0) {
  logger.info({ allowedOrigins }, '[CORS] Origem(s) adicionais carregadas de CORS_ORIGINS.');
}

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Permite requisicoes sem origin (ex: Postman, apps mobile) ou das origens listadas
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
// Rotas que nao exigem autenticacao devem vir primeiro.
app.get('/api/diag', runDiagnostics); // Rota de diagnostico (Health Check)
app.use('/api/auth', authRoutes); // Rotas de login
app.use('/api/acesso', acessoRoutes); // Rota publica para solicitar acesso

// --- Rotas Protegidas ---
// A partir daqui, todas as rotas podem (e devem) ser protegidas pelo middleware de autenticacao.
app.use('/api/plantao', plantaoRoutes);
app.use('/api/ocorrencias-detalhadas', ocorrenciaDetalhadaRoutes);
app.use('/api/perfil', perfilRoutes);
app.use('/api/auditoria', auditoriaRoutes);
app.use('/api', dadosRoutes); // Agrupa a maioria das rotas de dados

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
