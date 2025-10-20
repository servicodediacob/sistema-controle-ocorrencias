"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.limparRegistrosPorData = exports.deletarObitoRegistro = exports.atualizarObitoRegistro = exports.criarObitoRegistro = exports.getObitosPorData = void 0;
// --- FIM DA CORREÇÃO ---
const db_1 = __importDefault(require("../db"));
const logger_1 = __importDefault(require("../config/logger"));
// Função para buscar registros de óbitos por data
const getObitosPorData = async (req, res) => {
    const { data } = req.query;
    if (!data || typeof data !== 'string') {
        res.status(400).json({ message: 'O parâmetro "data" é obrigatório.' });
        return;
    }
    try {
        const query = `
      SELECT 
        obr.id,
        obr.data_ocorrencia,
        obr.natureza_id,
        n.subgrupo as natureza_nome,
        obr.numero_ocorrencia,
        obr.obm_id,
        o.nome as obm_nome,
        obr.quantidade_vitimas
      FROM obitos_registros obr
      JOIN naturezas_ocorrencia n ON obr.natureza_id = n.id
      LEFT JOIN obms o ON obr.obm_id = o.id
      WHERE obr.data_ocorrencia = $1
        AND obr.deletado_em IS NULL
      ORDER BY n.subgrupo, obr.id;
    `;
        const { rows } = await db_1.default.query(query, [data]);
        res.status(200).json(rows);
    }
    catch (error) {
        logger_1.default.error({ err: error, query: req.query }, 'Erro ao buscar registros de óbitos por data.');
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};
exports.getObitosPorData = getObitosPorData;
// Função para criar um novo registro de óbito
const criarObitoRegistro = async (req, res) => {
    // --- INÍCIO DA CORREÇÃO ---
    // 2. Usamos a interface correta para que 'req.usuario' seja reconhecido
    const usuario_id = req.usuario?.id;
    // --- FIM DA CORREÇÃO ---
    const payload = req.body;
    try {
        const query = `
      INSERT INTO obitos_registros 
        (data_ocorrencia, natureza_id, numero_ocorrencia, obm_id, quantidade_vitimas, usuario_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
        const values = [
            payload.data_ocorrencia,
            payload.natureza_id,
            payload.numero_ocorrencia,
            payload.obm_id,
            payload.quantidade_vitimas,
            usuario_id
        ];
        const { rows } = await db_1.default.query(query, values);
        res.status(201).json(rows[0]);
    }
    catch (error) {
        logger_1.default.error({ err: error, body: req.body }, 'Erro ao criar registro de óbito.');
        res.status(500).json({ message: 'Erro interno do servidor ao criar registro.' });
    }
};
exports.criarObitoRegistro = criarObitoRegistro;
// Função para atualizar um registro de óbito
const atualizarObitoRegistro = async (req, res) => {
    const { id } = req.params;
    const payload = req.body;
    try {
        const query = `
      UPDATE obitos_registros SET
        data_ocorrencia = $1,
        natureza_id = $2,
        numero_ocorrencia = $3,
        obm_id = $4,
        quantidade_vitimas = $5
      WHERE id = $6
      RETURNING *;
    `;
        const values = [
            payload.data_ocorrencia,
            payload.natureza_id,
            payload.numero_ocorrencia,
            payload.obm_id,
            payload.quantidade_vitimas,
            id
        ];
        const { rows } = await db_1.default.query(query, values);
        if (rows.length === 0) {
            res.status(404).json({ message: 'Registro de óbito não encontrado.' });
            return;
        }
        res.status(200).json(rows[0]);
    }
    catch (error) {
        logger_1.default.error({ err: error, params: req.params, body: req.body }, 'Erro ao atualizar registro de óbito.');
        res.status(500).json({ message: 'Erro interno do servidor ao atualizar registro.' });
    }
};
exports.atualizarObitoRegistro = atualizarObitoRegistro;
// Função para deletar um registro de óbito
const deletarObitoRegistro = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db_1.default.query('DELETE FROM obitos_registros WHERE id = $1', [id]);
        if (result.rowCount === 0) {
            res.status(404).json({ message: 'Registro de óbito não encontrado.' });
            return;
        }
        res.status(200).json({ message: 'Registro excluído com sucesso.' });
    }
    catch (error) {
        logger_1.default.error({ err: error, params: req.params }, 'Erro ao deletar registro de óbito.');
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};
exports.deletarObitoRegistro = deletarObitoRegistro;
// Função para limpar todos os registros de uma data específica
const limparRegistrosPorData = async (req, res) => {
    const { data } = req.query;
    if (!data || typeof data !== 'string') {
        res.status(400).json({ message: 'O parâmetro "data" é obrigatório.' });
        return;
    }
    try {
        const result = await db_1.default.query('DELETE FROM obitos_registros WHERE data_ocorrencia = $1', [data]);
        res.status(200).json({ message: `${result.rowCount} registros de óbito foram excluídos para a data ${data}.` });
    }
    catch (error) {
        logger_1.default.error({ err: error, query: req.query }, 'Erro ao limpar registros de óbitos por data.');
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};
exports.limparRegistrosPorData = limparRegistrosPorData;
