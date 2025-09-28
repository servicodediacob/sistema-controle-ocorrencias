import express, { Request, Response } from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import './config/envLoader';
import logger from './config/logger';
import db from './db';

// Importação APENAS das rotas que sabemos que existem
import authRoutes from './routes/authRoutes';
import dadosRoutes from './routes/dadosRoutes';
import acessoRoutes from './routes/acessoRoutes';
import plantaoRoutes from './routes/plantaoRoutes';
import ocorrenciasDetalhadasRoutes from './routes/ocorrenciaDetalhadaRoutes';

// --- CONFIGURAÇÃO DE CORS ---
const allowedOrigins = [
  'http://localhost:5173',
  'https://siscob-iota.vercel.app'
];

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback ) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};

const app = express();

app.use(cors(corsOptions));
app.use(express.json());

// --- ROTAS CONSOLIDADAS ---

// Rota de Diagnóstico
app.get('/api/diag', async (_req: Request, res: Response) => {
  try {
    await db.query('SELECT 1');
    res.status(200).json({ status: 'ok', database: 'ok' });
  } catch (error) {
    res.status(500).json({ status: 'ok', database: 'error', message: (error as Error).message });
  }
});

// Rotas de Dados de Apoio
app.get('/api/unidades', async (_req: Request, res: Response) => {
    try {
        const { rows } = await db.query(`
            SELECT o.id, o.nome as cidade_nome, o.crbm_id, c.nome as crbm_nome 
            FROM obms o
            JOIN crbms c ON o.crbm_id = c.id
            ORDER BY c.nome, o.nome
        `);
        res.json(rows);
    } catch (error) {
        logger.error({ err: error }, 'Erro ao buscar unidades/cidades.');
        res.status(500).send('Erro ao buscar unidades');
    }
});

app.get('/api/crbms', async (_req: Request, res: Response) => {
    try {
        const { rows } = await db.query('SELECT * FROM crbms ORDER BY nome');
        res.json(rows);
    } catch (error) {
        logger.error({ err: error }, 'Erro ao buscar CRBMs.');
        res.status(500).send('Erro ao buscar CRBMs');
    }
});

// Rotas de Usuários
app.get('/api/usuarios', async (_req: Request, res: Response) => {
    try {
        const { rows } = await db.query('SELECT id, nome, email, role, obm_id FROM usuarios ORDER BY nome');
        res.json(rows);
    } catch (error) {
        logger.error({ err: error }, 'Erro ao buscar usuários.');
        res.status(500).send('Erro ao buscar usuários');
    }
});

// Rotas existentes
app.use('/api/auth', authRoutes);
app.use('/api/acesso', acessoRoutes);
app.use('/api/plantao', plantaoRoutes);
app.use('/api/ocorrencias-detalhadas', ocorrenciasDetalhadasRoutes);
app.use('/api', dadosRoutes);

// --- FIM DAS ROTAS ---

const httpServer = createServer(app );
const io = new SocketIOServer(httpServer, {
  cors: corsOptions
} );

io.on('connection', (socket) => {
  logger.info(`[Socket.IO] Usuário conectado: ${socket.id}`);
  socket.on('disconnect', () => {
    logger.info(`[Socket.IO] Usuário desconectado: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3001;

const server = httpServer.listen(PORT, ( ) => {
  logger.info(`🚀 Servidor rodando na porta ${PORT}`);
});

export default server;
