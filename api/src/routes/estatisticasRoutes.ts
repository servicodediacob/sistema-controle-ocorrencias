// api/src/routes/estatisticasRoutes.ts

import { Router } from 'express';
import { 
  registrarEstatisticasLote, 
  getEstatisticasAgrupadasPorIntervalo as getEstatisticasAgrupadasPorData, 
  limparDadosPorIntervalo as limparTodosOsDadosDoDia,
  getSisgpoDashboard 
} from '../controllers/estatisticasController';

// CORREÇÃO FINAL: Importando as funções com os nomes corretos dos arquivos
import { proteger } from '../middleware/authMiddleware'; 
import { roleMiddleware } from '../middleware/roleMiddleware'; 

const router = Router();

// --- Rotas existentes ---
router.post('/estatisticas/lote', proteger, registrarEstatisticasLote);
router.get('/estatisticas/por-intervalo', proteger, getEstatisticasAgrupadasPorData);
router.delete('/limpeza/intervalo', proteger, roleMiddleware(['admin']), limparTodosOsDadosDoDia);

// --- Nova rota para a integração ---
router.get('/estatisticas-externas/dashboard', getSisgpoDashboard);

export default router;
