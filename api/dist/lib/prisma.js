"use strict";
// api/src/lib/prisma.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
// ======================= INÍCIO DA CORREÇÃO =======================
// Simplificamos a inicialização. O Prisma lerá as configurações de log
// das variáveis de ambiente, se definidas, o que é mais robusto.
exports.prisma = global.prisma || new client_1.PrismaClient();
// ======================= FIM DA CORREÇÃO =======================
if (process.env.NODE_ENV !== 'production') {
    global.prisma = exports.prisma;
}
