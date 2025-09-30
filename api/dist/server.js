"use strict";
// Caminho: api/src/server.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("./config/envLoader"); // Garante que as variaveis de ambiente sejam carregadas primeiro
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const logger_1 = __importDefault(require("./config/logger"));
const socketService_1 = require("./services/socketService");
// Importacao das rotas
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const acessoRoutes_1 = __importDefault(require("./routes/acessoRoutes"));
const plantaoRoutes_1 = __importDefault(require("./routes/plantaoRoutes"));
const ocorrenciaDetalhadaRoutes_1 = __importDefault(require("./routes/ocorrenciaDetalhadaRoutes"));
const dadosRoutes_1 = __importDefault(require("./routes/dadosRoutes"));
const diagController_1 = require("./controllers/diagController");
// ======================= INÍCIO DA CORREÇÃO =======================
// --- Configuracao de CORS ---
// Adicionamos a nova URL de produção do frontend à lista de origens permitidas.
const defaultAllowedOrigins = [
    'http://localhost:5173', // Para desenvolvimento local
    'https://siscob-iota.vercel.app', // SUA NOVA URL DE PRODUÇÃO
    'https://sistema-ocorrencias-frontend-alpha.vercel.app', // URL antiga (pode ser mantida ou removida )
];
// ======================= FIM DA CORREÇÃO =======================
const extraAllowedOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map((origin) => origin.trim()).filter((origin) => origin.length > 0)
    : [];
const allowedOrigins = Array.from(new Set([...defaultAllowedOrigins, ...extraAllowedOrigins]));
if (extraAllowedOrigins.length > 0) {
    logger_1.default.info({ allowedOrigins }, '[CORS] Origem(s) adicionais carregadas de CORS_ORIGINS.');
}
const corsOptions = {
    origin: (origin, callback) => {
        // Permite requisicoes sem origin (ex: Postman, apps mobile) ou das origens listadas
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            logger_1.default.warn({ origin }, 'Origem bloqueada pelo CORS');
            callback(new Error('Nao permitido pelo CORS'));
        }
    },
    credentials: true,
};
// --- Inicializacao da Aplicacao ---
const app = (0, express_1.default)();
app.use((0, cors_1.default)(corsOptions));
app.use(express_1.default.json());
// --- Rotas Publicas ---
// Rotas que nao exigem autenticacao devem vir primeiro.
app.get('/api/diag', diagController_1.runDiagnostics); // Rota de diagnostico (Health Check)
app.use('/api/auth', authRoutes_1.default); // Rotas de login
app.use('/api/acesso', acessoRoutes_1.default); // Rota publica para solicitar acesso
// --- Rotas Protegidas ---
// A partir daqui, todas as rotas podem (e devem) ser protegidas pelo middleware de autenticacao.
app.use('/api/plantao', plantaoRoutes_1.default);
app.use('/api/ocorrencias-detalhadas', ocorrenciaDetalhadaRoutes_1.default);
app.use('/api', dadosRoutes_1.default); // Agrupa a maioria das rotas de dados
// --- Configuracao do Servidor HTTP e Socket.IO ---
const httpServer = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(httpServer, { cors: corsOptions });
(0, socketService_1.onSocketConnection)(io);
// --- Inicializacao do Servidor ---
const PORT = process.env.PORT || 3001;
const server = httpServer.listen(PORT, () => {
    logger_1.default.info(`Servidor rodando na porta ${PORT} em modo ${process.env.NODE_ENV || 'development'}`);
});
exports.default = server;
