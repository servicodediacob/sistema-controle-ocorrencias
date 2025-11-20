import './config/envLoader';

// Tratamento de Erros Globais (deve vir antes de qualquer outro código)
process.on('uncaughtException', (error) => {
  console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down...', reason);
  process.exit(1);
});

import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import authRoutes from './routes/authRoutes';
import usuarioRoutes from './routes/usuarioRoutes';
import acessoRoutes from './routes/acessoRoutes';
import perfilRoutes from './routes/perfilRoutes';
import unidadesRoutes from './routes/unidadesRoutes';
import dadosRoutes from './routes/dadosRoutes';
import plantaoRoutes from './routes/plantaoRoutes';
import ocorrenciaDetalhadaRoutes from './routes/ocorrenciaDetalhadaRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
// import relatorioRoutes from './routes/relatorioRoutes'; // Removido
import auditoriaRoutes from './routes/auditoriaRoutes';
import estatisticasRoutes from './routes/estatisticasRoutes';
import obmRoutes from './routes/obmRoutes'; // New import
import diagRoutes from './routes/diagRoutes';
import externalRoutes from './routes/externalRoutes';
import sisgpoRoutes from './routes/sisgpoRoutes';
import { initializeSocket } from './services/socketService';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

initializeSocket(io);

const PORT = process.env.PORT || 3001;

const defaultAllowedOrigins = [
  'https://sisgpo.vercel.app',
  'https://sistema-controle-ocorrencias-fronte.vercel.app',
  'http://localhost:5173',
  'http://localhost:5174',
];

const rawAllowedOrigins =
  process.env.CORS_ALLOWED_ORIGINS ?? process.env.CORS_ORIGINS ?? '';

const envAllowedOrigins = rawAllowedOrigins
  .split(',')
  .map((origin) => origin.trim())
  .filter((origin) => origin.length > 0);

const allowedOrigins = envAllowedOrigins.length > 0 ? envAllowedOrigins : defaultAllowedOrigins;

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.warn(`[CORS] Origin '${origin}' blocked. Allowed origins: ${allowedOrigins.join(', ')}`);
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'If-Match', 'Cache-Control', 'Pragma', 'Expires'],
  credentials: true,
  exposedHeaders: ['ETag'],
};

app.use(cors(corsOptions));

// As rotas de proxy devem vir antes do express.json() para lidar com uploads de arquivo
app.use('/api/sisgpo', sisgpoRoutes);

app.use(express.json());

// Health endpoints used by uptime monitors to keep the instance warm.
app.get('/', (_req, res) => {
  res.send('OK');
});

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.head('/', (_req, res) => {
  res.sendStatus(200);
});

app.head('/health', (_req, res) => {
  res.sendStatus(200);
});

app.use('/api/auth', authRoutes);
app.use('/api/diag', diagRoutes);
app.use('/api/acesso', acessoRoutes);

app.use('/api', externalRoutes);

app.use('/api/usuarios', usuarioRoutes);
app.use('/api/perfil', perfilRoutes);
app.use('/api/unidades', unidadesRoutes);
app.use('/api/plantao', plantaoRoutes);
app.use('/api/ocorrencias-detalhadas', ocorrenciaDetalhadaRoutes);
app.use('/api/dashboard', dashboardRoutes);
// app.use('/api', relatorioRoutes);
app.use('/api/auditoria', auditoriaRoutes);
app.use('/api', estatisticasRoutes);
app.use('/api/obms', obmRoutes); // New app.use
app.use('/api', dadosRoutes);

server.listen(PORT, () => {
  console.log(`[API] Servidor rodando na porta ${PORT}`);
});

export { io, server };
