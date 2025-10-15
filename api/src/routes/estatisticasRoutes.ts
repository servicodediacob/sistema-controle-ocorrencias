// api/src/routes/estatisticasRoutes.ts

import { Router } from 'express';
import { 
  registrarEstatisticasLote, 
  getEstatisticasAgrupadasPorData, 
  limparTodosOsDadosDoDia,
  getSisgpoDashboard 
} from '../controllers/estatisticasController';

// CORREÇÃO FINAL: Importando as funções com os nomes corretos dos arquivos
import { proteger } from '../middleware/authMiddleware'; 
import { roleMiddleware } from '../middleware/roleMiddleware'; 

const router = Router();

// --- Rotas existentes ---
router.post('/estatisticas/lote', proteger, registrarEstatisticasLote);
router.get('/estatisticas/agrupadas', proteger, getEstatisticasAgrupadasPorData);
router.delete('/estatisticas/limpar-dia', proteger, roleMiddleware(['ADMIN']), limparTodosOsDadosDoDia);

// --- Nova rota para a integração ---
router.get('/estatisticas-externas/dashboard', proteger, getSisgpoDashboard);

export default router;