"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCrbms = exports.excluirUnidade = exports.atualizarUnidade = exports.criarUnidade = exports.getUnidades = void 0;
const db_1 = __importDefault(require("../db"));
const logger_1 = __importDefault(require("../config/logger"));
const getUnidades = async (_req, res) => {
    try {
        const query = `
      SELECT 
        obm.id, 
        obm.nome AS cidade_nome, 
        cr.nome AS crbm_nome,
        cr.id AS crbm_id
      FROM obms obm
      JOIN crbms cr ON obm.crbm_id = cr.id
      ORDER BY cr.nome, obm.nome;
    `;
        const { rows } = await db_1.default.query(query);
        res.status(200).json(rows);
    }
    catch (error) {
        logger_1.default.error({ err: error }, 'Erro ao buscar unidades (OBMs).');
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};
exports.getUnidades = getUnidades;
const criarUnidade = async (req, res) => {
    const { nome, crbm_id } = req.body;
    if (!nome || !crbm_id) {
        res.status(400).json({ message: 'Nome da OBM e ID do CRBM são obrigatórios.' });
        return;
    }
    try {
        const query = 'INSERT INTO obms (nome, crbm_id) VALUES ($1, $2) RETURNING *';
        const { rows } = await db_1.default.query(query, [nome, crbm_id]);
        logger_1.default.info({ unidade: rows[0] }, 'Nova unidade (OBM) criada.');
        res.status(201).json(rows[0]);
    }
    catch (error) {
        if (error.code === '23505') {
            res.status(409).json({ message: `A OBM "${nome}" já existe.` });
            return;
        }
        logger_1.default.error({ err: error, body: req.body }, 'Erro ao criar unidade (OBM).');
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};
exports.criarUnidade = criarUnidade;
const atualizarUnidade = async (req, res) => {
    const { id } = req.params;
    const { nome, crbm_id } = req.body;
    if (!nome || !crbm_id) {
        res.status(400).json({ message: 'Nome da OBM e ID do CRBM são obrigatórios.' });
        return;
    }
    try {
        const query = 'UPDATE obms SET nome = $1, crbm_id = $2 WHERE id = $3 RETURNING *';
        const { rows } = await db_1.default.query(query, [nome, crbm_id, id]);
        if (rows.length === 0) {
            res.status(404).json({ message: 'OBM não encontrada.' });
            return;
        }
        logger_1.default.info({ unidade: rows[0] }, 'Unidade (OBM) atualizada.');
        res.status(200).json(rows[0]);
    }
    catch (error) {
        logger_1.default.error({ err: error, params: req.params, body: req.body }, 'Erro ao atualizar unidade (OBM).');
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};
exports.atualizarUnidade = atualizarUnidade;
const excluirUnidade = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db_1.default.query('DELETE FROM obms WHERE id = $1', [id]);
        if (result.rowCount === 0) {
            res.status(404).json({ message: 'OBM não encontrada.' });
            return;
        }
        logger_1.default.info({ unidadeId: id }, 'Unidade (OBM) excluída.');
        res.status(204).send();
    }
    catch (error) {
        if (error.code === '23503') {
            res.status(400).json({ message: 'Não é possível excluir esta OBM, pois ela está associada a outros registros.' });
            return;
        }
        logger_1.default.error({ err: error, unidadeId: id }, 'Erro ao excluir unidade (OBM).');
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};
exports.excluirUnidade = excluirUnidade;
const getCrbms = async (_req, res) => {
    try {
        const { rows } = await db_1.default.query('SELECT * FROM crbms ORDER BY nome ASC');
        res.status(200).json(rows);
    }
    catch (error) {
        logger_1.default.error({ err: error }, 'Erro ao buscar CRBMs.');
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};
exports.getCrbms = getCrbms;
