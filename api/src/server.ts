// api/src/server.ts
import './config/envLoader';
import express, { Request, Response } from 'express'; // Adicionado Request e Response
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
import { runDiagnostics } from './controllers/diagController';

// ======================= INÍCIO DA CORREÇÃO =======================
// Importa a função de seed que acabamos de exportar
import { seedProductionAdmin } from './db/seed';
// ======================= FIM DA CORREÇÃO =======================

// --- Configuração de CORS (sem alterações ) ---
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

// --- Inicialização da Aplicação ---
const app = express();
app.use(cors(corsOptions));
app.use(express.json());

// --- Rotas Públicas ---
app.get('/api/diag', runDiagnostics);
app.use('/api/auth', authRoutes);
app.use('/api/acesso', acessoRoutes);

// ======================= INÍCIO DA CORREÇÃO =======================
// --- ROTA DE SETUP TEMPORÁRIA E SEGURA ---
app.post('/api/setup/run-seed', async (req: Request, res: Response) => {
  const { secret } = req.body;

  // A chave secreta DEVE ser definida nas variáveis de ambiente do Render
  if (!process.env.SEED_SECRET_KEY || secret !== process.env.SEED_SECRET_KEY) {
    logger.warn('Tentativa de acesso não autorizado ao endpoint de seed.');
    return res.status(403).json({ message: 'Acesso negado.' });
  }

  try {
    const result = await seedProductionAdmin();
    return res.status(200).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido durante o seed.';
    return res.status(500).json({ message });
  }
});
// ======================= FIM DA CORREÇÃO =======================

// --- Rotas Protegidas ---
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
