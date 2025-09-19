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
app.use('/api', dadosRoutes); // Para /api/naturezas, /api/ocorrencias, etc.
app.use('/api', unidadesRoutes); // Para /api/unidades, /api/crbms
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/plantao', plantaoRoutes);
app.use('/api/usuarios', usuarioRoutes);

// Rota raiz
app.get('/', (_req: Request, res: Response) => {
  res.send('API do Sistema de Controle de Ocorrências está no ar!');
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  // Usamos 0.0.0.0 para garantir que o servidor seja acessível de fora do container
  console.log(`Servidor rodando em http://0.0.0.0:${PORT}` );
});

