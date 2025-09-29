import './config/envLoader';
import express, { Request, Response } from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import logger from './config/logger';
import db from './db';
import { onSocketConnection } from './services/socketService';

// Importação das rotas
import authRoutes from './routes/authRoutes';
import acessoRoutes from './routes/acessoRoutes';
import plantaoRoutes from './routes/plantaoRoutes';
import ocorrenciaDetalhadaRoutes from './routes/ocorrenciaDetalhadaRoutes';
import dadosRoutes from './routes/dadosRoutes';
import { runDiagnostics } from './controllers/diagController'; // Importa o controller de diagnóstico

// --- Configuração de CORS ---
const allowedOrigins = [
  'http://localhost:5173',
  'https://sistema-ocorrencias-frontend-alpha.vercel.app'
];
const corsOptions: cors.CorsOptions = {
  origin: (origin, callback ) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn({ origin }, 'Origem bloqueada pelo CORS');
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};

const app = express();
app.use(cors(corsOptions));
app.use(express.json());

// --- Rota de Diagnóstico (Health Check) - AGORA PÚBLICA ---
app.get('/api/diag', runDiagnostics); // <-- ROTA MOVIDA PARA SER PÚBLICA

// --- Registro das Rotas ---
app.use('/api/auth', authRoutes);
app.use('/api/acesso', acessoRoutes);
app.use('/api/plantao', plantaoRoutes);
app.use('/api/ocorrencias-detalhadas', ocorrenciaDetalhadaRoutes);
app.use('/api', dadosRoutes); // Continua registrando as outras rotas sob /api

// --- Configuração do Servidor HTTP e Socket.IO ---
const httpServer = createServer(app );
const io = new SocketIOServer(httpServer, { cors: corsOptions } );
onSocketConnection(io);

const PORT = process.env.PORT || 3001;
const server = httpServer.listen(PORT, ( ) => {
  logger.info(`🚀 Servidor rodando na porta ${PORT} em modo ${process.env.NODE_ENV || 'development'}`);
});

export default server;
