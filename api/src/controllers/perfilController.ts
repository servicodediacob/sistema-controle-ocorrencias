// Caminho: api/src/controllers/perfilController.ts

import { Response } from 'express';
import { RequestWithUser } from '@/middleware/authMiddleware';
import db from '@/db';
import bcrypt from 'bcryptjs';
import logger from '@/config/logger';
import { registrarAcao } from '@/services/auditoriaService';

export const alterarPropriaSenha = async (req: RequestWithUser, res: Response): Promise<void> => {
  const { senhaAtual, novaSenha } = req.body;
  const usuarioId = req.usuario?.id;

  if (!senhaAtual || !novaSenha) {
    res.status(400).json({ message: 'A senha atual e a nova senha são obrigatórias.' });
    return;
  }

  if (!usuarioId) {
    res.status(401).json({ message: 'Usuário não autenticado.' });
    return;
  }

  try {
    const { rows } = await db.query('SELECT senha_hash FROM usuarios WHERE id = $1', [usuarioId]);

    if (rows.length === 0) {
      res.status(404).json({ message: 'Usuário não encontrado.' });
      return;
    }

    // --- INÍCIO DA CORREÇÃO ---
    // Acessamos o primeiro (e único) resultado do array 'rows'
    const usuario = rows[0];
    const senhaValida = await bcrypt.compare(senhaAtual, usuario.senha_hash);
    // --- FIM DA CORREÇÃO ---

    if (!senhaValida) {
      res.status(401).json({ message: 'A senha atual está incorreta.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const novaSenhaHash = await bcrypt.hash(novaSenha, salt);

    await db.query('UPDATE usuarios SET senha_hash = $1 WHERE id = $2', [novaSenhaHash, usuarioId]);

    await registrarAcao(req, 'ALTERACAO_PROPRIA_SENHA', {
      detalhe: `Usuário (ID: ${usuarioId}) alterou a própria senha.`
    });

    logger.info({ usuarioId }, 'Usuário alterou a própria senha com sucesso.');
    res.status(200).json({ message: 'Senha alterada com sucesso!' });

  } catch (error) {
    logger.error({ err: error, usuarioId }, 'Erro ao alterar a própria senha.');
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};
