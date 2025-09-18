"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteOcorrencia = exports.updateOcorrencia = exports.getOcorrencias = exports.criarOcorrencia = exports.excluirNatureza = exports.atualizarNatureza = exports.criarNatureza = exports.getNaturezas = exports.excluirObm = exports.atualizarObm = exports.criarObm = exports.getObms = void 0;
const db_1 = __importDefault(require("../db"));
// ===============================================
// OBMs (Organizações Bombeiro Militar)
// ===============================================
const getObms = async (_req, res) => {
    try {
        const { rows } = await db_1.default.query('SELECT * FROM obms ORDER BY nome ASC');
        res.status(200).json(rows);
    }
    catch (error) {
        console.error('Erro ao buscar OBMs:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao buscar OBMs.' });
    }
};
exports.getObms = getObms;
const criarObm = async (req, res) => {
    const { nome, crbm_id } = req.body;
    if (!nome || !crbm_id) {
        res.status(400).json({ message: 'Nome e ID do CRBM são obrigatórios.' });
        return;
    }
    try {
        const query = 'INSERT INTO obms (nome, crbm_id) VALUES ($1, $2) RETURNING *';
        const { rows } = await db_1.default.query(query, [nome, crbm_id]);
        res.status(201).json(rows[0]);
    }
    catch (error) {
        console.error('Erro ao criar OBM:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao criar OBM.' });
    }
};
exports.criarObm = criarObm;
const atualizarObm = async (req, res) => {
    const { id } = req.params;
    const { nome, crbm_id } = req.body;
    if (!nome || !crbm_id) {
        res.status(400).json({ message: 'Nome e ID do CRBM são obrigatórios.' });
        return;
    }
    try {
        const query = 'UPDATE obms SET nome = $1, crbm_id = $2 WHERE id = $3 RETURNING *';
        const { rows } = await db_1.default.query(query, [nome, crbm_id, id]);
        if (rows.length === 0) {
            res.status(404).json({ message: 'OBM não encontrada.' });
            return;
        }
        res.status(200).json(rows[0]);
    }
    catch (error) {
        console.error('Erro ao atualizar OBM:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao atualizar OBM.' });
    }
};
exports.atualizarObm = atualizarObm;
const excluirObm = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db_1.default.query('DELETE FROM obms WHERE id = $1', [id]);
        if (result.rowCount === 0) {
            res.status(404).json({ message: 'OBM não encontrada.' });
            return;
        }
        res.status(200).json({ message: 'OBM excluída com sucesso.' });
    }
    catch (error) {
        console.error('Erro ao excluir OBM:', error);
        if (error.code === '23503') {
            res.status(400).json({ message: 'Não é possível excluir esta OBM, pois ela está associada a ocorrências existentes.' });
            return;
        }
        res.status(500).json({ message: 'Erro interno do servidor ao excluir OBM.' });
    }
};
exports.excluirObm = excluirObm;
// ===============================================
// NATUREZAS DE OCORRÊNCIA
// ===============================================
const getNaturezas = async (_req, res) => {
    try {
        const { rows } = await db_1.default.query('SELECT * FROM naturezas_ocorrencia ORDER BY descricao ASC');
        res.status(200).json(rows);
    }
    catch (error) {
        console.error('Erro ao buscar naturezas:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao buscar naturezas.' });
    }
};
exports.getNaturezas = getNaturezas;
const criarNatureza = async (req, res) => {
    const { descricao } = req.body;
    if (!descricao) {
        res.status(400).json({ message: 'A descrição é obrigatória.' });
        return;
    }
    try {
        const query = 'INSERT INTO naturezas_ocorrencia (descricao) VALUES ($1) RETURNING *';
        const { rows } = await db_1.default.query(query, [descricao]);
        res.status(201).json(rows[0]);
    }
    catch (error) {
        console.error('Erro ao criar natureza:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao criar natureza.' });
    }
};
exports.criarNatureza = criarNatureza;
const atualizarNatureza = async (req, res) => {
    const { id } = req.params;
    const { descricao } = req.body;
    if (!descricao) {
        res.status(400).json({ message: 'A descrição é obrigatória.' });
        return;
    }
    try {
        const query = 'UPDATE naturezas_ocorrencia SET descricao = $1 WHERE id = $2 RETURNING *';
        const { rows } = await db_1.default.query(query, [descricao, id]);
        if (rows.length === 0) {
            res.status(404).json({ message: 'Natureza não encontrada.' });
            return;
        }
        res.status(200).json(rows[0]);
    }
    catch (error) {
        console.error('Erro ao atualizar natureza:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao atualizar natureza.' });
    }
};
exports.atualizarNatureza = atualizarNatureza;
const excluirNatureza = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db_1.default.query('DELETE FROM naturezas_ocorrencia WHERE id = $1', [id]);
        if (result.rowCount === 0) {
            res.status(404).json({ message: 'Natureza não encontrada.' });
            return;
        }
        res.status(200).json({ message: 'Natureza excluída com sucesso.' });
    }
    catch (error) {
        console.error('Erro ao excluir natureza:', error);
        if (error.code === '23503') {
            res.status(400).json({ message: 'Não é possível excluir esta natureza, pois ela está associada a ocorrências existentes.' });
            return;
        }
        res.status(500).json({ message: 'Erro interno do servidor ao excluir natureza.' });
    }
};
exports.excluirNatureza = excluirNatureza;
// ===============================================
// OCORRÊNCIAS
// ===============================================
const criarOcorrencia = async (req, res) => {
    const { ocorrencia, obitos } = req.body;
    if (!ocorrencia || !ocorrencia.obm_id || !ocorrencia.natureza_id || !ocorrencia.data_ocorrencia) {
        res.status(400).json({ message: 'Dados da ocorrência incompletos. OBM, Natureza e Data são obrigatórios.' });
        return;
    }
    const client = await db_1.default.pool.connect();
    try {
        await client.query('BEGIN');
        const queryOcorrencia = `
      INSERT INTO ocorrencias (data_ocorrencia, natureza_id, obm_id, quantidade_obitos)
      VALUES ($1, $2, $3, $4)
      RETURNING id; 
    `;
        const ocorrenciaValues = [
            ocorrencia.data_ocorrencia,
            ocorrencia.natureza_id,
            ocorrencia.obm_id,
            obitos ? obitos.length : 0
        ];
        const resultOcorrencia = await client.query(queryOcorrencia, ocorrenciaValues);
        const novaOcorrenciaId = resultOcorrencia.rows[0].id;
        if (obitos && obitos.length > 0) {
            for (const obito of obitos) {
                const queryObito = `
          INSERT INTO obitos (ocorrencia_id, nome_vitima, idade_vitima, genero)
          VALUES ($1, $2, $3, $4);
        `;
                const obitoValues = [
                    novaOcorrenciaId,
                    obito.nome_vitima,
                    obito.idade_vitima,
                    obito.genero
                ];
                await client.query(queryObito, obitoValues);
            }
        }
        await client.query('COMMIT');
        res.status(201).json({
            message: 'Ocorrência e óbitos registrados com sucesso!',
            ocorrenciaId: novaOcorrenciaId
        });
    }
    catch (error) {
        await client.query('ROLLBACK');
        console.error('Erro ao registrar ocorrência (transação revertida):', error);
        res.status(500).json({ message: 'Erro interno do servidor ao registrar a ocorrência.' });
    }
    finally {
        client.release();
    }
};
exports.criarOcorrencia = criarOcorrencia;
const getOcorrencias = async (req, res) => {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;
    try {
        const ocorrenciasQuery = `
      SELECT 
        o.id, o.data_ocorrencia, o.quantidade_obitos, o.natureza_id, o.obm_id,
        n.descricao AS natureza_descricao, obm.nome AS obm_nome, cr.nome AS crbm_nome
      FROM ocorrencias o
      JOIN naturezas_ocorrencia n ON o.natureza_id = n.id
      JOIN obms obm ON o.obm_id = obm.id
      JOIN crbms cr ON obm.crbm_id = cr.id
      ORDER BY o.data_ocorrencia DESC, o.id DESC
      LIMIT $1 OFFSET $2;
    `;
        const { rows: ocorrencias } = await db_1.default.query(ocorrenciasQuery, [limit, offset]);
        const totalQuery = 'SELECT COUNT(*) FROM ocorrencias;';
        const { rows: totalRows } = await db_1.default.query(totalQuery);
        const total = parseInt(totalRows[0].count, 10);
        res.status(200).json({
            ocorrencias,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        });
    }
    catch (error) {
        console.error('Erro ao buscar ocorrências:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao buscar ocorrências.' });
    }
};
exports.getOcorrencias = getOcorrencias;
const updateOcorrencia = async (req, res) => {
    const { id } = req.params;
    const { data_ocorrencia, natureza_id, obm_id } = req.body;
    if (!data_ocorrencia || !natureza_id || !obm_id) {
        res.status(400).json({ message: 'Todos os campos são obrigatórios para atualização.' });
        return;
    }
    try {
        const query = `
      UPDATE ocorrencias SET data_ocorrencia = $1, natureza_id = $2, obm_id = $3
      WHERE id = $4 RETURNING *;
    `;
        const { rows } = await db_1.default.query(query, [data_ocorrencia, natureza_id, obm_id, id]);
        if (rows.length === 0) {
            res.status(404).json({ message: 'Ocorrência não encontrada.' });
            return;
        }
        res.status(200).json({ message: 'Ocorrência atualizada com sucesso!', ocorrencia: rows[0] });
    }
    catch (error) {
        console.error('Erro ao atualizar ocorrência:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao atualizar a ocorrência.' });
    }
};
exports.updateOcorrencia = updateOcorrencia;
const deleteOcorrencia = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db_1.default.query('DELETE FROM ocorrencias WHERE id = $1', [id]);
        if (result.rowCount === 0) {
            res.status(404).json({ message: 'Ocorrência não encontrada.' });
            return;
        }
        res.status(200).json({ message: 'Ocorrência excluída com sucesso.' });
    }
    catch (error) {
        console.error('Erro ao excluir ocorrência:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao excluir a ocorrência.' });
    }
};
exports.deleteOcorrencia = deleteOcorrencia;
