"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.excluirRegistrosAntigos = void 0;
const prisma_1 = require("../lib/prisma");
const LIMITE_RETENCAO_DIAS = 31;
const excluirRegistrosAntigos = async () => {
    const limite = new Date();
    limite.setDate(limite.getDate() - LIMITE_RETENCAO_DIAS);
    try {
        await prisma_1.prisma.estatisticaDiaria.deleteMany({
            where: { data_registro: { lt: limite } },
        });
        await prisma_1.prisma.ocorrenciaDetalhada.deleteMany({
            where: { data_ocorrencia: { lt: limite } },
        });
        await prisma_1.prisma.obitoRegistro.deleteMany({
            where: { data_ocorrencia: { lt: limite } },
        });
    }
    catch (error) {
        console.error('Erro ao excluir registros antigos:', error);
        // Considere um tratamento de erro mais robusto aqui
    }
};
exports.excluirRegistrosAntigos = excluirRegistrosAntigos;
