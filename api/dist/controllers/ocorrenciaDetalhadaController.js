"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deletarOcorrenciaDetalhada = exports.atualizarOcorrenciaDetalhada = exports.getOcorrenciasDetalhadasPorIntervalo = exports.criarOcorrenciaDetalhada = void 0;
const prisma_1 = require("../lib/prisma");
const logger_1 = __importDefault(require("../config/logger"));
const cleanupService_1 = require("../services/cleanupService");
const auditoriaService_1 = require("../services/auditoriaService");
const criarOcorrenciaDetalhada = async (req, res) => {
    await (0, cleanupService_1.excluirRegistrosAntigos)();
    const payload = req.body;
    const usuario_id = req.usuario?.id;
    try {
        // Coerção e validação de tipos vindos do frontend (podem chegar como string)
        const naturezaId = Number(payload.natureza_id ?? payload.natureza_id);
        const cidadeId = Number(payload.cidade_id ?? payload.cidade_id);
        if (!Number.isInteger(naturezaId) || naturezaId <= 0) {
            return res.status(400).json({ message: 'natureza_id inválido. Deve ser um inteiro.' });
        }
        if (!Number.isInteger(cidadeId) || cidadeId <= 0) {
            return res.status(400).json({ message: 'cidade_id inválido. Deve ser um inteiro.' });
        }
        const novaOcorrencia = await prisma_1.prisma.$transaction(async (tx) => {
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
        await (0, auditoriaService_1.registrarAcao)(req, 'CRIAR_OCORRENCIA_DETALHADA', { ocorrencia: novaOcorrencia });
        logger_1.default.info({ ocorrenciaId: novaOcorrencia.id, usuarioId: usuario_id }, 'Ocorrência detalhada criada e definida como destaque.');
        return res.status(201).json(novaOcorrencia);
    }
    catch (error) {
        logger_1.default.error({ err: error, payload }, 'Erro ao criar ocorrência detalhada.');
        return res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};
exports.criarOcorrenciaDetalhada = criarOcorrenciaDetalhada;
const getOcorrenciasDetalhadasPorIntervalo = async (req, res) => {
    const { dataInicio, dataFim } = req.query;
    if (!dataInicio || typeof dataInicio !== 'string' || !dataFim || typeof dataFim !== 'string') {
        return res.status(400).json({ message: 'Os parâmetros "dataInicio" e "dataFim" são obrigatórios.' });
    }
    try {
        const inicio = new Date(dataInicio);
        const fim = new Date(dataFim);
        const ocorrencias = await prisma_1.prisma.ocorrenciaDetalhada.findMany({
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
                ? new Date(od.horario_ocorrencia).toISOString().substring(11, 16)
                : null,
        }));
        return res.status(200).json(resultadoFormatado);
    }
    catch (error) {
        logger_1.default.error({ err: error, dataInicio, dataFim }, 'Erro ao buscar ocorrências detalhadas.');
        return res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};
exports.getOcorrenciasDetalhadasPorIntervalo = getOcorrenciasDetalhadasPorIntervalo;
// ... (resto do arquivo sem alterações)
const atualizarOcorrenciaDetalhada = async (req, res) => {
    const { id } = req.params;
    const payload = req.body;
    try {
        const naturezaId = Number(payload.natureza_id ?? payload.natureza_id);
        const cidadeId = Number(payload.cidade_id ?? payload.cidade_id);
        if (!Number.isInteger(naturezaId) || naturezaId <= 0) {
            return res.status(400).json({ message: 'natureza_id inválido. Deve ser um inteiro.' });
        }
        if (!Number.isInteger(cidadeId) || cidadeId <= 0) {
            return res.status(400).json({ message: 'cidade_id inválido. Deve ser um inteiro.' });
        }
        const ocorrenciaAntes = await prisma_1.prisma.ocorrenciaDetalhada.findUnique({ where: { id: Number(id) } });
        const ocorrenciaAtualizada = await prisma_1.prisma.ocorrenciaDetalhada.update({
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
        await (0, auditoriaService_1.registrarAcao)(req, 'ATUALIZAR_OCORRENCIA_DETALHADA', { antes: ocorrenciaAntes, depois: ocorrenciaAtualizada });
        logger_1.default.info({ ocorrenciaId: id, usuarioId: req.usuario?.id }, 'Ocorrência detalhada atualizada.');
        return res.status(200).json(ocorrenciaAtualizada);
    }
    catch (error) {
        logger_1.default.error({ err: error, payload, ocorrenciaId: id }, 'Erro ao atualizar ocorrência detalhada.');
        return res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};
exports.atualizarOcorrenciaDetalhada = atualizarOcorrenciaDetalhada;
const deletarOcorrenciaDetalhada = async (req, res) => {
    const { id } = req.params;
    try {
        const ocorrenciaAntes = await prisma_1.prisma.ocorrenciaDetalhada.findUnique({ where: { id: Number(id) } });
        const resultado = await prisma_1.prisma.ocorrenciaDetalhada.updateMany({
            where: { id: Number(id), deletado_em: null },
            data: { deletado_em: new Date(), usuario_id: req.usuario?.id },
        });
        if (resultado.count === 0) {
            return res.status(404).json({ message: 'Ocorrência detalhada não encontrada.' });
        }
        await (0, auditoriaService_1.registrarAcao)(req, 'DELETAR_OCORRENCIA_DETALHADA', { ocorrencia: ocorrenciaAntes });
        logger_1.default.info({ ocorrenciaId: id, usuarioId: req.usuario?.id }, 'Ocorrência detalhada marcada como excluída.');
        return res.status(204).send();
    }
    catch (error) {
        logger_1.default.error({ err: error, ocorrenciaId: id }, 'Erro ao deletar ocorrência detalhada.');
        return res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};
exports.deletarOcorrenciaDetalhada = deletarOcorrenciaDetalhada;
