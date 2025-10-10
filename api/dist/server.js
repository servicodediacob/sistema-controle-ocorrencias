"use strict";
// api/src/server.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Carrega as variáveis de ambiente do arquivo .env o mais cedo possível
require("./config/envLoader");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const logger_1 = __importDefault(require("./config/logger"));
const socketService_1 = require("./services/socketService");
// Importação das rotas
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const acessoRoutes_1 = __importDefault(require("./routes/acessoRoutes"));
const plantaoRoutes_1 = __importDefault(require("./routes/plantaoRoutes"));
const ocorrenciaDetalhadaRoutes_1 = __importDefault(require("./routes/ocorrenciaDetalhadaRoutes"));
const perfilRoutes_1 = __importDefault(require("./routes/perfilRoutes"));
const auditoriaRoutes_1 = __importDefault(require("./routes/auditoriaRoutes"));
const dadosRoutes_1 = __importDefault(require("./routes/dadosRoutes"));
const diagRoutes_1 = __importDefault(require("./routes/diagRoutes"));
// --- Configuração de CORS ---
const defaultAllowedOrigins = [
    'http://localhost:5173',
    'https://siscob-iota.vercel.app',
    'https://sistema-ocorrencias-frontend-alpha.vercel.app',
];
const extraAllowedOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean)
    : [];
const allowedOrigins = Array.from(new Set([...defaultAllowedOrigins, ...extraAllowedOrigins]));
if (extraAllowedOrigins.length > 0) {
    logger_1.default.info({ allowedOrigins }, '[CORS] Origem(s) adicionais carregadas de CORS_ORIGINS.');
}
const corsOptions = {
    origin: (origin, callback) => {
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
// --- Inicialização da Aplicação ---
const app = (0, express_1.default)();
app.use((0, cors_1.default)(corsOptions));
app.use(express_1.default.json());
// --- Rotas ---
app.use('/api/diag', diagRoutes_1.default);
app.use('/api/auth', authRoutes_1.default);
app.use('/api/acesso', acessoRoutes_1.default);
app.use('/api/plantao', plantaoRoutes_1.default);
app.use('/api/ocorrencias-detalhadas', ocorrenciaDetalhadaRoutes_1.default);
app.use('/api/perfil', perfilRoutes_1.default);
app.use('/api/auditoria', auditoriaRoutes_1.default);
app.use('/api', dadosRoutes_1.default);
// --- Configuração do Servidor HTTP e Socket.IO ---
const httpServer = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(httpServer, { cors: corsOptions });
(0, socketService_1.onSocketConnection)(io);
// --- Inicialização do Servidor ---
const PORT = process.env.PORT || 3001;
const server = httpServer.listen(PORT, () => {
    logger_1.default.info(`Servidor rodando na porta ${PORT} em modo ${process.env.NODE_ENV || 'development'}`);
});
exports.default = server;
