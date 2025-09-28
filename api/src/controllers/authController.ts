import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '@/db'; // CORRIGIDO
import logger from '@/config/logger'; // CORRIGIDO

interface IUser {
  id: number;
  nome: string;
  email: string;
  senha_hash: string;
  role: 'admin' | 'user';
  obm_id: number | null;
  criado_em: Date;
}

// ... (o resto do arquivo permanece o mesmo)
export const login = async (req: Request, res: Response): Promise<Response> => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ message: 'Email e senha são obrigatórios.' });
  }

  try {
    const { rows } = await db.query('SELECT * FROM usuarios WHERE email = $1', [email]);
    const usuario: IUser | undefined = rows[0];

    if (!usuario) {
      return res.status(401).json({ message: 'Credenciais inválidas.' });
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);

    if (!senhaValida) {
      return res.status(401).json({ message: 'Credenciais inválidas.' });
    }

    const token = jwt.sign(
      { id: usuario.id, role: usuario.role, obm_id: usuario.obm_id },
      process.env.JWT_SECRET as string,
      { expiresIn: '24h' }
    );

    // Retorna os dados do usuário sem o hash da senha
    const { senha_hash, ...usuarioSemSenha } = usuario;

    return res.status(200).json({
      message: 'Login bem-sucedido!',
      usuario: usuarioSemSenha,
      token,
    });

  } catch (error) {
    logger.error({ err: error }, 'Erro no processo de login.');
    return res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};
