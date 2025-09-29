import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '@/db';
import logger from '@/config/logger';

// Interface para o tipo de usuário que vem do banco
interface IUser {
  id: number;
  nome: string;
  email: string;
  senha_hash: string;
  role: 'admin' | 'user';
  obm_id: number | null;
}

export const login = async (req: Request, res: Response): Promise<Response> => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ message: 'Email e senha são obrigatórios.' });
  }

  try {
    const { rows } = await db.query('SELECT * FROM usuarios WHERE email = $1', [email]);
    const usuario: IUser | undefined = rows[0];

    if (!usuario) {
      logger.warn({ email }, 'Tentativa de login com email não cadastrado.');
      return res.status(401).json({ message: 'Credenciais inválidas.' });
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);

    if (!senhaValida) {
      logger.warn({ email: usuario.email, id: usuario.id }, 'Tentativa de login com senha incorreta.');
      return res.status(401).json({ message: 'Credenciais inválidas.' });
    }

    const token = jwt.sign(
      { id: usuario.id, role: usuario.role, obm_id: usuario.obm_id },
      process.env.JWT_SECRET as string,
      { expiresIn: '24h' }
    );

    // Retorna os dados do usuário sem o hash da senha
    const { senha_hash, ...usuarioSemSenha } = usuario;

    logger.info({ user: { id: usuario.id, nome: usuario.nome } }, 'Usuário logado com sucesso.');
    return res.status(200).json({
      message: 'Login bem-sucedido!',
      usuario: usuarioSemSenha,
      token,
    });

  } catch (error) {
    logger.error({ err: error }, 'Erro crítico no processo de login.');
    return res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};
