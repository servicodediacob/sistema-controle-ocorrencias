// api/src/controllers/ocorrenciaDetalhadaController.ts
import { Response } from 'express';
import { RequestWithUser } from '@/middleware/authMiddleware';
import { prisma } from '../lib/prisma';
import logger from '@/config/logger';
import { parseDateParam } from '@/utils/date';
import { excluirRegistrosAntigos } from '@/services/cleanupService';
import { registrarAcao } from '@/services/auditoriaService';
import sisgpoSyncService from '@/services/sisgpoSyncService';

// ... (interface e criarOcorrenciaDetalhada permanecem iguais)
interface OcorrenciaDetalhadaPayload {
  numero_ocorrencia?: string;
  natureza_id: number;
  endereco?: string;
  bairro?: string;
  cidade_id: number;
  viaturas?: string;
  veiculos_envolvidos?: string;
  dados_vitimas?: string;
  resumo_ocorrencia: string;
  data_ocorrencia: string;
  horario_ocorrencia?: string;
}

export const criarOcorrenciaDetalhada = async (req: RequestWithUser, res: Response) => {
  await excluirRegistrosAntigos();
  const payload: OcorrenciaDetalhadaPayload = req.body;
  const usuario_id = req.usuario?.id;

  try {
    // Coerção e validação de tipos vindos do frontend (podem chegar como string)
    const naturezaId = Number((payload as any).natureza_id ?? payload.natureza_id);
    const cidadeId = Number((payload as any).cidade_id ?? payload.cidade_id);
    if (!Number.isInteger(naturezaId) || naturezaId <= 0) {
      return res.status(400).json({ message: 'natureza_id inválido. Deve ser um inteiro.' });
    }
    if (!Number.isInteger(cidadeId) || cidadeId <= 0) {
      return res.status(400).json({ message: 'cidade_id inválido. Deve ser um inteiro.' });
    }

    const novaOcorrencia = await prisma.$transaction(async (tx) => {
      const ocorrenciaCriada = await tx.ocorrenciaDetalhada.create({
        data: {
          numero_ocorrencia: payload.numero_ocorrencia,
          natureza_id: naturezaId,
          endereco: payload.endereco,
          bairro: payload.bairro,
          cidade_id: cidadeId,
          viaturas: payload.viaturas,
          veiculos_envolvidos: payload.veiculos_envolvidos,
          dados_vitimas: payload.dados_vitimas,
          resumo_ocorrencia: payload.resumo_ocorrencia,
          data_ocorrencia: new Date(payload.data_ocorrencia + 'T00:00:00Z'), // Salva sempre em UTC
          // Prisma espera um Date para campos @db.Time. Convertemos HH:mm em uma data base 1970-01-01.
          horario_ocorrencia: payload.horario_ocorrencia
            ? new Date(`1970-01-01T${payload.horario_ocorrencia}:00Z`)
            : null,
          usuario_id: usuario_id,
        },
      });

      await tx.ocorrenciaDestaque.upsert({
        where: { id: 1 },
        update: { ocorrencia_id: ocorrenciaCriada.id, definido_em: new Date() },
        create: { id: 1, ocorrencia_id: ocorrenciaCriada.id, definido_em: new Date() },
      });

      return ocorrenciaCriada;
    });

    await registrarAcao(req, 'CRIAR_OCORRENCIA_DETALHADA', { ocorrencia: novaOcorrencia });

    // FEEDBACK LOOP: Sincronizar status EMPENHADA com SISGPO (assíncrono, não bloqueia resposta)
    if (payload.viaturas) {
      const viaturasPrefixos = payload.viaturas.split(',').map((v: string) => v.trim());
      viaturasPrefixos.forEach((prefixo: string) => {
        if (prefixo) {
          // Fire-and-forget: não aguarda resposta do SISGPO
          sisgpoSyncService.marcarViaturaEmpenhada(
            prefixo,
            String(novaOcorrencia.id),
            req.headers.authorization?.replace('Bearer ', '')
          ).catch(() => { /* Erro já é tratado no service */ });
        }
      });
    }

    logger.info({ ocorrenciaId: novaOcorrencia.id, usuarioId: usuario_id }, 'Ocorrência detalhada criada e definida como destaque.');
    return res.status(201).json(novaOcorrencia);

  } catch (error) {
    logger.error({ err: error, payload }, 'Erro ao criar ocorrência detalhada.');
    return res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};


export const getOcorrenciasDetalhadasPorIntervalo = async (req: RequestWithUser, res: Response) => {
  const { dataInicio, dataFim } = req.query;

  if (!dataInicio || typeof dataInicio !== 'string' || !dataFim || typeof dataFim !== 'string') {
    return res.status(400).json({ message: 'Os parâmetros "dataInicio" e "dataFim" são obrigatórios.' });
  }

  try {
    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);

    const ocorrencias = await prisma.ocorrenciaDetalhada.findMany({
      where: {
        data_ocorrencia: {
          gte: inicio,
          lte: fim,
        },
        deletado_em: null,
      },
      include: { natureza: true, cidade: true },
      orderBy: [{ horario_ocorrencia: 'asc' }, { id: 'asc' }],
    });

    const resultadoFormatado = ocorrencias.map(od => ({
      ...od,
      natureza_grupo: od.natureza.grupo,
      natureza_nome: od.natureza.subgrupo,
      cidade_nome: od.cidade.nome,
      horario_ocorrencia: od.horario_ocorrencia
        ? new Date((od.horario_ocorrencia as unknown as string)).toISOString().substring(11, 16)
        : null,
    }));

    return res.status(200).json(resultadoFormatado);
  } catch (error) {
    logger.error({ err: error, dataInicio, dataFim }, 'Erro ao buscar ocorrências detalhadas.');
    return res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};

// ... (resto do arquivo sem alterações)
export const atualizarOcorrenciaDetalhada = async (req: RequestWithUser, res: Response) => {
  const { id } = req.params;
  const payload: OcorrenciaDetalhadaPayload = req.body;

  try {
    const naturezaId = Number((payload as any).natureza_id ?? payload.natureza_id);
    const cidadeId = Number((payload as any).cidade_id ?? payload.cidade_id);
    if (!Number.isInteger(naturezaId) || naturezaId <= 0) {
      return res.status(400).json({ message: 'natureza_id inválido. Deve ser um inteiro.' });
    }
    if (!Number.isInteger(cidadeId) || cidadeId <= 0) {
      return res.status(400).json({ message: 'cidade_id inválido. Deve ser um inteiro.' });
    }

    const ocorrenciaAntes = await prisma.ocorrenciaDetalhada.findUnique({ where: { id: Number(id) } });

    const ocorrenciaAtualizada = await prisma.ocorrenciaDetalhada.update({
      where: { id: Number(id) },
      data: {
        numero_ocorrencia: payload.numero_ocorrencia,
        natureza_id: naturezaId,
        endereco: payload.endereco,
        bairro: payload.bairro,
        cidade_id: cidadeId,
        viaturas: payload.viaturas,
        veiculos_envolvidos: payload.veiculos_envolvidos,
        dados_vitimas: payload.dados_vitimas,
        resumo_ocorrencia: payload.resumo_ocorrencia,
        data_ocorrencia: new Date(payload.data_ocorrencia + 'T00:00:00Z'),
        horario_ocorrencia: payload.horario_ocorrencia
          ? new Date(`1970-01-01T${payload.horario_ocorrencia}:00Z`)
          : null,
        usuario_id: req.usuario?.id,
      },
    });

    await registrarAcao(req, 'ATUALIZAR_OCORRENCIA_DETALHADA', { antes: ocorrenciaAntes, depois: ocorrenciaAtualizada });

    logger.info({ ocorrenciaId: id, usuarioId: req.usuario?.id }, 'Ocorrência detalhada atualizada.');
    return res.status(200).json(ocorrenciaAtualizada);
  } catch (error) {
    logger.error({ err: error, payload, ocorrenciaId: id }, 'Erro ao atualizar ocorrência detalhada.');
    return res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};

export const deletarOcorrenciaDetalhada = async (req: RequestWithUser, res: Response) => {
  const { id } = req.params;
  try {
    const ocorrenciaAntes = await prisma.ocorrenciaDetalhada.findUnique({ where: { id: Number(id) } });

    const resultado = await prisma.ocorrenciaDetalhada.updateMany({
      where: { id: Number(id), deletado_em: null },
      data: { deletado_em: new Date(), usuario_id: req.usuario?.id },
    });

    if (resultado.count === 0) {
      return res.status(404).json({ message: 'Ocorrência detalhada não encontrada.' });
    }

    await registrarAcao(req, 'DELETAR_OCORRENCIA_DETALHADA', { ocorrencia: ocorrenciaAntes });

    // FEEDBACK LOOP: Liberar viaturas no SISGPO (assíncrono, não bloqueia resposta)
    if (ocorrenciaAntes?.viaturas) {
      const viaturasPrefixos = ocorrenciaAntes.viaturas.split(',').map((v: string) => v.trim());
      viaturasPrefixos.forEach((prefixo: string) => {
        if (prefixo) {
          sisgpoSyncService.marcarViaturaDisponivel(
            prefixo,
            String(id),
            req.headers.authorization?.replace('Bearer ', '')
          ).catch(() => { /* Erro já é tratado no service */ });
        }
      });
    }

    logger.info({ ocorrenciaId: id, usuarioId: req.usuario?.id }, 'Ocorrência detalhada marcada como excluída.');
    return res.status(204).send();
  } catch (error) {
    logger.error({ err: error, ocorrenciaId: id }, 'Erro ao deletar ocorrência detalhada.');
    return res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};