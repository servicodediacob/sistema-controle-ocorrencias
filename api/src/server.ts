import './config/envLoader'; // Garante que as variáveis de ambiente sejam carregadas primeiro
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
import dadosRoutes from './routes/dadosRoutes';
import { runDiagnostics } from './controllers/diagController';

// --- Configuração de CORS ---
const allowedOrigins = [
  'http://localhost:5173',
  'https://sistema-ocorrencias-frontend-alpha.vercel.app'
];
const corsOptions: cors.CorsOptions = {
  origin: (origin, callback ) => {
    // Permite requisições sem 'origin' (ex: Postman, apps mobile) ou das origens listadas
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn({ origin }, 'Origem bloqueada pelo CORS');
      callback(new Error('Não permitido pelo CORS'));
    }
  },
  credentials: true,
};

// --- Inicialização da Aplicação ---
const app = express();
app.use(cors(corsOptions));
app.use(express.json());

// --- Rotas Públicas ---
// Rotas que não exigem autenticação devem vir primeiro.
app.get('/api/diag', runDiagnostics); // Rota de diagnóstico (Health Check)
app.use('/api/auth', authRoutes); // Rotas de login
app.use('/api/acesso', acessoRoutes); // Rota pública para solicitar acesso

// --- Rotas Protegidas ---
// A partir daqui, todas as rotas podem (e devem) ser protegidas pelo middleware de autenticação.
app.use('/api/plantao', plantaoRoutes);
app.use('/api/ocorrencias-detalhadas', ocorrenciaDetalhadaRoutes);
app.use('/api', dadosRoutes); // Agrupa a maioria das rotas de dados

// --- Configuração do Servidor HTTP e Socket.IO ---
const httpServer = createServer(app );
const io = new SocketIOServer(httpServer, { cors: corsOptions } );
onSocketConnection(io);

// --- Inicialização do Servidor ---
const PORT = process.env.PORT || 3001;
const server = httpServer.listen(PORT, ( ) => {
  logger.info(`🚀 Servidor rodando na porta ${PORT} em modo ${process.env.NODE_ENV || 'development'}`);
});

export default server;
