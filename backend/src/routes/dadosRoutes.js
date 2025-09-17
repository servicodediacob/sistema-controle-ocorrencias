const express = require('express');
const router = express.Router();

const { 
  getObms, 
  getNaturezas, 
  criarOcorrencia,
  getOcorrencias,
  updateOcorrencia, // <-- Importa a função
  deleteOcorrencia  // <-- Importa a função
} = require('../controllers/ocorrenciaController'); 

const { proteger } = require('../middleware/authMiddleware');

// --- Rotas de Apoio (GET) ---
router.get('/obms', getObms);
router.get('/naturezas', getNaturezas);

// --- Rotas de Ocorrências (CRUD) ---
router.post('/ocorrencias', proteger, criarOcorrencia);
router.get('/ocorrencias', proteger, getOcorrencias);

// --- NOVAS ROTAS DE UPDATE E DELETE ---
router.put('/ocorrencias/:id', proteger, updateOcorrencia);
router.delete('/ocorrencias/:id', proteger, deleteOcorrencia);

module.exports = router;
