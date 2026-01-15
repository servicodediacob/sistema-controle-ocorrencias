"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.excluirNatureza = exports.atualizarNatureza = exports.criarNatureza = exports.getNaturezasPorNomes = exports.getNaturezas = void 0;
const prisma_1 = require("../lib/prisma");
const logger_1 = __importDefault(require("../config/logger"));
// Type guard simples para erros conhecidos do Prisma (baseado no campo 'code')
const isPrismaKnownError = (e) => !!e && typeof e.code === 'string';
// Lista naturezas (exclui apenas o grupo "Relatório de Óbitos")
const getNaturezas = async (_req, res) => {
    try {
        const naturezas = await prisma_1.prisma.naturezaOcorrencia.findMany({
            where: { grupo: { not: 'Relatório de Óbitos' } },
            orderBy: [{ grupo: 'asc' }, { subgrupo: 'asc' }],
        });
        return res.status(200).json(naturezas);
    }
    catch (error) {
        logger_1.default.error({ err: error }, 'Erro ao buscar naturezas.');
        return res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};
exports.getNaturezas = getNaturezas;
// Busca naturezas por nomes de subgrupo
const getNaturezasPorNomes = async (req, res) => {
    const { nomes } = req.body;
    if (!Array.isArray(nomes) || nomes.length === 0) {
        return res
            .status(400)
            .json({ message: 'Um array de nomes de subgrupo é obrigatório.' });
    }
    try {
        const naturezas = await prisma_1.prisma.naturezaOcorrencia.findMany({
            where: { subgrupo: { in: nomes } },
            select: { id: true, subgrupo: true },
            orderBy: { subgrupo: 'asc' },
        });
        return res.status(200).json(naturezas);
    }
    catch (error) {
        logger_1.default.error({ err: error, nomes }, 'Erro ao buscar naturezas por nomes.');
        return res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};
exports.getNaturezasPorNomes = getNaturezasPorNomes;
const criarNatureza = async (req, res) => {
    const { grupo, subgrupo, abreviacao } = req.body;
    if (!grupo || !subgrupo) {
        return res
            .status(400)
            .json({ message: 'Os campos Grupo e Subgrupo são obrigatórios.' });
    }
    try {
        const novaNatureza = await prisma_1.prisma.naturezaOcorrencia.create({
            data: {
                grupo,
                subgrupo,
                abreviacao: abreviacao || null,
            },
        });
        logger_1.default.info({ natureza: novaNatureza }, 'Nova natureza de ocorrência criada.');
        return res.status(201).json(novaNatureza);
    }
    catch (error) {
        if (isPrismaKnownError(error) && error.code === 'P2002') {
            return res.status(409).json({
                message: `A combinação de Grupo "${grupo}" e Subgrupo "${subgrupo}" já existe.`,
            });
        }
        logger_1.default.error({ err: error, body: req.body }, 'Erro ao criar natureza.');
        return res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};
exports.criarNatureza = criarNatureza;
const atualizarNatureza = async (req, res) => {
    const { id } = req.params;
    const { grupo, subgrupo, abreviacao } = req.body;
    if (!grupo || !subgrupo) {
        return res
            .status(400)
            .json({ message: 'Os campos Grupo e Subgrupo são obrigatórios.' });
    }
    try {
        const naturezaAtualizada = await prisma_1.prisma.naturezaOcorrencia.update({
            where: { id: Number(id) },
            data: {
                grupo,
                subgrupo,
                abreviacao: abreviacao || null,
            },
        });
        logger_1.default.info({ natureza: naturezaAtualizada }, 'Natureza de ocorrência atualizada.');
        return res.status(200).json(naturezaAtualizada);
    }
    catch (error) {
        if (isPrismaKnownError(error)) {
            if (error.code === 'P2002') {
                return res.status(409).json({
                    message: `A combinação de Grupo "${grupo}" e Subgrupo "${subgrupo}" já existe.`,
                });
            }
            if (error.code === 'P2025') {
                return res.status(404).json({ message: 'Natureza não encontrada.' });
            }
        }
        logger_1.default.error({ err: error, params: req.params, body: req.body }, 'Erro ao atualizar natureza.');
        return res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};
exports.atualizarNatureza = atualizarNatureza;
const excluirNatureza = async (req, res) => {
    const { id } = req.params;
    try {
        await prisma_1.prisma.naturezaOcorrencia.delete({
            where: { id: Number(id) },
        });
        logger_1.default.info({ naturezaId: id }, 'Natureza de ocorrência excluída.');
        return res.status(204).send();
    }
    catch (error) {
        if (isPrismaKnownError(error)) {
            if (error.code === 'P2003') {
                return res.status(400).json({
                    message: 'Não é possível excluir esta natureza, pois ela está associada a registros existentes.',
                });
            }
            if (error.code === 'P2025') {
                return res.status(404).json({ message: 'Natureza não encontrada.' });
            }
        }
        logger_1.default.error({ err: error, naturezaId: id }, 'Erro ao excluir natureza.');
        return res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};
exports.excluirNatureza = excluirNatureza;
