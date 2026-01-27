import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import logger from '@/config/logger';

const prisma = new PrismaClient();

/**
 * Retorna a lista de militares sincronizados do SISGPO
 */
export const getMilitaresSisgpo = async (req: Request, res: Response) => {
    try {
        const { obm, cargo, busca } = req.query;

        const where: any = {};

        if (obm) {
            where.obm_nome = { contains: String(obm), mode: 'insensitive' };
        }

        if (cargo) {
            where.posto_graduacao = { contains: String(cargo), mode: 'insensitive' };
        }

        if (busca) {
            where.OR = [
                { nome_completo: { contains: String(busca), mode: 'insensitive' } },
                { matricula: { contains: String(busca), mode: 'insensitive' } },
                { nome_guerra: { contains: String(busca), mode: 'insensitive' } },
            ];
        }

        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const [militares, total] = await Promise.all([
            prisma.militarSisgpo.findMany({
                where,
                skip,
                take: limit,
                orderBy: [
                    { obm_nome: 'asc' },
                    { posto_graduacao: 'asc' },
                    { nome_completo: 'asc' },
                ],
            }),
            prisma.militarSisgpo.count({ where })
        ]);

        return res.status(200).json({
            data: militares,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalRecords: total
            }
        });
    } catch (error) {
        logger.error({ err: error }, 'Erro ao buscar militares do SISGPO no banco local.');
        return res.status(500).json({ message: 'Erro ao buscar militares.' });
    }
};

/**
 * Retorna um militar específico pelo ID ou Matrícula
 */
export const getMilitarSisgpoPorId = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const militar = await prisma.militarSisgpo.findFirst({
            where: {
                OR: [
                    { id: isNaN(Number(id)) ? -1 : Number(id) },
                    { matricula: id }
                ]
            }
        });

        if (!militar) {
            return res.status(404).json({ message: 'Militar não encontrado.' });
        }

        return res.status(200).json(militar);
    } catch (error) {
        logger.error({ err: error, id: req.params.id }, 'Erro ao buscar militar por ID.');
        return res.status(500).json({ message: 'Erro interno.' });
    }
};
