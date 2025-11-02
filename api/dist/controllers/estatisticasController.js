"use strict";
// api/src/controllers/estatisticasController.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEspelhoBase = exports.getSisgpoDashboard = exports.limparDadosPorIntervalo = exports.getEstatisticasAgrupadasPorIntervalo = exports.registrarEstatisticasLote = void 0;
const prisma_1 = require("../lib/prisma"); // Corrigido para caminho relativo
const logger_1 = __importDefault(require("../config/logger")); // Corrigido para caminho relativo
const date_1 = require("../utils/date"); // Corrigido para caminho relativo
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const axios_1 = __importDefault(require("axios"));
const cleanupService_1 = require("../services/cleanupService");
const auditoriaService_1 = require("../services/auditoriaService");
// Segredos para a integração (use variáveis de ambiente em produção)
const SHARED_SECRET = process.env.SSO_SHARED_SECRET || 'seu-segredo-compartilhado';
const SISGPO_API_URL = process.env.SISGPO_API_URL || 'http://localhost:3333';
// --- SUAS FUNÇÕES EXISTENTES (Sem alterações na lógica interna) ---
const registrarEstatisticasLote = async (req, res) => {
    await (0, cleanupService_1.excluirRegistrosAntigos)();
    const { data_registro, obm_id, estatisticas } = req.body;
    const usuario = req.usuario;
    if (!usuario) {
        return res.status(401).json({ message: 'Usuário não autenticado.' });
    }
    if (usuario.role !== 'admin') {
        if (!usuario.obm_id) {
            logger_1.default.warn({ usuarioId: usuario.id }, 'Usuário sem OBM tentou registrar estatísticas.');
            return res.status(403).json({ message: 'Acesso negado. Seu usuário não possui uma OBM vinculada.' });
        }
        if (usuario.obm_id !== obm_id) {
            logger_1.default.warn({ usuarioId: usuario.id, obmSolicitada: obm_id, obmUsuario: usuario.obm_id }, 'Usuário tentou registrar estatísticas para outra OBM.');
            return res.status(403).json({ message: 'Acesso negado. Você só pode registrar dados para a sua própria OBM.' });
        }
    }
    if (!data_registro || !obm_id || !Array.isArray(estatisticas)) {
        return res.status(400).json({ message: 'Dados incompletos. data_registro, obm_id e estatisticas são obrigatórios.' });
    }
    try {
        const dataParsed = (0, date_1.parseDateParam)(data_registro, 'data_registro');
        const agora = new Date();
        const estatisticasNormalizadas = new Map();
        estatisticas.forEach((item) => {
            const naturezaId = Number(item.natureza_id);
            const quantidade = Number(item.quantidade ?? 0);
            if (Number.isInteger(naturezaId) && naturezaId > 0) {
                estatisticasNormalizadas.set(naturezaId, quantidade < 0 ? 0 : quantidade);
            }
        });
        if (estatisticasNormalizadas.size === 0) {
            logger_1.default.info({ data: data_registro, obm_id }, 'Nenhuma estatística válida recebida para processamento.');
            return res.status(200).json({ message: 'Nenhuma estatística para registrar.' });
        }
        let registrosAtualizados = 0;
        let registrosCriados = 0;
        let registrosRemovidos = 0;
        await prisma_1.prisma.$transaction(async (tx) => {
            for (const [naturezaId, quantidade] of estatisticasNormalizadas.entries()) {
                if (quantidade > 0) {
                    const atualizado = await tx.estatisticaDiaria.updateMany({
                        where: {
                            data_registro: dataParsed,
                            obm_id,
                            natureza_id: naturezaId,
                        },
                        data: {
                            quantidade,
                            usuario_id: usuario.id,
                            deletado_em: null,
                        },
                    });
                    if (atualizado.count && atualizado.count > 0) {
                        registrosAtualizados += atualizado.count;
                        continue;
                    }
                    await tx.estatisticaDiaria.create({
                        data: {
                            data_registro: dataParsed,
                            obm_id,
                            natureza_id: naturezaId,
                            quantidade,
                            usuario_id: usuario.id,
                        },
                    });
                    registrosCriados += 1;
                }
                else {
                    const removido = await tx.estatisticaDiaria.updateMany({
                        where: {
                            data_registro: dataParsed,
                            obm_id,
                            natureza_id: naturezaId,
                            deletado_em: null,
                        },
                        data: {
                            deletado_em: agora,
                            usuario_id: usuario.id,
                        },
                    });
                    registrosRemovidos += removido.count ?? 0;
                }
            }
        });
        logger_1.default.info({
            data: data_registro,
            obm_id,
            registrosAtualizados,
            registrosCriados,
            registrosRemovidos,
            usuarioId: usuario.id,
        }, 'Processamento de estatísticas em lote concluído.');
        return res.status(200).json({
            message: 'Estatísticas processadas com sucesso.',
            atualizados: registrosAtualizados,
            criados: registrosCriados,
            removidos: registrosRemovidos,
        });
    }
    catch (error) {
        logger_1.default.error({ err: error, body: req.body }, 'Erro ao registrar estatísticas em lote.');
        return res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};
exports.registrarEstatisticasLote = registrarEstatisticasLote;
const getEstatisticasAgrupadasPorIntervalo = async (req, res) => {
    const { dataInicio, dataFim } = req.query;
    if (!dataInicio || typeof dataInicio !== 'string' || !dataFim || typeof dataFim !== 'string') {
        return res.status(400).json({ message: 'As datas de início e fim são obrigatórias.' });
    }
    try {
        const inicio = new Date(dataInicio);
        const fim = new Date(dataFim);
        const estatisticas = await prisma_1.prisma.estatisticaDiaria.findMany({
            where: {
                data_registro: { gte: inicio, lte: fim },
                deletado_em: null,
            },
            include: {
                obm: { include: { crbm: true } },
                natureza: true,
            },
        });
        const dadosAgrupados = {};
        const processarItem = (item, quantidade) => {
            const cidadeNome = item.obm?.nome;
            const crbmNome = item.obm?.crbm?.nome;
            const naturezaNome = item.natureza?.subgrupo;
            const naturezaAbreviacao = item.natureza?.abreviacao;
            const naturezaId = item.natureza?.id ?? null;
            const naturezaGrupo = item.natureza?.grupo;
            if (cidadeNome && naturezaNome && crbmNome) {
                const naturezaChave = naturezaId !== null
                    ? String(naturezaId)
                    : `${naturezaGrupo}|${naturezaNome}`;
                const chave = `${cidadeNome}|${naturezaChave}`;
                if (!dadosAgrupados[chave]) {
                    dadosAgrupados[chave] = {
                        cidade_nome: cidadeNome,
                        crbm_nome: crbmNome,
                        natureza_id: naturezaId ?? undefined,
                        natureza_grupo: naturezaGrupo,
                        natureza_nome: naturezaNome,
                        natureza_abreviacao: naturezaAbreviacao || null,
                        quantidade: 0,
                    };
                }
                dadosAgrupados[chave].quantidade += quantidade;
            }
        };
        estatisticas.forEach(item => processarItem(item, item.quantidade));
        const resultadoFinal = Object.values(dadosAgrupados).sort((a, b) => a.cidade_nome.localeCompare(b.cidade_nome));
        return res.status(200).json(resultadoFinal);
    }
    catch (error) {
        logger_1.default.error({ err: error, query: req.query }, 'Erro ao buscar estatísticas unificadas por data.');
        return res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};
exports.getEstatisticasAgrupadasPorIntervalo = getEstatisticasAgrupadasPorIntervalo;
const limparDadosPorIntervalo = async (req, res) => {
    const { dataInicio, dataFim } = req.query;
    const usuario = req.usuario;
    if (!usuario || usuario.role !== 'admin') {
        return res.status(403).json({ message: 'Acesso negado. Apenas administradores podem executar esta ação.' });
    }
    if (!dataInicio || typeof dataInicio !== 'string' || !dataFim || typeof dataFim !== 'string') {
        return res.status(400).json({ message: 'As datas de início e fim são obrigatórias para limpar os registros.' });
    }
    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);
    try {
        const now = new Date();
        const [loteResult, detalhadasResult, obitosResult] = await prisma_1.prisma.$transaction([
            prisma_1.prisma.estatisticaDiaria.updateMany({
                where: { data_registro: { gte: inicio, lte: fim }, deletado_em: null },
                data: { deletado_em: now }
            }),
            prisma_1.prisma.ocorrenciaDetalhada.updateMany({
                where: { data_ocorrencia: { gte: inicio, lte: fim }, deletado_em: null },
                data: { deletado_em: now }
            }),
            prisma_1.prisma.obitoRegistro.updateMany({
                where: { data_ocorrencia: { gte: inicio, lte: fim }, deletado_em: null },
                data: { deletado_em: now }
            }),
        ]);
        const totalLimpado = loteResult.count + detalhadasResult.count + obitosResult.count;
        await (0, auditoriaService_1.registrarAcao)(req, 'LIMPAR_DADOS_POR_INTERVALO', {
            dataInicio,
            dataFim,
            total: totalLimpado,
            detalhes: {
                estatisticas: loteResult.count,
                ocorrencias: detalhadasResult.count,
                obitos: obitosResult.count
            }
        });
        logger_1.default.info({ dataInicio, dataFim, adminId: usuario.id, total: totalLimpado }, 'Limpeza de dados do dia executada.');
        return res.status(200).json({ message: `Operação concluída. ${totalLimpado} registros de ocorrência foram excluídos para o período.` });
    }
    catch (error) {
        logger_1.default.error({ err: error, query: req.query }, 'Erro ao limpar todos os dados do dia.');
        return res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};
exports.limparDadosPorIntervalo = limparDadosPorIntervalo;
// --- NOVA FUNÇÃO PARA A INTEGRAÇÃO ---
const getSisgpoDashboard = async (req, res) => {
    try {
        const token = jsonwebtoken_1.default.sign({}, SHARED_SECRET, { expiresIn: '1m' });
        const response = await axios_1.default.get(`${SISGPO_API_URL}/api/external/dashboard`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        res.json(response.data);
    }
    catch (error) {
        console.error('Erro ao buscar dados do dashboard do sisgpo:', error);
        res.status(500).json({ message: 'Falha ao obter dados externos.' });
    }
};
exports.getSisgpoDashboard = getSisgpoDashboard;
const getEspelhoBase = async (_req, res) => {
    try {
        const obms = await prisma_1.prisma.oBM.findMany({
            include: {
                crbm: true,
            },
            orderBy: [
                { crbm: { nome: 'asc' } },
                { nome: 'asc' },
            ],
        });
        const base = obms.map((obm) => ({
            id: obm.id,
            cidade_nome: obm.nome,
            crbm_nome: obm.crbm?.nome || 'N/A',
        }));
        res.json(base);
    }
    catch (error) {
        logger_1.default.error({ err: error }, 'Erro ao buscar base de espelho de lançamentos.');
        res.status(500).json({ message: 'Erro interno ao buscar base de espelho.' });
    }
};
exports.getEspelhoBase = getEspelhoBase;
