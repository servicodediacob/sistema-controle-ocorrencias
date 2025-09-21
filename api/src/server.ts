// api/src/server.ts
import './config/envLoader';
import 'dotenv/config';
import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import http from 'http'; // Importe o módulo http

// Importação das suas rotas
import authRoutes from './routes/authRoutes';
import dadosRoutes from './routes/dadosRoutes';
import unidadesRoutes from './routes/unidadesRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import plantaoRoutes from './routes/plantaoRoutes';
import usuarioRoutes from './routes/usuarioRoutes';
import acessoRoutes from './routes/acessoRoutes';

// Importação da conexão com o banco de dados
import './db';

const app: Express = express( );

// --- Configuração de CORS ---
const allowedOrigins = [
  'https://sistema-controle-ocorrencias.vercel.app',
  'https://sistema-controle-ocorrencias-kn7pa3qiq.vercel.app'
];

if (process.env.NODE_ENV !== 'production' ) {
  allowedOrigins.push('http://localhost:5173' );
}

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
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

// --- Rotas da API ---
app.use('/api/auth', authRoutes);
app.use('/api/acesso', acessoRoutes);
app.use('/api', dadosRoutes);
app.use('/api', unidadesRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/plantao', plantaoRoutes);
app.use('/api/usuarios', usuarioRoutes);

// --- Rota Raiz ---
app.get('/', (_req: Request, res: Response) => {
  res.send('API do Sistema de Controle de Ocorrências está no ar!');
});

// --- Inicialização do Servidor ---
const PORT = process.env.PORT || 3001;

// ======================= INÍCIO DA CORREÇÃO =======================
// Cria uma instância do servidor HTTP a partir do app Express
const server = http.createServer(app );

// Verifica se o arquivo está sendo executado diretamente
if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`Servidor rodando em http://0.0.0.0:${PORT}` );
  });
}

// Exporta tanto o app quanto o servidor
export { app, server };
// ======================= FIM DA CORREÇÃO =======================
