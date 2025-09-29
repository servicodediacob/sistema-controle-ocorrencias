"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.limparRegistrosPorData = exports.deletarObitoRegistro = exports.atualizarObitoRegistro = exports.criarObitoRegistro = exports.getObitosPorData = void 0;
const db_1 = __importDefault(require("../db"));
const logger_1 = __importDefault(require("../config/logger"));
const getObitosPorData = async (req, res) => {
    const { data } = req.query;
    if (!data || typeof data !== 'string') {
        return res.status(400).json({ message: 'A data é obrigatória.' });
    }
    try {
        const query = `
      SELECT 
        obr.id, obr.data_ocorrencia, obr.natureza_id, n.subgrupo as natureza_nome,
        obr.numero_ocorrencia, o.nome as obm_nome, obr.obm_id, obr.quantidade_vitimas
      FROM obitos_registros obr
      JOIN naturezas_ocorrencia n ON obr.natureza_id = n.id
      LEFT JOIN obms o ON obr.obm_id = o.id
      WHERE obr.data_ocorrencia = $1
      ORDER BY n.subgrupo, obr.id;
    `;
        const { rows } = await db_1.default.query(query, [data]);
        return res.status(200).json(rows);
    }
    catch (error) {
        logger_1.default.error({ err: error, data }, 'Erro ao buscar registros de óbito.');
        return res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};
exports.getObitosPorData = getObitosPorData;
const criarObitoRegistro = async (req, res) => {
    const payload = req.body;
    const usuario_id = req.usuario?.id;
    try {
        const query = `
      INSERT INTO obitos_registros (data_ocorrencia, natureza_id, numero_ocorrencia, obm_id, quantidade_vitimas, usuario_id)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;
    `;
        const values = [
            payload.data_ocorrencia, payload.natureza_id, payload.numero_ocorrencia,
            payload.obm_id, payload.quantidade_vitimas, usuario_id
        ];
        const { rows } = await db_1.default.query(query, values);
        logger_1.default.info({ registro: rows[0], usuarioId: usuario_id }, 'Novo registro de óbito criado.');
        return res.status(201).json(rows[0]);
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
        const query = `
            UPDATE obitos_registros SET
                data_ocorrencia = $1, natureza_id = $2, numero_ocorrencia = $3,
                obm_id = $4, quantidade_vitimas = $5, usuario_id = $6
            WHERE id = $7 RETURNING *;
        `;
        const values = [
            payload.data_ocorrencia, payload.natureza_id, payload.numero_ocorrencia,
            payload.obm_id, payload.quantidade_vitimas, req.usuario?.id, id
        ];
        const { rows } = await db_1.default.query(query, values);
        if (rows.length === 0)
            return res.status(404).json({ message: 'Registro de óbito não encontrado.' });
        logger_1.default.info({ registroId: id, usuarioId: req.usuario?.id }, 'Registro de óbito atualizado.');
        return res.status(200).json(rows[0]);
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
        const result = await db_1.default.query('DELETE FROM obitos_registros WHERE id = $1', [id]);
        if (result.rowCount === 0)
            return res.status(404).json({ message: 'Registro de óbito não encontrado.' });
        logger_1.default.info({ registroId: id, usuarioId: req.usuario?.id }, 'Registro de óbito deletado.');
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
        const result = await db_1.default.query('DELETE FROM obitos_registros WHERE data_ocorrencia = $1', [data]);
        logger_1.default.info({ data, count: result.rowCount, usuarioId: req.usuario?.id }, 'Registros de óbitos limpos por data.');
        return res.status(200).json({ message: `Operação concluída. ${result.rowCount} registros de óbito foram excluídos para a data ${data}.` });
    }
    catch (error) {
        logger_1.default.error({ err: error, data }, 'Erro ao limpar registros de óbito por data.');
        return res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};
exports.limparRegistrosPorData = limparRegistrosPorData;
