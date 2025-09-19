import { Router } from 'express';
import { proteger } from '../middleware/authMiddleware';

// Controller de dados gerais (Naturezas, Ocorrências)
import {
  getNaturezas,
  getNaturezasPorNomes,
  criarNatureza,
  atualizarNatureza,
  excluirNatureza,
  criarOcorrencia,
  getOcorrencias,
  updateOcorrencia,
  deleteOcorrencia
} from '../controllers/dadosController';

// Controller do formulário de lançamento em lote e relatório estatístico
import { registrarEstatisticas, getRelatorioEstatisticas } from '../controllers/estatisticasController';

// --- IMPORTAÇÃO ADICIONADA ---
// Importa os novos controllers para a funcionalidade de registro de óbitos.
import { 
  getObitosPorData, 
  criarObitoRegistro,
  atualizarObitoRegistro,
  deletarObitoRegistro
} from '../controllers/obitosRegistrosController';

const router = Router();

// --- Rotas de Naturezas de Ocorrência (sem alterações) ---
router.route('/naturezas')
  .get(getNaturezas)
  .post(proteger, criarNatureza);

router.route('/naturezas/por-nomes')
  .post(proteger, getNaturezasPorNomes);

router.route('/naturezas/:id')
  .put(proteger, atualizarNatureza)
  .delete(proteger, excluirNatureza);

// --- Rotas de Ocorrências (CRUD principal, sem alterações) ---
router.route('/ocorrencias')
  .get(proteger, getOcorrencias)
  .post(proteger, criarOcorrencia);

router.route('/ocorrencias/:id')
  .put(proteger, updateOcorrencia)
  .delete(proteger, deleteOcorrencia);

// --- Rota para o formulário de lançamento em lote (sem alterações) ---
router.route('/estatisticas/lote')
  .post(proteger, registrarEstatisticas);

// --- Rota para buscar os dados do relatório estatístico consolidado (sem alterações) ---
router.route('/relatorio')
  .get(proteger, getRelatorioEstatisticas);

// --- NOVAS ROTAS ADICIONADAS ---
// Rotas para o CRUD de Registros de Óbitos, usadas pela página "Relatório de Óbitos".
router.route('/obitos-registros')
  .get(proteger, getObitosPorData)      // Busca os registros para a tabela.
  .post(proteger, criarObitoRegistro); // Salva um novo registro do modal.

// Rotas para futuras funcionalidades de edição e exclusão.
router.route('/obitos-registros/:id')
  .put(proteger, atualizarObitoRegistro)
  .delete(proteger, deletarObitoRegistro);


export default router;
