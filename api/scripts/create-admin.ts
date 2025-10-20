// api/scripts/create-admin.ts
// Cria ou promove um usuário para admin de forma idempotente usando a API do Prisma.

import '../src/config/envLoader';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function run() {
  const email = process.env.ADMIN_EMAIL as string;
  const nome = (process.env.ADMIN_NOME as string) || 'Administrador';
  const senha = process.env.ADMIN_PASSWORD as string;
  const forceUpdate = String(process.env.FORCE_UPDATE || 'false').toLowerCase() === 'true';
  const obmIdEnv = process.env.ADMIN_OBM_ID;
  const obmId = obmIdEnv ? Number(obmIdEnv) : null;

  if (!email || !senha) {
    throw new Error('As variáveis de ambiente ADMIN_EMAIL e ADMIN_PASSWORD são obrigatórias.');
  }

  const existingUser = await prisma.usuario.findUnique({
    where: { email },
  });

  const senhaHash = await bcrypt.hash(senha, 10);

  if (!existingUser) {
    // Criar novo usuário
    const userData: any = {
      nome,
      email,
      senha_hash: senhaHash,
      role: 'admin',
    };
    if (obmId !== null && !Number.isNaN(obmId)) {
      userData.obm_id = obmId;
    }

    await prisma.usuario.create({ data: userData });
    console.log('[create-admin] Usuário criado como admin:', email);

  } else {
    // Atualizar usuário existente
    const updateData: any = {
      role: 'admin',
    };
    if (forceUpdate) {
      updateData.senha_hash = senhaHash;
    }
    if (obmId !== null && !Number.isNaN(obmId)) {
      updateData.obm_id = obmId;
    }

    await prisma.usuario.update({
      where: { email },
      data: updateData,
    });
    console.log('[create-admin] Usuário promovido/atualizado para admin:', email);
  }
}

run()
  .catch((e) => {
    console.error('[create-admin] Erro:', e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });