// api/src/db/seed.ts
import bcrypt from 'bcryptjs';
import db from './index';
import './config/envLoader';
import logger from '../config/logger';

// A função agora é exportada para ser usada em outro lugar
export async function seedProductionAdmin() {
  logger.info('--- INICIANDO SCRIPT DE SEED PARA USUÁRIO ADMIN ---');

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    const errorMsg = '[SEED] ERRO: As variáveis de ambiente ADMIN_EMAIL e ADMIN_PASSWORD são obrigatórias.';
    logger.error(errorMsg);
    // Em vez de process.exit, lançamos um erro para ser capturado pelo controller
    throw new Error(errorMsg);
  }

  const client = await db.pool.connect();
  logger.info('🔌 Conexão com o banco de dados estabelecida.');

  try {
    const userExists = await client.query('SELECT id FROM usuarios WHERE email = $1', [adminEmail]);

    if (userExists.rows.length > 0) {
      logger.warn(`[SEED] Usuário com email "${adminEmail}" já existe. Nenhuma ação foi tomada.`);
      return { message: `Usuário ${adminEmail} já existe.` };
    }

    logger.info(`Criando usuário administrador para: ${adminEmail}`);
    const salt = await bcrypt.genSalt(10);
    const senha_hash = await bcrypt.hash(adminPassword, salt);

    await client.query(
      `INSERT INTO usuarios (nome, email, senha_hash, role, obm_id) VALUES ($1, $2, $3, 'admin', NULL)`,
      ['Administrador Principal', adminEmail, senha_hash]
    );

    logger.info('✅ USUÁRIO ADMINISTRADOR CRIADO COM SUCESSO!');
    return { message: 'Usuário administrador criado com sucesso!' };

  } catch (error) {
    logger.error({ err: error }, '[SEED] Erro ao criar usuário administrador.');
    throw error;
  } finally {
    await client.release();
    logger.info('🔌 Conexão com o banco de dados liberada.');
  }
}

// O bloco abaixo só será executado se o arquivo for chamado diretamente via 'node'
if (require.main === module) {
  seedProductionAdmin()
    .then(() => {
      logger.info('Script de seed finalizado.');
      process.exit(0);
    })
    .catch(() => {
      logger.error('Script de seed encontrou um erro e foi encerrado.');
      process.exit(1);
    });
}
