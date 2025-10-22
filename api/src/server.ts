import 'dotenv/config';
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
import diagRoutes from './routes/diagRoutes';
import externalRoutes from './routes/externalRoutes';
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
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

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
app.use('/api', dadosRoutes);

server.listen(PORT, () => {
  console.log(`[API] Servidor rodando na porta ${PORT}`);
});

export { io };
