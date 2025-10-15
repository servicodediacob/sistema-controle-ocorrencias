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
import externalRoutes from './routes/externalRoutes'; // CORREÇÃO: Garantindo que a importação existe
import { proteger } from './middleware/authMiddleware';
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

// Rota externa para integração
app.use('/api', externalRoutes);

// Rotas protegidas
app.use('/api', proteger, usuarioRoutes);
app.use('/api', proteger, acessoRoutes);
app.use('/api', proteger, perfilRoutes);
app.use('/api', proteger, unidadesRoutes);
app.use('/api', proteger, dadosRoutes);
app.use('/api', proteger, plantaoRoutes);
app.use('/api', proteger, ocorrenciaDetalhadaRoutes);
app.use('/api', proteger, dashboardRoutes);
// app.use('/api', proteger, relatorioRoutes); // Removido
app.use('/api', proteger, auditoriaRoutes);
app.use('/api', proteger, estatisticasRoutes);

server.listen(PORT, () => {
  console.log(`✅ Servidor rodando na porta ${PORT}`);
});

export { io };