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

// Importação da conexão com o banco de dados para garantir que ela seja inicializada.
import './db';

const app: Express = express();

// --- Configuração de CORS (Cross-Origin Resource Sharing) ---
// Lista de domínios que têm permissão para acessar esta API.
const allowedOrigins = [
  'https://sistema-controle-ocorrencias.vercel.app', // URL principal do seu frontend
  'https://sistema-controle-ocorrencias-kn7pa3qiq.vercel.app' // URL específica do deploy que deu erro
  // Adicione outras URLs de preview da Vercel aqui se necessário
];

// Adiciona o endereço de desenvolvimento local à lista, mas apenas se não estiver em produção.
if (process.env.NODE_ENV !== 'production' ) {
  allowedOrigins.push('http://localhost:5173' ); // Porta padrão do Vite
}

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Permite requisições que não têm 'origin' (ex: Postman, apps mobile)
    // ou que estão na nossa lista de domínios permitidos.
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // Se a origem não for permitida, rejeita a requisição.
      callback(new Error('Acesso não permitido pela política de CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Métodos HTTP permitidos
  allowedHeaders: ['Content-Type', 'Authorization'], // Cabeçalhos que o frontend pode enviar
  credentials: true // Essencial para permitir o envio de tokens de autorização
};

// --- Middlewares ---
// Habilita o CORS com as opções configuradas. Deve vir antes das rotas.
app.use(cors(corsOptions));

// Habilita o parsing de JSON no corpo das requisições.
app.use(express.json());


// --- Rotas da API ---
// O backend no Render espera o prefixo /api completo em cada rota.
app.use('/api/auth', authRoutes);
app.use('/api', dadosRoutes);       // Para /api/naturezas, /api/ocorrencias, /api/relatorio
app.use('/api', unidadesRoutes);    // Para /api/unidades, /api/crbms
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/plantao', plantaoRoutes);
app.use('/api/usuarios', usuarioRoutes);


// --- Rota Raiz ---
// Uma rota simples para verificar se a API está no ar.
app.get('/', (_req: Request, res: Response) => {
  res.send('API do Sistema de Controle de Ocorrências está no ar!');
});


// --- Inicialização do Servidor ---
// O Render fornece a porta através da variável de ambiente PORT.
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  // Usamos 0.0.0.0 para garantir que o servidor seja acessível de fora do container do Render.
  console.log(`Servidor rodando em http://0.0.0.0:${PORT}` );
});

// Exporta o app para compatibilidade com outros sistemas (embora não seja usado pelo Render).
export default app;
