// api/src/server.ts

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';

// --- ROTAS ---
import authRoutes from './routes/authRoutes';
import usuarioRoutes from './routes/usuarioRoutes';
import acessoRoutes from './routes/acessoRoutes';
import perfilRoutes from './routes/perfilRoutes';
import unidadesRoutes from './routes/unidadesRoutes';
import dadosRoutes from './routes/dadosRoutes';
import plantaoRoutes from './routes/plantaoRoutes';
import ocorrenciaDetalhadaRoutes from './routes/ocorrenciaDetalhadaRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import auditoriaRoutes from './routes/auditoriaRoutes';
import estatisticasRoutes from './routes/estatisticasRoutes';
import diagRoutes from './routes/diagRoutes';
// A rota 'relatorioRoutes' não foi encontrada, mantendo comentada
// import relatorioRoutes from './routes/relatorioRoutes';

// --- MIDDLEWARES E SERVIÇOS (CORRIGIDO) ---
import { proteger } from './middleware/authMiddleware'; // Usando o nome de exportação correto
const { onSocketConnection } = require('./services/socketService'); // Usando 'require' para garantir a importação

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

// Inicializa o Socket.IO
onSocketConnection(io);

const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Rotas públicas
app.use('/api/auth', authRoutes);
app.use('/api/acesso', acessoRoutes); // possui públicas e protegidas dentro do arquivo
app.use('/api/diag', diagRoutes); // diagnóstico público

// Rotas protegidas (cada router aplica seu próprio middleware quando necessário)
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/perfil', perfilRoutes);
app.use('/api/unidades', unidadesRoutes);
app.use('/api', dadosRoutes); // agrega /naturezas, /usuarios, /unidades, etc
app.use('/api/plantao', plantaoRoutes);
app.use('/api/ocorrencias', ocorrenciaDetalhadaRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/auditoria', auditoriaRoutes);
app.use('/api', estatisticasRoutes); // mantém endpoints /estatisticas/*
// app.use('/api', proteger, relatorioRoutes);

server.listen(PORT, () => {
  console.log(`✅ Servidor rodando na porta ${PORT}`);
});

export { io };
