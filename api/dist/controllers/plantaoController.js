"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setSupervisorPlantao = exports.getSupervisores = exports.getPlantao = void 0;
const prisma_1 = require("../lib/prisma");
const logger_1 = __importDefault(require("../config/logger"));
const getPlantao = async (_req, res) => {
    try {
        // ======================= INÍCIO DA CORREÇÃO =======================
        // Garante que a busca seja sempre em UTC para o dia de hoje
        const hojeInicio = new Date();
        hojeInicio.setUTCHours(0, 0, 0, 0);
        const hojeFim = new Date();
        hojeFim.setUTCHours(23, 59, 59, 999);
        const ocorrenciasDestaque = await prisma_1.prisma.ocorrenciaDetalhada.findMany({
            where: {
                deletado_em: null,
                data_ocorrencia: {
                    gte: hojeInicio,
                    lte: hojeFim,
                },
            },
            include: {
                natureza: true,
                cidade: true,
            },
            orderBy: {
                horario_ocorrencia: 'asc',
            },
        });
        // ======================= FIM DA CORREÇÃO =======================
        const destaquesFormatados = ocorrenciasDestaque.map(od => ({
            ...od,
            natureza_grupo: od.natureza.grupo,
            natureza_nome: od.natureza.subgrupo,
            cidade_nome: od.cidade.nome,
        }));
        const supervisorPlantao = await prisma_1.prisma.supervisorPlantao.findUnique({
            where: { id: 1 },
            include: {
                usuario: {
                    select: {
                        nome: true,
                    },
                },
            },
        });
        res.status(200).json({
            ocorrenciasDestaque: destaquesFormatados,
            supervisorPlantao: {
                usuario_id: supervisorPlantao?.usuario_id || null,
                supervisor_nome: supervisorPlantao?.usuario?.nome || null,
            },
        });
    }
    catch (error) {
        logger_1.default.error({ err: error }, 'Erro ao buscar dados do plantão.');
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};
exports.getPlantao = getPlantao;
// ... (resto do arquivo sem alterações)
const getSupervisores = async (_req, res) => {
    try {
        const supervisores = await prisma_1.prisma.usuario.findMany({
            where: { role: 'admin' },
            select: { id: true, nome: true },
            orderBy: { nome: 'asc' },
        });
        res.status(200).json(supervisores);
    }
    catch (error) {
        logger_1.default.error({ err: error }, 'Erro ao buscar lista de supervisores.');
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};
exports.getSupervisores = getSupervisores;
const setSupervisorPlantao = async (req, res) => {
    const { usuario_id } = req.body;
    try {
        const supervisorAtualizado = await prisma_1.prisma.supervisorPlantao.update({
            where: { id: 1 },
            data: {
                usuario_id: usuario_id,
                definido_em: new Date(),
            },
        });
        logger_1.default.info({ novoSupervisorId: usuario_id }, 'Supervisor de plantão atualizado.');
        res.status(200).json(supervisorAtualizado);
    }
    catch (error) {
        logger_1.default.error({ err: error, body: req.body }, 'Erro ao definir supervisor de plantão.');
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};
exports.setSupervisorPlantao = setSupervisorPlantao;
