// api/src/controllers/obitosRegistrosController.ts
import { Response } from 'express';
import { RequestWithUser } from '@/middleware/authMiddleware';
import { prisma } from '../lib/prisma';
import logger from '@/config/logger';
import { excluirRegistrosAntigos } from '@/services/cleanupService';
import { registrarAcao } from '@/services/auditoriaService';

interface ObitoRegistroPayload {
  data_ocorrencia: string;
  natureza_id: number;
  numero_ocorrencia: string;
  obm_id: number;
  quantidade_vitimas: number;
}

export const getObitosPorData = async (req: RequestWithUser, res: Response) => {
  const { data } = req.query;
  if (!data || typeof data !== 'string') {
    return res.status(400).json({ message: 'A data é obrigatória.' });
  }
  try {
    const dataInicio = new Date(data + 'T00:00:00.000Z');
    const dataFim = new Date(data + 'T23:59:59.999Z');

    const registros = await prisma.obitoRegistro.findMany({
      where: { 
        data_ocorrencia: { gte: dataInicio, lte: dataFim },
        deletado_em: null,
      },
      include: {
        natureza: { select: { subgrupo: true } },
        obm: { select: { nome: true } },
      },
      orderBy: [{ natureza: { subgrupo: 'asc' } }, { id: 'asc' }],
    });

    const resultadoFormatado = registros.map(r => ({
      ...r,
      natureza_nome: r.natureza.subgrupo,
      obm_nome: r.obm?.nome,
    }));

    return res.status(200).json(resultadoFormatado);
  } catch (error) {
    logger.error({ err: error, data }, 'Erro ao buscar registros de óbito.');
    return res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};

export const criarObitoRegistro = async (req: RequestWithUser, res: Response) => {
  await excluirRegistrosAntigos();
  const payload = req.body as ObitoRegistroPayload;
  const usuario_id = req.usuario?.id;

  try {
    const novoRegistro = await prisma.obitoRegistro.create({
      data: {
        data_ocorrencia: new Date(payload.data_ocorrencia),
        natureza_id: payload.natureza_id,
        numero_ocorrencia: payload.numero_ocorrencia,
        obm_id: payload.obm_id,
        quantidade_vitimas: payload.quantidade_vitimas,
        usuario_id: usuario_id,
      },
    });
    
    await registrarAcao(req, 'CRIAR_OBITO_REGISTRO', { registro: novoRegistro });

    logger.info({ registro: novoRegistro, usuarioId: usuario_id }, 'Novo registro de óbito criado.');
    return res.status(201).json(novoRegistro);
  } catch (error) {
    logger.error({ err: error, body: req.body }, 'Erro ao criar registro de óbito.');
    return res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};

export const atualizarObitoRegistro = async (req: RequestWithUser, res: Response) => {
    const { id } = req.params;
    const payload = req.body as ObitoRegistroPayload;
    try {
        const registroAntes = await prisma.obitoRegistro.findUnique({ where: { id: Number(id) } });

        const registroAtualizado = await prisma.obitoRegistro.update({
            where: { id: Number(id) },
            data: {
              data_ocorrencia: new Date(payload.data_ocorrencia),
              natureza_id: payload.natureza_id,
              numero_ocorrencia: payload.numero_ocorrencia,
              obm_id: payload.obm_id,
              quantidade_vitimas: payload.quantidade_vitimas,
              usuario_id: req.usuario?.id,
            }
        });

        await registrarAcao(req, 'ATUALIZAR_OBITO_REGISTRO', { antes: registroAntes, depois: registroAtualizado });

        logger.info({ registroId: id, usuarioId: req.usuario?.id }, 'Registro de óbito atualizado.');
        return res.status(200).json(registroAtualizado);
    } catch (error) {
        logger.error({ err: error, params: req.params, body: req.body }, 'Erro ao atualizar registro de óbito.');
        return res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};

export const deletarObitoRegistro = async (req: RequestWithUser, res: Response) => {
    const { id } = req.params;
    try {
        const registroAntes = await prisma.obitoRegistro.findUnique({ where: { id: Number(id) } });

        const resultado = await prisma.obitoRegistro.updateMany({
            where: { id: Number(id), deletado_em: null },
            data: { deletado_em: new Date(), usuario_id: req.usuario?.id },
        });

        if (resultado.count === 0) {
            return res.status(404).json({ message: 'Registro de óbito não encontrado.' });
        }

        await registrarAcao(req, 'DELETAR_OBITO_REGISTRO', { registro: registroAntes });

        logger.info({ registroId: id, usuarioId: req.usuario?.id }, 'Registro de óbito marcado como excluído.');
        return res.status(204).send();
    } catch (error) {
        logger.error({ err: error, params: req.params }, 'Erro ao deletar registro de óbito.');
        return res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};

export const limparRegistrosPorData = async (req: RequestWithUser, res: Response) => {
    const { data } = req.query;
    if (!data || typeof data !== 'string') {
        return res.status(400).json({ message: 'O parâmetro "data" é obrigatório.' });
    }
    try {
        const dataInicio = new Date(data + 'T00:00:00.000Z');
        const dataFim = new Date(data + 'T23:59:59.999Z');

        const result = await prisma.obitoRegistro.updateMany({ 
            where: { 
                data_ocorrencia: { gte: dataInicio, lte: dataFim },
                deletado_em: null 
            },
            data: { deletado_em: new Date() }
        });

        await registrarAcao(req, 'LIMPAR_REGISTROS_OBITO_POR_DATA', { data, count: result.count });

        logger.info({ data, count: result.count, usuarioId: req.usuario?.id }, 'Registros de óbitos (soft) limpos por data.');
        return res.status(200).json({ message: `Operação concluída. ${result.count} registros de óbito foram marcados como excluídos para a data ${data}.` });
    } catch (error) {
        logger.error({ err: error, data }, 'Erro ao limpar registros de óbito por data.');
        return res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};