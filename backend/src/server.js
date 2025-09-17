// backend/src/server.js

require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const dadosRoutes = require('./routes/dadosRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const plantaoRoutes = require('./routes/plantaoRoutes');
const usuarioRoutes = require('./routes/usuarioRoutes'); // <-- 1. IMPORTAR AS NOVAS ROTAS

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api', dadosRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/plantao', plantaoRoutes);
app.use('/api/usuarios', usuarioRoutes); // <-- 2. REGISTRAR AS NOVAS ROTAS

// Rota raiz
app.get('/', (req, res) => {
  res.send('API do Sistema de Controle de Ocorrências está no ar!');
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
