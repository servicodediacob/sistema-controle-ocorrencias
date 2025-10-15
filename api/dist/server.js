"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
require("dotenv/config");
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
// import relatorioRoutes from './routes/relatorioRoutes'; // CORREÇÃO: Removido
const auditoriaRoutes_1 = __importDefault(require("./routes/auditoriaRoutes"));
const estatisticasRoutes_1 = __importDefault(require("./routes/estatisticasRoutes"));
const externalRoutes_1 = __importDefault(require("./routes/externalRoutes")); // CORREÇÃO: Garantindo que a importação existe
const authMiddleware_1 = require("./middleware/authMiddleware");
const socketService_1 = require("./services/socketService"); // CORREÇÃO: Usando import nomeado
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: '*',
    },
});
exports.io = io;
(0, socketService_1.initializeSocket)(io);
const PORT = process.env.PORT || 3001;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Rotas públicas
app.use('/api/auth', authRoutes_1.default);
// Rota externa para integração
app.use('/api', externalRoutes_1.default);
// Rotas protegidas
app.use('/api', authMiddleware_1.proteger, usuarioRoutes_1.default);
app.use('/api', authMiddleware_1.proteger, acessoRoutes_1.default);
app.use('/api', authMiddleware_1.proteger, perfilRoutes_1.default);
app.use('/api', authMiddleware_1.proteger, unidadesRoutes_1.default);
app.use('/api', authMiddleware_1.proteger, dadosRoutes_1.default);
app.use('/api', authMiddleware_1.proteger, plantaoRoutes_1.default);
app.use('/api', authMiddleware_1.proteger, ocorrenciaDetalhadaRoutes_1.default);
app.use('/api', authMiddleware_1.proteger, dashboardRoutes_1.default);
// app.use('/api', proteger, relatorioRoutes); // Removido
app.use('/api', authMiddleware_1.proteger, auditoriaRoutes_1.default);
app.use('/api', authMiddleware_1.proteger, estatisticasRoutes_1.default);
server.listen(PORT, () => {
    console.log(`✅ Servidor rodando na porta ${PORT}`);
});
