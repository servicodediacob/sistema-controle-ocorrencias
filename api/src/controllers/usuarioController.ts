// Caminho: api/src/controllers/usuarioController.ts

import { Request, Response } from 'express';
import db from '../db';
import bcrypt from 'bcryptjs';

export const listarUsuarios = async (_req: Request, res: Response): Promise<void> => {
  try {
    // --- INÍCIO DA ALTERAÇÃO ---
    // Agora também buscamos a OBM associada ao usuário para exibir na tabela de gestão
    const query = `
      SELECT u.id, u.nome, u.email, u.role, u.criado_em, o.nome as obm_nome
      FROM usuarios u
      LEFT JOIN obms o ON u.obm_id = o.id
      ORDER BY u.nome ASC;
    `;
    const { rows } = await db.query(query);
    // --- FIM DA ALTERAÇÃO ---
    res.status(200).json(rows);
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};

export const criarUsuario = async (req: Request, res: Response): Promise<void> => {
  // --- INÍCIO DA ALTERAÇÃO ---
  // A criação agora também aceita 'role' e 'obm_id'
  const { nome, email, senha, role = 'user', obm_id = null } = req.body;
  // --- FIM DA ALTERAÇÃO ---

  if (!nome || !email || !senha) {
    res.status(400).json({ message: 'Nome, email e senha são obrigatórios.' });
    return;
  }

  try {
    const userExists = await db.query('SELECT id FROM usuarios WHERE email = $1', [email]);
    if (userExists.rows.length > 0) {
      res.status(409).json({ message: 'Este email já está em uso.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const senha_hash = await bcrypt.hash(senha, salt);

    // --- INÍCIO DA ALTERAÇÃO ---
    const query = 'INSERT INTO usuarios (nome, email, senha_hash, role, obm_id) VALUES ($1, $2, $3, $4, $5) RETURNING id, nome, email, role, obm_id, criado_em';
    const { rows } = await db.query(query, [nome, email, senha_hash, role, obm_id]);
    // --- FIM DA ALTERAÇÃO ---

    res.status(201).json({ message: 'Usuário criado com sucesso!', usuario: rows[0] });
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};

export const atualizarUsuario = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  // --- INÍCIO DA ALTERAÇÃO ---
  // Recebemos os novos campos do corpo da requisição
  const { nome, email, role, obm_id } = req.body;

  if (!nome || !email || !role) {
    res.status(400).json({ message: 'Nome, email e role são obrigatórios.' });
    return;
  }

  try {
    // Construção dinâmica da query para permitir atualização de senha opcional
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (nome) { fields.push(`nome = $${paramIndex++}`); values.push(nome); }
    if (email) { fields.push(`email = $${paramIndex++}`); values.push(email); }
    if (role) { fields.push(`role = $${paramIndex++}`); values.push(role); }
    
    // OBM ID pode ser nulo para administradores
    fields.push(`obm_id = $${paramIndex++}`);
    values.push(obm_id);

    if (fields.length === 0) {
      res.status(400).json({ message: 'Nenhum campo para atualizar foi fornecido.' });
      return;
    }

    values.push(id); // Adiciona o ID do usuário como último parâmetro para a cláusula WHERE

    const query = `
      UPDATE usuarios 
      SET ${fields.join(', ')} 
      WHERE id = $${paramIndex} 
      RETURNING id, nome, email, role, obm_id, criado_em
    `;
    
    const { rows } = await db.query(query, values);
    // --- FIM DA ALTERAÇÃO ---

    if (rows.length === 0) {
      res.status(404).json({ message: 'Usuário não encontrado.' });
      return;
    }

    res.status(200).json({ message: 'Usuário atualizado com sucesso!', usuario: rows[0] });
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};

export const excluirUsuario = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const plantaoCheck = await db.query('SELECT usuario_id FROM supervisor_plantao WHERE usuario_id = $1', [id]);
    if (plantaoCheck.rows.length > 0) {
      res.status(400).json({ message: 'Não é possível excluir o usuário que está definido como supervisor de plantão. Remova-o do plantão primeiro.' });
      return;
    }

    const result = await db.query('DELETE FROM usuarios WHERE id = $1', [id]);

    if (result.rowCount === 0) {
      res.status(404).json({ message: 'Usuário não encontrado.' });
      return;
    }

    res.status(200).json({ message: 'Usuário excluído com sucesso.' });
  } catch (error) {
    console.error('Erro ao excluir usuário:', error);
    if ((error as any).code === '23503') {
      res.status(400).json({ message: 'Não é possível excluir este usuário, pois ele está associado a outros registros no sistema.' });
      return;
    }
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};
