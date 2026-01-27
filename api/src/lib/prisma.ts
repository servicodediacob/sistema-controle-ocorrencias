// api/src/lib/prisma.ts

import '../config/envLoader';
import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// ======================= INÍCIO DA CORREÇÃO =======================
// Simplificamos a inicialização. O Prisma lerá as configurações de log
// das variáveis de ambiente, se definidas, o que é mais robusto.
export const prisma = global.prisma || new PrismaClient();
// ======================= FIM DA CORREÇÃO =======================

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}
