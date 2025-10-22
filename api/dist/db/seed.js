"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedProductionAdmin = seedProductionAdmin;
// api/src/db/seed.ts
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const db_1 = __importDefault(require("../db")); // <-- CORRIGIDO
require("../config/envLoader"); // <-- CORRIGIDO
const logger_1 = __importDefault(require("../config/logger")); // <-- CORRIGIDO
async function seedProductionAdmin() {
    // ... (o resto da função permanece igual)
    logger_1.default.info('--- INICIANDO SCRIPT DE SEED PARA USUÁRIO ADMIN ---');
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminEmail || !adminPassword) {
        const errorMsg = '[SEED] ERRO: As variáveis de ambiente ADMIN_EMAIL e ADMIN_PASSWORD são obrigatórias.';
        logger_1.default.error(errorMsg);
        throw new Error(errorMsg);
    }
    const client = await db_1.default.pool.connect();
    logger_1.default.info('🔌 Conexão com o banco de dados estabelecida.');
    try {
        const userExists = await client.query('SELECT id FROM usuarios WHERE email = $1', [adminEmail]);
        if (userExists.rows.length > 0) {
            logger_1.default.warn(`[SEED] Usuário com email "${adminEmail}" já existe. Nenhuma ação foi tomada.`);
            return { message: `Usuário ${adminEmail} já existe.` };
        }
        logger_1.default.info(`Criando usuário administrador para: ${adminEmail}`);
        const salt = await bcryptjs_1.default.genSalt(10);
        const senha_hash = await bcryptjs_1.default.hash(adminPassword, salt);
        await client.query(`INSERT INTO usuarios (nome, email, senha_hash, role, obm_id) VALUES ($1, $2, $3, 'admin', NULL)`, ['Administrador Principal', adminEmail, senha_hash]);
        logger_1.default.info('✅ USUÁRIO ADMINISTRADOR CRIADO COM SUCESSO!');
        return { message: 'Usuário administrador criado com sucesso!' };
    }
    catch (error) {
        logger_1.default.error({ err: error }, '[SEED] Erro ao criar usuário administrador.');
        throw error;
    }
    finally {
        await client.release();
        logger_1.default.info('🔌 Conexão com o banco de dados liberada.');
    }
}
if (require.main === module) {
    seedProductionAdmin()
        .then(() => {
        logger_1.default.info('Script de seed finalizado.');
        process.exit(0);
    })
        .catch(() => {
        logger_1.default.error('Script de seed encontrou um erro e foi encerrado.');
        process.exit(1);
    });
}
