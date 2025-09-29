import { Request, Response } from 'express';
import { RequestWithUser } from '@/middleware/authMiddleware';
import db from '@/db';
import bcrypt from 'bcryptjs';
import logger from '@/config/logger';

export const solicitarAcesso = async (req: Request, res: Response): Promise<void> => {
    const { nome, email, senha, obm_id } = req.body;

    if (!nome || !email || !senha || !obm_id) {
        res.status(400).json({ message: 'Todos os campos são obrigatórios: nome, email, senha e OBM.' });
        return;
    }

    try {
        const emailExists = await db.query(
            `(SELECT email FROM usuarios WHERE email = $1)
             UNION
             (SELECT email FROM solicitacoes_acesso WHERE email = $1)`,
            [email]
        );

        if (emailExists.rows.length > 0) {
            res.status(409).json({ message: 'Este endereço de e-mail já está em uso ou aguardando aprovação.' });
            return;
        }

        const salt = await bcrypt.genSalt(10);
        const senha_hash = await bcrypt.hash(senha, salt);

        const query = `
            INSERT INTO solicitacoes_acesso (nome, email, senha_hash, obm_id, status)
            VALUES ($1, $2, $3, $4, 'pendente')
            RETURNING id, nome, email, data_solicitacao;
        `;
        const { rows } = await db.query(query, [nome, email, senha_hash, obm_id]);

        logger.info({ solicitacao: rows[0] }, 'Nova solicitação de acesso recebida.');
        res.status(201).json({
            message: 'Solicitação de acesso enviada com sucesso! Aguarde a aprovação de um administrador.',
            solicitacao: rows[0]
        });

    } catch (error) {
        logger.error({ err: error }, 'Erro ao criar solicitação de acesso.');
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};

export const listarSolicitacoes = async (_req: Request, res: Response): Promise<void> => {
    try {
        const query = `
            SELECT s.id, s.nome, s.email, s.status, s.data_solicitacao, o.nome as obm_nome
            FROM solicitacoes_acesso s
            JOIN obms o ON s.obm_id = o.id
            ORDER BY s.data_solicitacao DESC;
        `;
        const { rows } = await db.query(query);
        res.status(200).json(rows);
    } catch (error) {
        logger.error({ err: error }, 'Erro ao listar solicitações de acesso.');
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};

export const gerenciarSolicitacao = async (req: RequestWithUser, res: Response): Promise<void> => {
    const { id } = req.params;
    const { acao } = req.body;
    const aprovador_id = req.usuario?.id;

    if (!acao || !['aprovar', 'recusar'].includes(acao)) {
        res.status(400).json({ message: "A ação é obrigatória e deve ser 'aprovar' ou 'recusar'." });
        return;
    }

    const client = await db.pool.connect();

    try {
        await client.query('BEGIN');

        const solicitacaoResult = await client.query('SELECT * FROM solicitacoes_acesso WHERE id = $1 AND status = \'pendente\'', [id]);
        if (solicitacaoResult.rows.length === 0) {
            await client.query('ROLLBACK');
            res.status(404).json({ message: 'Solicitação não encontrada ou já processada.' });
            return;
        }
        const solicitacao = solicitacaoResult.rows[0];

        if (acao === 'aprovar') {
            await client.query(
                `INSERT INTO usuarios (nome, email, senha_hash, role, obm_id) VALUES ($1, $2, $3, 'user', $4)`,
                [solicitacao.nome, solicitacao.email, solicitacao.senha_hash, solicitacao.obm_id]
            );

            await client.query(
                `UPDATE solicitacoes_acesso SET status = 'aprovado', aprovador_id = $1, data_aprovacao = CURRENT_TIMESTAMP WHERE id = $2`,
                [aprovador_id, id]
            );

            await client.query('COMMIT');
            logger.info({ aprovadorId: aprovador_id, solicitacaoId: id }, `Usuário ${solicitacao.nome} aprovado e criado.`);
            res.status(200).json({ message: `Usuário ${solicitacao.nome} aprovado e criado com sucesso.` });

        } else { // acao === 'recusar'
            await client.query(
                `UPDATE solicitacoes_acesso SET status = 'recusado', aprovador_id = $1, data_aprovacao = CURRENT_TIMESTAMP WHERE id = $2`,
                [aprovador_id, id]
            );

            await client.query('COMMIT');
            logger.info({ aprovadorId: aprovador_id, solicitacaoId: id }, `Solicitação de ${solicitacao.nome} recusada.`);
            res.status(200).json({ message: `Solicitação de ${solicitacao.nome} recusada.` });
        }

    } catch (error) {
        await client.query('ROLLBACK');
        logger.error({ err: error, solicitacaoId: id }, 'Erro ao gerenciar solicitação.');
        res.status(500).json({ message: 'Erro interno do servidor.' });
    } finally {
        client.release();
    }
};
