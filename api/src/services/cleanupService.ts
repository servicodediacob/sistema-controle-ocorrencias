import { prisma } from '../lib/prisma';

const LIMITE_RETENCAO_DIAS = 31;

export const excluirRegistrosAntigos = async () => {
  const limite = new Date();
  limite.setDate(limite.getDate() - LIMITE_RETENCAO_DIAS);

  try {
    await prisma.estatisticaDiaria.deleteMany({
      where: { data_registro: { lt: limite } },
    });

    await prisma.ocorrenciaDetalhada.deleteMany({
      where: { data_ocorrencia: { lt: limite } },
    });

    await prisma.obitoRegistro.deleteMany({
      where: { data_ocorrencia: { lt: limite } },
    });
  } catch (error) {
    console.error('Erro ao excluir registros antigos:', error);
    // Considere um tratamento de erro mais robusto aqui
  }
};
