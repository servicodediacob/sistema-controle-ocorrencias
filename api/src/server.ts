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

// CORS: Aceita todas as origens em produção para garantir funcionamento
const corsOptions: cors.CorsOptions = {
  origin: true, // Aceita qualquer origem
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'If-Match', 'Cache-Control', 'Pragma', 'Expires', 'X-Requested-With'],
  credentials: true,
  exposedHeaders: ['ETag'],
  preflightContinue: false,
  optionsSuccessStatus: 204,
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
