import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import logger from '@/config/logger';

const prisma = new PrismaClient();

/**
 * Controller responsável por receber atualizações do SISGPO via Webhook
 */
export const handleReplicationWebhook = async (req: Request, res: Response) => {
    try {
        const { table, action, record, old_record } = req.body;

        if (!table || !action || !record) {
            return res.status(400).json({ error: 'Payload incompleto' });
        }

        logger.info(`[Replication] Recebido ${action} na tabela ${table} do SISGPO`);

        switch (table) {
            case 'obms':
                await syncObm(action, record, old_record);
                break;
            case 'militares':
                await syncMilitar(action, record, old_record);
                break;
            case 'viaturas':
                await syncViatura(action, record, old_record);
                break;
            default:
                logger.warn(`[Replication] Tabela não suportada: ${table}`);
        }

        return res.status(200).json({ status: 'ok' });
    } catch (error: any) {
        logger.error({ err: error }, '[Replication] Falha ao processar webhook');
        return res.status(500).json({ error: error.message });
    }
};

async function syncObm(action: string, record: any, old_record: any) {
    if (action === 'DELETE') {
        await prisma.obmSisgpo.delete({ where: { id: old_record.id } });
    } else {
        await prisma.obmSisgpo.upsert({
            where: { id: record.id },
            update: {
                nome: record.nome,
                abreviatura: record.abreviatura,
                cidade: record.cidade,
                telefone: record.telefone,
                crbm: record.crbm,
                updated_at: new Date(record.updated_at),
            },
            create: {
                id: record.id,
                nome: record.nome,
                abreviatura: record.abreviatura,
                cidade: record.cidade,
                telefone: record.telefone,
                crbm: record.crbm,
                created_at: new Date(record.created_at),
                updated_at: new Date(record.updated_at),
            },
        });
    }
}

async function syncMilitar(action: string, record: any, old_record: any) {
    if (action === 'DELETE') {
        await prisma.militarSisgpo.delete({ where: { id: old_record.id } });
    } else {
        await prisma.militarSisgpo.upsert({
            where: { id: record.id },
            update: {
                matricula: record.matricula,
                nome_completo: record.nome_completo,
                nome_guerra: record.nome_guerra,
                posto_graduacao: record.posto_graduacao,
                tipo: record.tipo,
                ativo: record.ativo,
                obm_nome: record.obm_nome,
                telefone: record.telefone,
                updated_at: new Date(record.updated_at),
            },
            create: {
                id: record.id,
                matricula: record.matricula,
                nome_completo: record.nome_completo,
                nome_guerra: record.nome_guerra,
                posto_graduacao: record.posto_graduacao,
                tipo: record.tipo,
                ativo: record.ativo,
                obm_nome: record.obm_nome,
                telefone: record.telefone,
                created_at: new Date(record.created_at),
                updated_at: new Date(record.updated_at),
            },
        });
    }
}

async function syncViatura(action: string, record: any, old_record: any) {
    if (action === 'DELETE') {
        await prisma.viaturaSisgpo.delete({ where: { id: old_record.id } });
    } else {
        await prisma.viaturaSisgpo.upsert({
            where: { id: record.id },
            update: {
                prefixo: record.prefixo,
                tipo: record.tipo,
                ativa: record.ativa,
                cidade: record.cidade,
                obm: record.obm,
                telefone: record.telefone,
                updated_at: new Date(record.updated_at),
            },
            create: {
                id: record.id,
                prefixo: record.prefixo,
                tipo: record.tipo,
                ativa: record.ativa,
                cidade: record.cidade,
                obm: record.obm,
                telefone: record.telefone,
                created_at: new Date(record.created_at),
                updated_at: new Date(record.updated_at),
            },
        });
    }
}
