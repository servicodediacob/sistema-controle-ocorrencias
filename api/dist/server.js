"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.server = exports.io = void 0;
require("./config/envLoader");
// Tratamento de Erros Globais (deve vir antes de qualquer outro código)
process.on('uncaughtException', (error) => {
    console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...', error);
    process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('UNHANDLED REJECTION! 💥 Shutting down...', reason);
    process.exit(1);
});
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const usuarioRoutes_1 = __importDefault(require("./routes/usuarioRoutes"));
const acessoRoutes_1 = __importDefault(require("./routes/acessoRoutes"));
const perfilRoutes_1 = __importDefault(require("./routes/perfilRoutes"));
const unidadesRoutes_1 = __importDefault(require("./routes/unidadesRoutes"));
const dadosRoutes_1 = __importDefault(require("./routes/dadosRoutes"));
const plantaoRoutes_1 = __importDefault(require("./routes/plantaoRoutes"));
const ocorrenciaDetalhadaRoutes_1 = __importDefault(require("./routes/ocorrenciaDetalhadaRoutes"));
const dashboardRoutes_1 = __importDefault(require("./routes/dashboardRoutes"));
// import relatorioRoutes from './routes/relatorioRoutes'; // Removido
const auditoriaRoutes_1 = __importDefault(require("./routes/auditoriaRoutes"));
const estatisticasRoutes_1 = __importDefault(require("./routes/estatisticasRoutes"));
const obmRoutes_1 = __importDefault(require("./routes/obmRoutes")); // New import
const diagRoutes_1 = __importDefault(require("./routes/diagRoutes"));
const externalRoutes_1 = __importDefault(require("./routes/externalRoutes"));
const sisgpoRoutes_1 = __importDefault(require("./routes/sisgpoRoutes"));
const socketService_1 = require("./services/socketService");
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
exports.server = server;
const io = new socket_io_1.Server(server, {
    cors: {
        origin: '*',
    },
});
exports.io = io;
(0, socketService_1.initializeSocket)(io);
const PORT = process.env.PORT || 3001;
const defaultAllowedOrigins = [
    'https://sisgpo.vercel.app',
    'https://sistema-controle-ocorrencias-fronte.vercel.app',
    'http://localhost:5173',
    'http://localhost:5174',
];
const rawAllowedOrigins = process.env.CORS_ALLOWED_ORIGINS ?? process.env.CORS_ORIGINS ?? '';
const envAllowedOrigins = rawAllowedOrigins
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
const allowedOrigins = envAllowedOrigins.length > 0 ? envAllowedOrigins : defaultAllowedOrigins;
const corsOptions = {
    origin: (origin, callback) => {
        if (!origin) {
            return callback(null, true);
        }
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        console.warn(`[CORS] Origin '${origin}' blocked. Allowed origins: ${allowedOrigins.join(', ')}`);
        return callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'If-Match', 'Cache-Control', 'Pragma', 'Expires'],
    credentials: true,
    exposedHeaders: ['ETag'],
};
app.use((0, cors_1.default)(corsOptions));
// As rotas de proxy devem vir antes do express.json() para lidar com uploads de arquivo
app.use('/api/sisgpo', sisgpoRoutes_1.default);
app.use(express_1.default.json());
// Health endpoints used by uptime monitors to keep the instance warm.
app.get('/', (_req, res) => {
    res.send('OK');
});
app.get('/health', (_req, res) => {
    res.json({
        status: 'ok',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
    });
});
app.head('/', (_req, res) => {
    res.sendStatus(200);
});
app.head('/health', (_req, res) => {
    res.sendStatus(200);
});
app.use('/api/auth', authRoutes_1.default);
app.use('/api/diag', diagRoutes_1.default);
app.use('/api/acesso', acessoRoutes_1.default);
app.use('/api', externalRoutes_1.default);
app.use('/api/usuarios', usuarioRoutes_1.default);
app.use('/api/perfil', perfilRoutes_1.default);
app.use('/api/unidades', unidadesRoutes_1.default);
app.use('/api/plantao', plantaoRoutes_1.default);
app.use('/api/ocorrencias-detalhadas', ocorrenciaDetalhadaRoutes_1.default);
app.use('/api/dashboard', dashboardRoutes_1.default);
// app.use('/api', relatorioRoutes);
app.use('/api/auditoria', auditoriaRoutes_1.default);
app.use('/api', estatisticasRoutes_1.default);
app.use('/api/obms', obmRoutes_1.default); // New app.use
app.use('/api', dadosRoutes_1.default);
server.listen(PORT, () => {
    console.log(`[API] Servidor rodando na porta ${PORT}`);
});
