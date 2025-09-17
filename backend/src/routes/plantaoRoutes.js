const express = require('express');
const router = express.Router();
const { proteger } = require('../middleware/authMiddleware');
const {
  getPlantao,
  setOcorrenciaDestaque,
  setSupervisorPlantao,
  getSupervisores
} = require('../controllers/plantaoController');

// Rota para buscar o estado atual do plantão
router.get('/', proteger, getPlantao);

// Rota para buscar a lista de todos os supervisores
router.get('/supervisores', proteger, getSupervisores);

// Rota para definir a ocorrência de destaque
router.post('/destaque', proteger, setOcorrenciaDestaque);

// Rota para definir o supervisor de plantão
router.post('/supervisor', proteger, setSupervisorPlantao);

module.exports = router;
