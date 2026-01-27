import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import logger from '@/config/logger';

const prisma = new PrismaClient();

/**
 * Retorna a lista de viaturas sincronizadas do SISGPO
 */
export const getViaturasSisgpo = async (req: Request, res: Response) => {
    try {
        const { obm, ativa, prefixo } = req.query;

        const where: any = {};

        if (obm) {
            where.obm = { contains: String(obm), mode: 'insensitive' };
        }

        if (ativa !== undefined) {
            where.ativa = ativa === 'true';
        }

        if (prefixo) {
            where.prefixo = { contains: String(prefixo), mode: 'insensitive' };
        }

        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const [viaturas, total] = await Promise.all([
            prisma.viaturaSisgpo.findMany({
                where,
                skip,
                take: limit,
                orderBy: [
                    { obm: 'asc' },
                    { prefixo: 'asc' },
                ],
            }),
            prisma.viaturaSisgpo.count({ where })
        ]);

        return res.status(200).json({
            data: viaturas,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalRecords: total
            }
        });
    } catch (error) {
        logger.error({ err: error }, 'Erro ao buscar viaturas do SISGPO no banco local.');
        return res.status(500).json({ message: 'Erro ao buscar viaturas.' });
    }
};

/**
 * Retorna uma viatura específica pelo ID ou Prefixo
 */
export const getViaturaSisgpoPorId = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const viatura = await prisma.viaturaSisgpo.findFirst({
            where: {
                OR: [
                    { id: isNaN(Number(id)) ? -1 : Number(id) },
                    { prefixo: id }
                ]
            }
        });

        if (!viatura) {
            return res.status(404).json({ message: 'Viatura não encontrada.' });
        }

        return res.status(200).json(viatura);
    } catch (error) {
        logger.error({ err: error, id: req.params.id }, 'Erro ao buscar viatura por ID.');
        return res.status(500).json({ message: 'Erro interno.' });
    }
};
