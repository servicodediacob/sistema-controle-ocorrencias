import 'dotenv/config';
import express, { Express, Request, Response } from 'express';
import cors from 'cors';

import authRoutes from './routes/authRoutes';
import dadosRoutes from './routes/dadosRoutes'; // Manteremos para as 'naturezas'
import unidadesRoutes from './routes/unidadesRoutes'; // <-- IMPORTAR AS NOVAS ROTAS
import dashboardRoutes from './routes/dashboardRoutes';
import plantaoRoutes from './routes/plantaoRoutes';
import usuarioRoutes from './routes/usuarioRoutes';

import './db';

const app: Express = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api', dadosRoutes); // Continua usando para /api/naturezas
app.use('/api', unidadesRoutes); // <-- USAR AS NOVAS ROTAS
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/plantao', plantaoRoutes);
app.use('/api/usuarios', usuarioRoutes);

// Rota raiz
app.get('/', (_req: Request, res: Response) => {
  res.send('API do Sistema de Controle de Ocorrências está no ar!');
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
