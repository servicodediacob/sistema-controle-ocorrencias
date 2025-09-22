// Caminho: api/src/server.ts

import './config/envLoader';
import 'dotenv/config';
import express, { Express, Request, Response } from 'express';
import cors from 'cors';

// Importação das suas rotas
import authRoutes from './routes/authRoutes';
import dadosRoutes from './routes/dadosRoutes';
import unidadesRoutes from './routes/unidadesRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import plantaoRoutes from './routes/plantaoRoutes';
import usuarioRoutes from './routes/usuarioRoutes';
import acessoRoutes from './routes/acessoRoutes';
import { checkHealth } from './controllers/healthController'; // 1. Importação do Health Check

// Importação da conexão com o banco de dados
import './db';

const app: Express = express();
const PORT = process.env.PORT || 3001;

// --- Configuração de CORS ---
const allowedOrigins = [
  // Domínios antigos (podem ser mantidos ou removidos)
  'https://sistema-controle-ocorrencias.vercel.app',
  'https://sistema-controle-ocorrencias-kn7pa3qiq.vercel.app',
  
  // Domínio do novo frontend na Vercel
  'https://siscob-iota.vercel.app'
];

// Permite localhost apenas se não estiver em ambiente de produção
if (process.env.NODE_ENV !== 'production' ) {
  allowedOrigins.push('http://localhost:5173' );
}

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Permite requisições sem 'origin' (como de apps mobile ou Postman) e verifica a lista de permissões.
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Acesso não permitido pela política de CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

// --- Middlewares ---
app.use(cors(corsOptions));
app.use(express.json());

// --- Rota de Health Check ---
// 2. Rota adicionada para verificação de saúde da API pelo Render
app.get('/api/health', checkHealth);

// --- Rotas da API ---
app.use('/api/auth', authRoutes);
app.use('/api/acesso', acessoRoutes);
app.use('/api', dadosRoutes);
app.use('/api', unidadesRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/plantao', plantaoRoutes);
app.use('/api/usuarios', usuarioRoutes);

// --- Rota Raiz ---
app.get('/api', (_req: Request, res: Response) => {
  res.send('API do Sistema de Controle de Ocorrências está no ar!');
});

// --- Inicialização do Servidor ---
// A Vercel ignora este bloco e usa a exportação padrão.
// O Render executa este bloco porque `require.main === module` é verdadeiro.
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
  });
}

// Exporta o app para a Vercel (e para os testes)
export default app;
