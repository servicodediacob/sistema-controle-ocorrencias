import express, { Request, Response } from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import './config/envLoader'; // Garante que as variáveis de ambiente sejam carregadas primeiro
import logger from './config/logger';
import { onSocketConnection } from './services/socketService';

// --- 1. IMPORTAÇÃO DE TODAS AS ROTAS ---
import authRoutes from './routes/authRoutes';
import acessoRoutes from './routes/acessoRoutes';
import plantaoRoutes from './routes/plantaoRoutes';
import ocorrenciasDetalhadasRoutes from './routes/ocorrenciaDetalhadaRoutes';
import dadosRoutes from './routes/dadosRoutes';
import unidadesRoutes from './routes/unidadesRoutes';
import usuariosRoutes from './routes/usuarioRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import diagRoutes from './routes/diagRoutes'; // Rota de diagnóstico

// --- Configuração de CORS ---
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

// --- 2. REGISTRO DAS ROTAS NA APLICAÇÃO ---
// Cada conjunto de rotas é prefixado com seu caminho base.
app.use('/api/auth', authRoutes);
app.use('/api/acesso', acessoRoutes);
app.use('/api/plantao', plantaoRoutes);
app.use('/api/ocorrencias-detalhadas', ocorrenciasDetalhadasRoutes);
app.use('/api/unidades', unidadesRoutes); // Inclui /crbms
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/diag', diagRoutes); // Rota de diagnóstico agora registrada
app.use('/api', dadosRoutes); // Rotas mais genéricas (como /ocorrencias, /naturezas)

// Rota raiz da API para um simples "Olá"
app.get('/api', (_req: Request, res: Response) => {
  res.status(200).json({ message: 'API do Sistema de Ocorrências do COCB no ar!' });
});

// --- Configuração do Servidor HTTP e Socket.IO ---
const httpServer = createServer(app );
const io = new SocketIOServer(httpServer, {
  cors: corsOptions
} );

// Inicializa o serviço de socket
onSocketConnection(io);

const PORT = process.env.PORT || 3001;

const server = httpServer.listen(PORT, ( ) => {
  logger.info(`🚀 Servidor rodando na porta ${PORT}`);
});

export default server;
