// Este arquivo centraliza todos os endpoints da API para fácil manutenção.

const routes = {
  // Auth & Acesso
  login: '/auth/login',
  solicitarAcesso: '/acesso/solicitar',
  listarSolicitacoes: '/acesso',
  gerenciarSolicitacao: (id: number) => `/acesso/${id}/gerenciar`,

  // Dados de Apoio (Unidades, Naturezas, etc.)
  crbms: '/crbms',
  unidades: '/unidades',
  usuarios: '/usuarios',
  naturezas: '/naturezas',
  
  // Ocorrências Detalhadas
  ocorrenciasDetalhadas: '/ocorrencias-detalhadas',
  ocorrenciaDetalhadaById: (id: number) => `/ocorrencias-detalhadas/${id}`,

  // Plantão
  plantao: '/plantao',
  supervisores: '/plantao/supervisores',
  setSupervisor: '/plantao/supervisor',

  // Estatísticas e Relatórios
  dashboardStats: '/dashboard/stats',
  estatisticasLote: '/estatisticas/lote',
  estatisticasPorData: '/estatisticas/por-data',
  relatorioCompleto: '/relatorio-completo',
  limpezaDiaCompleto: '/limpeza/dia-completo',

  // Óbitos
  obitosRegistros: '/obitos-registros',
  obitoRegistroById: (id: number) => `/obitos-registros/${id}`,

  // Diagnóstico
  healthCheck: '/health',
};

export default routes;
