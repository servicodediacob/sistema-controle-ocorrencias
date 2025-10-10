"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deletarOcorrenciaDetalhada = exports.atualizarOcorrenciaDetalhada = exports.getOcorrenciasDetalhadasPorData = exports.criarOcorrenciaDetalhada = void 0;
const prisma_1 = require("../lib/prisma");
const logger_1 = __importDefault(require("@/config/logger"));
const criarOcorrenciaDetalhada = async (req, res) => {
    const payload = req.body;
    const usuario_id = req.usuario?.id;
    try {
        const novaOcorrencia = await prisma_1.prisma.$transaction(async (tx) => {
            const ocorrenciaCriada = await tx.ocorrenciaDetalhada.create({
                data: {
                    numero_ocorrencia: payload.numero_ocorrencia,
                    natureza_id: payload.natureza_id,
                    endereco: payload.endereco,
                    bairro: payload.bairro,
                    cidade_id: payload.cidade_id,
                    viaturas: payload.viaturas,
                    veiculos_envolvidos: payload.veiculos_envolvidos,
                    dados_vitimas: payload.dados_vitimas,
                    resumo_ocorrencia: payload.resumo_ocorrencia,
                    data_ocorrencia: new Date(payload.data_ocorrencia + 'T00:00:00Z'), // Salva sempre em UTC
                    horario_ocorrencia: payload.horario_ocorrencia ? `${payload.horario_ocorrencia}:00` : null,
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
        logger_1.default.info({ ocorrenciaId: novaOcorrencia.id, usuarioId: usuario_id }, 'Ocorrência detalhada criada e definida como destaque.');
        return res.status(201).json(novaOcorrencia);
    }
    catch (error) {
        logger_1.default.error({ err: error, payload }, 'Erro ao criar ocorrência detalhada.');
        return res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};
exports.criarOcorrenciaDetalhada = criarOcorrenciaDetalhada;
const getOcorrenciasDetalhadasPorData = async (req, res) => {
    const { data_ocorrencia } = req.query;
    if (!data_ocorrencia || typeof data_ocorrencia !== 'string') {
        return res.status(400).json({ message: 'O parâmetro "data_ocorrencia" é obrigatório.' });
    }
    try {
        // ======================= INÍCIO DA CORREÇÃO =======================
        const dataInicio = new Date(data_ocorrencia + 'T00:00:00.000Z');
        const dataFim = new Date(data_ocorrencia + 'T23:59:59.999Z');
        const ocorrencias = await prisma_1.prisma.ocorrenciaDetalhada.findMany({
            where: {
                data_ocorrencia: {
                    gte: dataInicio,
                    lte: dataFim,
                },
            },
            include: { natureza: true, cidade: true },
            orderBy: [{ horario_ocorrencia: 'asc' }, { id: 'asc' }],
        });
        // ======================= FIM DA CORREÇÃO =======================
        const resultadoFormatado = ocorrencias.map(od => ({
            ...od,
            natureza_grupo: od.natureza.grupo,
            natureza_nome: od.natureza.subgrupo,
            cidade_nome: od.cidade.nome,
        }));
        return res.status(200).json(resultadoFormatado);
    }
    catch (error) {
        logger_1.default.error({ err: error, data: data_ocorrencia }, 'Erro ao buscar ocorrências detalhadas.');
        return res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};
exports.getOcorrenciasDetalhadasPorData = getOcorrenciasDetalhadasPorData;
// ... (resto do arquivo sem alterações)
const atualizarOcorrenciaDetalhada = async (req, res) => {
    const { id } = req.params;
    const payload = req.body;
    try {
        const ocorrenciaAtualizada = await prisma_1.prisma.ocorrenciaDetalhada.update({
            where: { id: Number(id) },
            data: {
                numero_ocorrencia: payload.numero_ocorrencia,
                natureza_id: payload.natureza_id,
                endereco: payload.endereco,
                bairro: payload.bairro,
                cidade_id: payload.cidade_id,
                viaturas: payload.viaturas,
                veiculos_envolvidos: payload.veiculos_envolvidos,
                dados_vitimas: payload.dados_vitimas,
                resumo_ocorrencia: payload.resumo_ocorrencia,
                data_ocorrencia: new Date(payload.data_ocorrencia + 'T00:00:00Z'),
                horario_ocorrencia: payload.horario_ocorrencia ? `${payload.horario_ocorrencia}:00` : null,
                usuario_id: req.usuario?.id,
            },
        });
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
        await prisma_1.prisma.ocorrenciaDetalhada.delete({ where: { id: Number(id) } });
        logger_1.default.info({ ocorrenciaId: id, usuarioId: req.usuario?.id }, 'Ocorrência detalhada deletada.');
        return res.status(204).send();
    }
    catch (error) {
        logger_1.default.error({ err: error, ocorrenciaId: id }, 'Erro ao deletar ocorrência detalhada.');
        return res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};
exports.deletarOcorrenciaDetalhada = deletarOcorrenciaDetalhada;
