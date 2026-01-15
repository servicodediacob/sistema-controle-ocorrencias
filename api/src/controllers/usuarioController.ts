// Caminho: api/src/controllers/usuarioController.ts

import { Response } from 'express';
// 1. IMPORTAR O TIPO CORRETO
import { RequestWithUser } from '@/middleware/authMiddleware';
import db from '@/db';
import bcrypt from 'bcryptjs';
import logger from '@/config/logger';

// 2. ATUALIZAR A ASSINATURA DA FUNÃ‡ÃƒO
export const listarUsuarios = async (_req: RequestWithUser, res: Response): Promise<void> => {
  try {
    const query = `
      SELECT u.id, u.nome, u.email, u.perfil AS role, u.criado_em, o.nome as obm_nome
      FROM usuarios u
      LEFT JOIN obms o ON u.obm_id = o.id
      ORDER BY u.nome ASC;
    `;
    const { rows } = await db.query(query);
    res.status(200).json(rows);
  } catch (error) {
    logger.error({ err: error }, 'Erro ao listar usuÃ¡rios.');
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};

// 3. ATUALIZAR AS OUTRAS FUNÃ‡Ã•ES NO MESMO ARQUIVO POR CONSISTÃŠNCIA
export const criarUsuario = async (req: RequestWithUser, res: Response): Promise<void> => {
  const { nome, email, senha, role = 'user', obm_id = null } = req.body;

  if (!nome || !email || !senha) {
    res.status(400).json({ message: 'Nome, email e senha sÃ£o obrigatÃ³rios.' });
    return;
  }

  try {
    const userExists = await db.query('SELECT id FROM usuarios WHERE email = $1', [email]);
    if (userExists.rows.length > 0) {
      res.status(409).json({ message: 'Este email jÃ¡ estÃ¡ em uso.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const senha_hash = await bcrypt.hash(senha, salt);

    const query = 'INSERT INTO usuarios (nome, email, senha_hash, perfil, obm_id) VALUES ($1, $2, $3, $4, $5) RETURNING id, nome, email, perfil AS role, obm_id, criado_em';
    const { rows } = await db.query(query, [nome, email, senha_hash, role, obm_id]);

    logger.info({ usuario: rows[0] }, 'Novo usuÃ¡rio criado.');
    res.status(201).json({ message: 'UsuÃ¡rio criado com sucesso!', usuario: rows[0] });
  } catch (error) {
    logger.error({ err: error, body: req.body }, 'Erro ao criar usuÃ¡rio.');
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};

export const atualizarUsuario = async (req: RequestWithUser, res: Response): Promise<void> => {
  const { id } = req.params;
  const { nome, email, role, obm_id } = req.body;

  if (!nome || !email || !role) {
    res.status(400).json({ message: 'Nome, email e role sÃ£o obrigatÃ³rios.' });
    return;
  }

  try {
    const query = `
      UPDATE usuarios 
      SET nome = $1, email = $2, perfil = $3, obm_id = $4
      WHERE id = $5 
      RETURNING id, nome, email, perfil AS role, obm_id, criado_em
    `;
    const values = [nome, email, role, obm_id || null, id];
    
    const { rows } = await db.query(query, values);

    if (rows.length === 0) {
      res.status(404).json({ message: 'UsuÃ¡rio nÃ£o encontrado.' });
      return;
    }

    logger.info({ usuario: rows[0] }, 'UsuÃ¡rio atualizado.');
    res.status(200).json({ message: 'UsuÃ¡rio atualizado com sucesso!', usuario: rows[0] });
  } catch (error) {
    logger.error({ err: error, params: req.params, body: req.body }, 'Erro ao atualizar usuÃ¡rio.');
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};

// A funÃ§Ã£o excluirUsuario jÃ¡ estava correta, mas Ã© bom confirmar.
export const excluirUsuario = async (req: RequestWithUser, res: Response): Promise<void> => {
  const { id } = req.params;
  const idNumerico = parseInt(id, 10);

  if (req.usuario?.id === idNumerico) {
    res.status(400).json({ message: 'VocÃª nÃ£o pode excluir a si mesmo.' });
    return;
  }

  try {
    const plantaoCheck = await db.query('SELECT usuario_id FROM supervisor_plantao WHERE usuario_id = $1', [idNumerico]);
    if (plantaoCheck.rows.length > 0) {
      res.status(400).json({ message: 'NÃ£o Ã© possÃ­vel excluir o usuÃ¡rio que estÃ¡ definido como supervisor de plantÃ£o. Remova-o do plantÃ£o primeiro.' });
      return;
    }

    const result = await db.query('DELETE FROM usuarios WHERE id = $1', [idNumerico]);

    if (result.rowCount === 0) {
      res.status(404).json({ message: 'UsuÃ¡rio nÃ£o encontrado.' });
      return;
    }

    logger.info({ usuarioIdExcluido: id, adminId: req.usuario?.id }, 'UsuÃ¡rio excluÃ­do com sucesso.');
    res.status(204).send();
  } catch (error) {
    if ((error as any).code === '23503') {
      logger.warn({ usuarioIdExcluido: id }, 'Tentativa de excluir usuÃ¡rio com registros associados.');
      res.status(400).json({ message: 'NÃ£o Ã© possÃ­vel excluir este usuÃ¡rio, pois ele estÃ¡ associado a outros registros no sistema (ocorrÃªncias, etc.).' });
      return;
    }
    logger.error({ err: error, usuarioId: id }, 'Erro ao excluir usuÃ¡rio.');
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};

