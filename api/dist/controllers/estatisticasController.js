"use strict";
// api/src/controllers/estatisticasController.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSisgpoDashboard = exports.limparTodosOsDadosDoDia = exports.getEstatisticasAgrupadasPorData = exports.registrarEstatisticasLote = void 0;
const prisma_1 = require("../lib/prisma"); // Corrigido para caminho relativo
const logger_1 = __importDefault(require("../config/logger")); // Corrigido para caminho relativo
const date_1 = require("../utils/date"); // Corrigido para caminho relativo
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const axios_1 = __importDefault(require("axios"));
// Segredos para a integração (use variáveis de ambiente em produção)
const SHARED_SECRET = process.env.SSO_SHARED_SECRET || 'seu-segredo-compartilhado';
const SISGPO_API_URL = process.env.SISGPO_API_URL || 'http://localhost:3333';
// --- SUAS FUNÇÕES EXISTENTES (Sem alterações na lógica interna) ---
const registrarEstatisticasLote = async (req, res) => {
    const { data_registro, obm_id, estatisticas } = req.body;
    const usuario = req.usuario;
    if (!usuario) {
        return res.status(401).json({ message: 'Usuário não autenticado.' });
    }
    if (usuario.role !== 'admin' && usuario.obm_id !== obm_id) {
        return res.status(403).json({ message: 'Acesso negado. Você só pode registrar dados para a sua própria OBM.' });
    }
    if (!data_registro || !obm_id || !estatisticas) {
        return res.status(400).json({ message: 'Dados incompletos. data_registro, obm_id e estatisticas são obrigatórios.' });
    }
    try {
        const dataParsed = (0, date_1.parseDateParam)(data_registro, 'data_registro');
        await prisma_1.prisma.$transaction(async (tx) => {
            await tx.estatisticaDiaria.deleteMany({
                where: {
                    data_registro: dataParsed,
                    obm_id: obm_id,
                },
            });
            const dadosParaCriar = estatisticas
                .filter(stat => stat.quantidade > 0)
                .map(stat => ({
                data_registro: dataParsed,
                obm_id: obm_id,
                natureza_id: stat.natureza_id,
                quantidade: stat.quantidade,
                usuario_id: usuario.id,
            }));
            if (dadosParaCriar.length > 0) {
                await tx.estatisticaDiaria.createMany({
                    data: dadosParaCriar,
                });
            }
        });
        const totalRegistros = estatisticas.filter(s => s.quantidade > 0).length;
        if (totalRegistros === 0) {
            logger_1.default.info({ data: data_registro, obm_id }, 'Registros de estatísticas limpos (nenhum dado novo para inserir).');
            return res.status(200).json({ message: 'Nenhuma estatística para registrar. Registros anteriores para o dia e OBM foram limpos.' });
        }
        logger_1.default.info({ data: data_registro, obm_id, count: totalRegistros }, 'Estatísticas em lote registradas com sucesso.');
        return res.status(201).json({ message: `${totalRegistros} tipo(s) de estatística registrados com sucesso para a OBM!` });
    }
    catch (error) {
        logger_1.default.error({ err: error, body: req.body }, 'Erro ao registrar estatísticas em lote.');
        return res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};
exports.registrarEstatisticasLote = registrarEstatisticasLote;
const getEstatisticasAgrupadasPorData = async (req, res) => {
    const { data } = req.query;
    if (!data || typeof data !== 'string') {
        return res.status(400).json({ message: 'A data é obrigatória.' });
    }
    try {
        const base = (0, date_1.parseDateParam)(data, 'data');
        const dataInicio = new Date(base);
        dataInicio.setHours(0, 0, 0, 0);
        const dataFim = new Date(base);
        dataFim.setHours(23, 59, 59, 999);
        const estatisticas = await prisma_1.prisma.estatisticaDiaria.findMany({
            where: { data_registro: { gte: dataInicio, lte: dataFim } },
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
exports.getEstatisticasAgrupadasPorData = getEstatisticasAgrupadasPorData;
const limparTodosOsDadosDoDia = async (req, res) => {
    const { data } = req.query;
    const usuario = req.usuario;
    if (!usuario || usuario.role !== 'admin') {
        return res.status(403).json({ message: 'Acesso negado. Apenas administradores podem executar esta ação.' });
    }
    if (!data || typeof data !== 'string') {
        return res.status(400).json({ message: 'A data é obrigatória para limpar os registros.' });
    }
    const dataInicio = new Date(data + 'T00:00:00.000Z');
    const dataFim = new Date(data + 'T23:59:59.999Z');
    try {
        const [loteResult, detalhadasResult] = await prisma_1.prisma.$transaction([
            prisma_1.prisma.estatisticaDiaria.deleteMany({ where: { data_registro: { gte: dataInicio, lte: dataFim } } }),
            prisma_1.prisma.ocorrenciaDetalhada.deleteMany({ where: { data_ocorrencia: { gte: dataInicio, lte: dataFim } } }),
        ]);
        const totalLimpado = loteResult.count + detalhadasResult.count;
        logger_1.default.info({ data, adminId: usuario.id, total: totalLimpado }, 'Limpeza de dados do dia executada.');
        return res.status(200).json({ message: `Operação concluída. ${totalLimpado} registros de ocorrência foram excluídos para o dia ${data}.` });
    }
    catch (error) {
        logger_1.default.error({ err: error, query: req.query }, 'Erro ao limpar todos os dados do dia.');
        return res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};
exports.limparTodosOsDadosDoDia = limparTodosOsDadosDoDia;
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
