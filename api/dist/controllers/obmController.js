"use strict";
// api/src/controllers/obmController.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getObmsPendentesPorIntervalo = void 0;
const prisma_1 = require("../lib/prisma");
const logger_1 = __importDefault(require("../config/logger"));
const getObmsPendentesPorIntervalo = async (req, res) => {
    const { dataInicio, dataFim } = req.query;
    if (!dataInicio || typeof dataInicio !== 'string' || !dataFim || typeof dataFim !== 'string') {
        res.status(400).json({ message: 'As datas de início e fim são obrigatórias.' });
        return;
    }
    try {
        const inicio = new Date(dataInicio);
        const fim = new Date(dataFim);
        // Encontrar todas as OBMs
        const todasObms = await prisma_1.prisma.oBM.findMany({
            select: {
                id: true,
                nome: true,
                crbm: {
                    select: {
                        nome: true,
                    },
                },
            },
        });
        // Encontrar as OBMs que já registraram estatísticas para a data fornecida
        const obmsComEstatisticas = await prisma_1.prisma.estatisticaDiaria.findMany({
            where: {
                data_registro: {
                    gte: inicio,
                    lte: fim,
                },
            },
            select: {
                obm_id: true,
            },
            distinct: ['obm_id'],
        });
        const obmIdsComEstatisticas = new Set(obmsComEstatisticas.map(e => e.obm_id));
        // Filtrar as OBMs que não registraram estatísticas
        const obmsPendentes = todasObms.filter(obm => !obmIdsComEstatisticas.has(obm.id));
        res.status(200).json(obmsPendentes.map(obm => ({
            id: obm.id,
            cidade_nome: obm.nome,
            crbm_nome: obm.crbm.nome,
        })));
    }
    catch (error) {
        logger_1.default.error({ err: error, dataInicio, dataFim }, 'Erro ao buscar OBMs pendentes por data.');
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};
exports.getObmsPendentesPorIntervalo = getObmsPendentesPorIntervalo;
