// backend/src/routes/dadosRoutes.js

const express = require('express');
const router = express.Router();
const { proteger } = require('../middleware/authMiddleware');

const { 
  // Funções de OBMs
  getObms,
  criarObm,
  atualizarObm,
  excluirObm,
  // Funções de Naturezas
  getNaturezas,
  criarNatureza,
  atualizarNatureza,
  excluirNatureza,
  // Funções de Ocorrências
  criarOcorrencia,
  getOcorrencias,
  updateOcorrencia,
  deleteOcorrencia
} = require('../controllers/dadosController'); 

// --- Rotas de OBMs ---
router.route('/obms')
  .get(getObms) // Rota pública para buscar OBMs
  .post(proteger, criarObm); // Rota privada para criar nova OBM

router.route('/obms/:id')
  .put(proteger, atualizarObm) // Rota privada para atualizar OBM
  .delete(proteger, excluirObm); // Rota privada para excluir OBM

// --- Rotas de Naturezas de Ocorrência ---
router.route('/naturezas')
  .get(getNaturezas) // Rota pública para buscar naturezas
  .post(proteger, criarNatureza); // Rota privada para criar nova natureza

router.route('/naturezas/:id')
  .put(proteger, atualizarNatureza) // Rota privada para atualizar natureza
  .delete(proteger, excluirNatureza); // Rota privada para excluir natureza

// --- Rotas de Ocorrências (CRUD) ---
router.route('/ocorrencias')
  .get(proteger, getOcorrencias)
  .post(proteger, criarOcorrencia);

router.route('/ocorrencias/:id')
  .put(proteger, updateOcorrencia)
  .delete(proteger, deleteOcorrencia);

module.exports = router;
