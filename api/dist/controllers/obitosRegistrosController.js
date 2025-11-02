"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.limparRegistrosPorData = exports.deletarObitoRegistro = exports.atualizarObitoRegistro = exports.criarObitoRegistro = exports.getObitosPorData = void 0;
const prisma_1 = require("../lib/prisma");
const logger_1 = __importDefault(require("../config/logger"));
const cleanupService_1 = require("../services/cleanupService");
const auditoriaService_1 = require("../services/auditoriaService");
const getObitosPorData = async (req, res) => {
    const { data } = req.query;
    if (!data || typeof data !== 'string') {
        return res.status(400).json({ message: 'A data é obrigatória.' });
    }
    try {
        const dataInicio = new Date(data + 'T00:00:00.000Z');
        const dataFim = new Date(data + 'T23:59:59.999Z');
        const registros = await prisma_1.prisma.obitoRegistro.findMany({
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
    }
    catch (error) {
        logger_1.default.error({ err: error, data }, 'Erro ao buscar registros de óbito.');
        return res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};
exports.getObitosPorData = getObitosPorData;
const criarObitoRegistro = async (req, res) => {
    await (0, cleanupService_1.excluirRegistrosAntigos)();
    const payload = req.body;
    const usuario_id = req.usuario?.id;
    try {
        const novoRegistro = await prisma_1.prisma.obitoRegistro.create({
            data: {
                data_ocorrencia: new Date(payload.data_ocorrencia),
                natureza_id: payload.natureza_id,
                numero_ocorrencia: payload.numero_ocorrencia,
                obm_id: payload.obm_id,
                quantidade_vitimas: payload.quantidade_vitimas,
                usuario_id: usuario_id,
            },
        });
        await (0, auditoriaService_1.registrarAcao)(req, 'CRIAR_OBITO_REGISTRO', { registro: novoRegistro });
        logger_1.default.info({ registro: novoRegistro, usuarioId: usuario_id }, 'Novo registro de óbito criado.');
        return res.status(201).json(novoRegistro);
    }
    catch (error) {
        logger_1.default.error({ err: error, body: req.body }, 'Erro ao criar registro de óbito.');
        return res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};
exports.criarObitoRegistro = criarObitoRegistro;
const atualizarObitoRegistro = async (req, res) => {
    const { id } = req.params;
    const payload = req.body;
    try {
        const registroAntes = await prisma_1.prisma.obitoRegistro.findUnique({ where: { id: Number(id) } });
        const registroAtualizado = await prisma_1.prisma.obitoRegistro.update({
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
        await (0, auditoriaService_1.registrarAcao)(req, 'ATUALIZAR_OBITO_REGISTRO', { antes: registroAntes, depois: registroAtualizado });
        logger_1.default.info({ registroId: id, usuarioId: req.usuario?.id }, 'Registro de óbito atualizado.');
        return res.status(200).json(registroAtualizado);
    }
    catch (error) {
        logger_1.default.error({ err: error, params: req.params, body: req.body }, 'Erro ao atualizar registro de óbito.');
        return res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};
exports.atualizarObitoRegistro = atualizarObitoRegistro;
const deletarObitoRegistro = async (req, res) => {
    const { id } = req.params;
    try {
        const registroAntes = await prisma_1.prisma.obitoRegistro.findUnique({ where: { id: Number(id) } });
        const resultado = await prisma_1.prisma.obitoRegistro.updateMany({
            where: { id: Number(id), deletado_em: null },
            data: { deletado_em: new Date(), usuario_id: req.usuario?.id },
        });
        if (resultado.count === 0) {
            return res.status(404).json({ message: 'Registro de óbito não encontrado.' });
        }
        await (0, auditoriaService_1.registrarAcao)(req, 'DELETAR_OBITO_REGISTRO', { registro: registroAntes });
        logger_1.default.info({ registroId: id, usuarioId: req.usuario?.id }, 'Registro de óbito marcado como excluído.');
        return res.status(204).send();
    }
    catch (error) {
        logger_1.default.error({ err: error, params: req.params }, 'Erro ao deletar registro de óbito.');
        return res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};
exports.deletarObitoRegistro = deletarObitoRegistro;
const limparRegistrosPorData = async (req, res) => {
    const { data } = req.query;
    if (!data || typeof data !== 'string') {
        return res.status(400).json({ message: 'O parâmetro "data" é obrigatório.' });
    }
    try {
        const dataInicio = new Date(data + 'T00:00:00.000Z');
        const dataFim = new Date(data + 'T23:59:59.999Z');
        const result = await prisma_1.prisma.obitoRegistro.updateMany({
            where: {
                data_ocorrencia: { gte: dataInicio, lte: dataFim },
                deletado_em: null
            },
            data: { deletado_em: new Date() }
        });
        await (0, auditoriaService_1.registrarAcao)(req, 'LIMPAR_REGISTROS_OBITO_POR_DATA', { data, count: result.count });
        logger_1.default.info({ data, count: result.count, usuarioId: req.usuario?.id }, 'Registros de óbitos (soft) limpos por data.');
        return res.status(200).json({ message: `Operação concluída. ${result.count} registros de óbito foram marcados como excluídos para a data ${data}.` });
    }
    catch (error) {
        logger_1.default.error({ err: error, data }, 'Erro ao limpar registros de óbito por data.');
        return res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};
exports.limparRegistrosPorData = limparRegistrosPorData;
