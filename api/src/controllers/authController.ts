// Em api/src/controllers/authController.ts

import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db';
import logger from '../config/logger';

// ... (outras funções do controller)

// --- INÍCIO DA CORREÇÃO ---
// Adicionamos a anotação de tipo de retorno que foi removida acidentalmente.
export const login = async (req: Request, res: Response): Promise<Response | void> => {
// --- FIM DA CORREÇÃO ---
  const { email, senha } = req.body;

  console.log(`[TESTE DEBUG] 1. Rota de login chamada com email: ${email}`);

  try {
    const { rows } = await db.query('SELECT * FROM usuarios WHERE email = $1', [email]);
    
    console.log(`[TESTE DEBUG] 2. Busca no DB por ${email} retornou ${rows.length} usuário(s).`);

    if (rows.length === 0) {
      console.log(`[TESTE DEBUG] 3. FALHA: Usuário não encontrado. Retornando 401.`);
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    const usuario = rows[0];
    
    console.log(`[TESTE DEBUG] 4. Usuário encontrado: ID ${usuario.id}, Email: ${usuario.email}`);
    console.log(`[TESTE DEBUG] 5. Comparando senha fornecida com o hash do banco: ${usuario.senha_hash}`);

    const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);

    console.log(`[TESTE DEBUG] 6. Resultado da comparação de senha (bcrypt.compare): ${senhaValida}`);

    if (!senhaValida) {
      console.log(`[TESTE DEBUG] 7. FALHA: Senha inválida. Retornando 401.`);
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    const token = jwt.sign(
      { id: usuario.id, role: usuario.role, obm_id: usuario.obm_id },
      process.env.JWT_SECRET as string,
      { expiresIn: '1d' }
    );

    console.log(`[TESTE DEBUG] 8. SUCESSO: Gerando token para o usuário ID ${usuario.id}.`);

    // Note que aqui não há 'return', o que é permitido pela assinatura `Promise<void>`
    res.status(200).json({
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        role: usuario.role,
        obm_id: usuario.obm_id,
      },
    });

  } catch (error) {
    console.error('[TESTE DEBUG] 9. ERRO CATASTRÓFICO no bloco try/catch do login:', error);
    logger.error({ err: error, email }, 'Erro no processo de login');
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
};
