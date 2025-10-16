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
// import relatorioRoutes from './routes/relatorioRoutes'; // CORREÇÃO: Removido
import auditoriaRoutes from './routes/auditoriaRoutes';
import estatisticasRoutes from './routes/estatisticasRoutes';
import diagRoutes from './routes/diagRoutes';
import externalRoutes from './routes/externalRoutes'; // CORREÇÃO: Garantindo que a importação existe
import { initializeSocket } from './services/socketService'; // CORREÇÃO: Usando import nomeado

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

initializeSocket(io);

const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Rotas públicas
app.use('/api/auth', authRoutes);
app.use('/api/diag', diagRoutes);
app.use('/api/acesso', acessoRoutes);

// Rota externa para integração
app.use('/api', externalRoutes);

// Demais rotas (cada modulo aplica sua propria protecao)
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/perfil', perfilRoutes);
app.use('/api/unidades', unidadesRoutes);
app.use('/api/plantao', plantaoRoutes);
app.use('/api/ocorrencias-detalhadas', ocorrenciaDetalhadaRoutes);
app.use('/api/dashboard', dashboardRoutes);
// app.use('/api', relatorioRoutes); // Removido
app.use('/api/auditoria', auditoriaRoutes);
app.use('/api', estatisticasRoutes);
app.use('/api', dadosRoutes);

server.listen(PORT, () => {
  console.log(`[API] Servidor rodando na porta ${PORT}`);
});

export { io };

