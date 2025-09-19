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

app.use('/auth', authRoutes);
app.use('/', dadosRoutes); 
app.use('/', unidadesRoutes); 
app.use('/dashboard', dashboardRoutes);
app.use('/plantao', plantaoRoutes);
app.use('/usuarios', usuarioRoutes);

// Rota raiz
app.get('/', (_req: Request, res: Response) => {
  res.send('API do Sistema de Controle de Ocorrências está no ar!');
});

export default app;
