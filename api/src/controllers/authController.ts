// Caminho: api/src/controllers/authController.ts

import { Request, Response } from 'express';
import db from '../db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import 'dotenv/config';

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    res.status(400).json({ message: 'Email e senha são obrigatórios.' });
    return;
  }

  try {
    const result = await db.query('SELECT * FROM usuarios WHERE email = $1', [email]);
    const usuario = result.rows[0];

    if (!usuario) {
      res.status(401).json({ message: 'Credenciais inválidas.' });
      return;
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);

    if (!senhaValida) {
      res.status(401).json({ message: 'Credenciais inválidas.' });
      return;
    }

    // --- INÍCIO DA CORREÇÃO ---
    // Adicionamos 'role' e 'obm_id' ao payload do token.
    const token = jwt.sign(
      { 
        id: usuario.id, 
        nome: usuario.nome,
        role: usuario.role,
        obm_id: usuario.obm_id
      },
      process.env.JWT_SECRET as string,
      { expiresIn: '8h' }
    );
    // --- FIM DA CORREÇÃO ---

    delete usuario.senha_hash;

    res.status(200).json({ usuario, token });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};
