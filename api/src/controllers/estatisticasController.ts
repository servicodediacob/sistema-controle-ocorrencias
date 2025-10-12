// api/src/controllers/estatisticasController.ts
import { Response } from 'express';
import { RequestWithUser } from '@/middleware/authMiddleware';
import { prisma } from '../lib/prisma';
import logger from '@/config/logger';
import { parseDateParam } from '@/utils/date';

// ... (interfaces e registrarEstatisticasLote sem alterações)
interface IEstatisticaAgrupada {
  cidade_nome: string;
  crbm_nome: string;
  natureza_id?: number;
  natureza_grupo?: string;
  natureza_nome: string;
  natureza_abreviacao: string | null;
  quantidade: number;
}

interface EstatisticaPayload {
  data_registro: string;
  obm_id: number;
  estatisticas: { natureza_id: number; quantidade: number }[];
}

export const registrarEstatisticasLote = async (req: RequestWithUser, res: Response): Promise<Response | void> => {
  const { data_registro, obm_id, estatisticas } = req.body as EstatisticaPayload;
  const usuario = req.usuario;

  if (!usuario) {
    return res.status(401).json({ message: 'Usuário não autenticado.' });
  }

  if (usuario.role !== 'admin' && usuario.obm_id !== obm_id) {
    return res.status(403).json({ message: 'Acesso negado. Você só pode registrar dados para a sua própria OBM.' });
  }

  if (!data_registro || !obm_id || !estatisticas) {
    return res.status(400).json({ message: 'Dados incompletos. data_registro, obm_id e estatisticas são obrigatórios.' });
  }

  try {
    const dataParsed = parseDateParam(data_registro, 'data_registro');
    await prisma.$transaction(async (tx) => {
      await tx.estatisticaDiaria.deleteMany({
        where: {
          data_registro: dataParsed,
          obm_id: obm_id,
        },
      });

      const dadosParaCriar = estatisticas
        .filter(stat => stat.quantidade > 0)
        .map(stat => ({
          data_registro: dataParsed,
          obm_id: obm_id,
          natureza_id: stat.natureza_id,
          quantidade: stat.quantidade,
          usuario_id: usuario.id,
        }));

      if (dadosParaCriar.length > 0) {
        await tx.estatisticaDiaria.createMany({
          data: dadosParaCriar,
        });
      }
    });

    const totalRegistros = estatisticas.filter(s => s.quantidade > 0).length;
    if (totalRegistros === 0) {
      logger.info({ data: data_registro, obm_id }, 'Registros de estatísticas limpos (nenhum dado novo para inserir).');
      return res.status(200).json({ message: 'Nenhuma estatística para registrar. Registros anteriores para o dia e OBM foram limpos.' });
    }
    
    logger.info({ data: data_registro, obm_id, count: totalRegistros }, 'Estatísticas em lote registradas com sucesso.');
    return res.status(201).json({ message: `${totalRegistros} tipo(s) de estatística registrados com sucesso para a OBM!` });

  } catch (error) {
    logger.error({ err: error, body: req.body }, 'Erro ao registrar estatísticas em lote.');
    return res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};


export const getEstatisticasAgrupadasPorData = async (req: RequestWithUser, res: Response): Promise<Response | void> => {
  const { data } = req.query;
  if (!data || typeof data !== 'string') {
    return res.status(400).json({ message: 'A data é obrigatória.' });
  }

  try {
    // ======================= INÍCIO DA CORREÇÃO =======================
    // Usa parseDateParam para evitar problemas de fuso/UTC e garante o dia completo no horário local
    const base = parseDateParam(data, 'data');
    const dataInicio = new Date(base);
    dataInicio.setHours(0, 0, 0, 0);
    const dataFim = new Date(base);
    dataFim.setHours(23, 59, 59, 999);

    const estatisticas = await prisma.estatisticaDiaria.findMany({
      where: { data_registro: { gte: dataInicio, lte: dataFim } },
      include: {
        obm: { include: { crbm: true } },
        natureza: true,
      },
    });
    // ======================= FIM DA CORREÇÃO =======================

    const dadosAgrupados: Record<string, IEstatisticaAgrupada> = {};

    // Importante: usamos a combinação Cidade x Natureza (por ID) para evitar
    // colisões de subgrupos com o mesmo nome, por exemplo “Outros” em
    // diferentes grupos (Incêndio vs. Ações Preventivas).
    const processarItem = (item: any, quantidade: number) => {
      const cidadeNome = item.obm?.nome;
      const crbmNome = item.obm?.crbm?.nome;
      const naturezaNome = item.natureza?.subgrupo;
      const naturezaAbreviacao = item.natureza?.abreviacao;
      const naturezaId = item.natureza?.id ?? null;
      const naturezaGrupo = item.natureza?.grupo;

      if (cidadeNome && naturezaNome && crbmNome) {
        // Chave única e estável: Cidade|naturezaId (ou, como fallback, grupo|subgrupo)
        const naturezaChave = naturezaId !== null
          ? String(naturezaId)
          : `${naturezaGrupo}|${naturezaNome}`;
        const chave = `${cidadeNome}|${naturezaChave}`;

        if (!dadosAgrupados[chave]) {
          dadosAgrupados[chave] = {
            cidade_nome: cidadeNome,
            crbm_nome: crbmNome,
            natureza_id: naturezaId ?? undefined,
            natureza_grupo: naturezaGrupo,
            natureza_nome: naturezaNome,
            natureza_abreviacao: naturezaAbreviacao || null,
            quantidade: 0,
          };
        }
        dadosAgrupados[chave].quantidade += quantidade;
      }
    };

    estatisticas.forEach(item => processarItem(item, item.quantidade));

    const resultadoFinal = Object.values(dadosAgrupados).sort((a, b) => a.cidade_nome.localeCompare(b.cidade_nome));

    return res.status(200).json(resultadoFinal);

  } catch (error) {
    logger.error({ err: error, query: req.query }, 'Erro ao buscar estatísticas unificadas por data.');
    return res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};

// ... (resto do arquivo sem alterações)
export const limparTodosOsDadosDoDia = async (req: RequestWithUser, res: Response): Promise<Response | void> => {
  const { data } = req.query;
  const usuario = req.usuario;

  if (!usuario || usuario.role !== 'admin') {
    return res.status(403).json({ message: 'Acesso negado. Apenas administradores podem executar esta ação.' });
  }

  if (!data || typeof data !== 'string') {
    return res.status(400).json({ message: 'A data é obrigatória para limpar os registros.' });
  }

  const dataInicio = new Date(data + 'T00:00:00.000Z');
  const dataFim = new Date(data + 'T23:59:59.999Z');

  try {
    const [loteResult, detalhadasResult] = await prisma.$transaction([
      prisma.estatisticaDiaria.deleteMany({ where: { data_registro: { gte: dataInicio, lte: dataFim } } }),
      prisma.ocorrenciaDetalhada.deleteMany({ where: { data_ocorrencia: { gte: dataInicio, lte: dataFim } } }),
    ]);

    const totalLimpado = loteResult.count + detalhadasResult.count;
    logger.info({ data, adminId: usuario.id, total: totalLimpado }, 'Limpeza de dados do dia executada.');
    
    return res.status(200).json({ message: `Operação concluída. ${totalLimpado} registros de ocorrência foram excluídos para o dia ${data}.` });

  } catch (error) {
    logger.error({ err: error, query: req.query }, 'Erro ao limpar todos os dados do dia.');
    return res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};
