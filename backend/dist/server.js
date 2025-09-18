"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const dadosRoutes_1 = __importDefault(require("./routes/dadosRoutes"));
const dashboardRoutes_1 = __importDefault(require("./routes/dashboardRoutes"));
const plantaoRoutes_1 = __importDefault(require("./routes/plantaoRoutes"));
const usuarioRoutes_1 = __importDefault(require("./routes/usuarioRoutes"));
const app = (0, express_1.default)();
// Middlewares
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Rotas da API
app.use('/api/auth', authRoutes_1.default);
app.use('/api', dadosRoutes_1.default);
app.use('/api/dashboard', dashboardRoutes_1.default);
app.use('/api/plantao', plantaoRoutes_1.default);
app.use('/api/usuarios', usuarioRoutes_1.default);
// Rota raiz
app.get('/', (_req, res) => {
    res.send('API do Sistema de Controle de Ocorrências está no ar!');
});
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
