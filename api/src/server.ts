// Caminho: api/src/server.ts

import './config/envLoader';
import 'dotenv/config';
import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import logger from './config/logger';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';

import { onSocketConnection } from './services/socketService'; 

// Importação das suas rotas
import authRoutes from './routes/authRoutes';
import dadosRoutes from './routes/dadosRoutes';
import unidadesRoutes from './routes/unidadesRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import plantaoRoutes from './routes/plantaoRoutes';
import usuarioRoutes from './routes/usuarioRoutes';
import acessoRoutes from './routes/acessoRoutes';
import { checkHealth } from './controllers/healthController';
import { runDiagnostics } from './controllers/diagController';

// Importação da conexão com o banco de dados
import './db';

const app: Express = express( );
const PORT = process.env.PORT || 3001;

// --- Configuração de CORS ---
const allowedOrigins = [
  'https://sistema-controle-ocorrencias.vercel.app',
  'https://sistema-controle-ocorrencias-kn7pa3qiq.vercel.app',
  'https://siscob-iota.vercel.app',
  'https://sistema-ocorrencias-d7rw.onrender.com',
  'https://sistema-ocorrencias-api-1jzi.onrender.com'
];

if (process.env.NODE_ENV !== 'production' ) {
  allowedOrigins.push('http://localhost:5173' );
}

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Acesso não permitido pela política de CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

// --- Middlewares ---
app.use(cors(corsOptions));
app.use(express.json());

// --- Rotas ---
app.get('/api/health', checkHealth);
app.get('/api/diag', runDiagnostics);
app.use('/api/auth', authRoutes);
app.use('/api/acesso', acessoRoutes);
app.use('/api', dadosRoutes);
app.use('/api', unidadesRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/plantao', plantaoRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.get('/api', (_req: Request, res: Response) => {
  res.send('API do Sistema de Controle de Ocorrências está no ar!');
});

// --- Servidor HTTP e Socket.IO ---
const httpServer = http.createServer(app );

const io = new SocketIOServer(httpServer, {
  cors: corsOptions
} );

onSocketConnection(io);

if (require.main === module) {
  httpServer.listen(PORT, ( ) => {
    logger.info(`Servidor HTTP e Socket.IO rodando na porta ${PORT}`);
    logger.info(`Ambiente: ${process.env.NODE_ENV || 'development'}`);
  });
}

export default httpServer;
