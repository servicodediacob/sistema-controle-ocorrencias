require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const dadosRoutes = require('./routes/dadosRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes'); // Já existia
const plantaoRoutes = require('./routes/plantaoRoutes'); // <-- 1. Importar novas rotas

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api', dadosRoutes); // Continua como /api para /obms, /naturezas, /ocorrencias
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/plantao', plantaoRoutes); // <-- 2. Registrar novas rotas

// Rota raiz
app.get('/', (req, res) => {
  res.send('API do Sistema de Controle de Ocorrências está no ar!');
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
