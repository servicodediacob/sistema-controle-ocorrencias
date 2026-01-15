"use strict";
// api/src/controllers/unidadesController.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCrbms = exports.excluirUnidade = exports.atualizarUnidade = exports.criarUnidade = exports.getUnidades = void 0;
const prisma_1 = require("../lib/prisma"); // Importa a instância singleton do Prisma Client
const logger_1 = __importDefault(require("../config/logger"));
// Type guard simples para erros conhecidos do Prisma (baseado no campo 'code')
const isPrismaKnownError = (e) => !!e && typeof e.code === 'string';
/**
 * @description Busca todas as unidades (OBMs) e as informações do CRBM associado.
 */
const getUnidades = async (_req, res) => {
    try {
        const unidades = await prisma_1.prisma.oBM.findMany({
            // O 'include' funciona como um JOIN, trazendo os dados do CRBM relacionado.
            include: {
                crbm: true, // Inclui o objeto CRBM completo
            },
            orderBy: [
                { crbm: { nome: 'asc' } }, // Ordena primeiro pelo nome do CRBM
                { nome: 'asc' }, // Depois pelo nome da OBM
            ],
        });
        // Formata a resposta para corresponder à estrutura anterior, se necessário.
        const resultadoFormatado = unidades.map(obm => ({
            id: obm.id,
            cidade_nome: obm.nome,
            crbm_nome: obm.crbm.nome,
            crbm_id: obm.crbm.id,
        }));
        res.status(200).json(resultadoFormatado);
    }
    catch (error) {
        logger_1.default.error({ err: error }, 'Erro ao buscar unidades (OBMs).');
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};
exports.getUnidades = getUnidades;
/**
 * @description Cria uma nova unidade (OBM).
 */
const criarUnidade = async (req, res) => {
    const { nome, crbm_id } = req.body;
    if (!nome || !crbm_id) {
        res.status(400).json({ message: 'Nome da OBM e ID do CRBM são obrigatórios.' });
        return;
    }
    try {
        const existingObm = await prisma_1.prisma.$queryRaw `
      SELECT id, nome, crbm_id FROM "obms" WHERE nome = ${nome}
    `;
        if (existingObm.length > 0) {
            const obm = existingObm[0];
            const crbm = await prisma_1.prisma.cRBM.findUnique({ where: { id: obm.crbm_id } });
            res.status(409).json({
                message: `A OBM "${nome}" já existe e está associada ao CRBM "${crbm?.nome || 'desconhecido'}".`,
            });
            return;
        }
        const novaUnidade = await prisma_1.prisma.oBM.create({
            data: {
                nome: nome,
                crbm_id: crbm_id,
            },
        });
        logger_1.default.info({ unidade: novaUnidade }, 'Nova unidade (OBM) criada.');
        res.status(201).json(novaUnidade);
    }
    catch (error) {
        logger_1.default.error({ err: error, body: req.body }, 'Erro ao criar unidade (OBM).');
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};
exports.criarUnidade = criarUnidade;
/**
 * @description Atualiza uma unidade (OBM) existente.
 */
const atualizarUnidade = async (req, res) => {
    const { id } = req.params;
    const { nome, crbm_id } = req.body;
    if (!nome || !crbm_id) {
        res.status(400).json({ message: 'Nome da OBM e ID do CRBM são obrigatórios.' });
        return;
    }
    try {
        const unidadeAtualizada = await prisma_1.prisma.oBM.update({
            where: { id: Number(id) }, // Prisma espera que o ID seja do tipo correto (neste caso, número)
            data: {
                nome: nome,
                crbm_id: crbm_id,
            },
        });
        logger_1.default.info({ unidade: unidadeAtualizada }, 'Unidade (OBM) atualizada.');
        res.status(200).json(unidadeAtualizada);
    }
    catch (error) {
        // P2025 é o código para "registro não encontrado" em uma operação de update ou delete.
        if (isPrismaKnownError(error) && error.code === 'P2025') {
            res.status(404).json({ message: 'OBM não encontrada.' });
            return;
        }
        logger_1.default.error({ err: error, params: req.params, body: req.body }, 'Erro ao atualizar unidade (OBM).');
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};
exports.atualizarUnidade = atualizarUnidade;
/**
 * @description Exclui uma unidade (OBM).
 */
const excluirUnidade = async (req, res) => {
    const { id } = req.params;
    try {
        await prisma_1.prisma.oBM.delete({
            where: { id: Number(id) },
        });
        logger_1.default.info({ unidadeId: id }, 'Unidade (OBM) excluída.');
        res.status(204).send();
    }
    catch (error) {
        // P2003 é o código para violação de constraint de chave estrangeira (foreign key).
        if (isPrismaKnownError(error) && error.code === 'P2003') {
            res.status(400).json({ message: 'Não é possível excluir esta OBM, pois ela está associada a outros registros.' });
            return;
        }
        // P2025 indica que o registro a ser excluído não foi encontrado.
        if (isPrismaKnownError(error) && error.code === 'P2025') {
            res.status(404).json({ message: 'OBM não encontrada.' });
            return;
        }
        logger_1.default.error({ err: error, unidadeId: id }, 'Erro ao excluir unidade (OBM).');
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};
exports.excluirUnidade = excluirUnidade;
/**
 * @description Busca todos os CRBMs.
 */
const getCrbms = async (_req, res) => {
    try {
        const crbms = await prisma_1.prisma.cRBM.findMany({
            orderBy: {
                nome: 'asc',
            },
        });
        res.status(200).json(crbms);
    }
    catch (error) {
        logger_1.default.error({ err: error }, 'Erro ao buscar CRBMs.');
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};
exports.getCrbms = getCrbms;
