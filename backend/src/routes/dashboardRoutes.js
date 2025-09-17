// backend/src/routes/dashboardRoutes.js

const express = require('express');
const router = express.Router();

const { getDashboardStats } = require('../controllers/dashboardController');
const { proteger } = require('../middleware/authMiddleware');

// Rota para buscar as estatísticas do dashboard
// A rota é protegida, exigindo um token de autenticação válido.
router.get('/stats', proteger, getDashboardStats);

module.exports = router;
