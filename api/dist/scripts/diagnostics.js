"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("../config/envLoader");
const db_1 = __importDefault(require("../db"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
async function runDiagnostics() {
    console.log('--- INICIANDO DIAGNÓSTICO DO AMBIENTE ---');
    let hasError = false;
    try {
        const timeResult = await db_1.default.query('SELECT NOW()');
        console.log('✅ [DB] Conexão com o banco de dados bem-sucedida.');
        console.log(`   - Horário do Servidor de DB: ${timeResult.rows[0].now}`);
    }
    catch (error) {
        console.error('❌ [DB] FALHA na conexão com o banco de dados.');
        console.error(`   - Erro: ${error.message}`);
        hasError = true;
    }
    const jwtSecret = process.env.JWT_SECRET;
    if (jwtSecret && jwtSecret.length > 10) {
        console.log('✅ [ENV] Variável JWT_SECRET está presente e tem um tamanho razoável.');
        try {
            const testPayload = { id: 1, role: 'admin' };
            const token = jsonwebtoken_1.default.sign(testPayload, jwtSecret, { expiresIn: '1s' });
            jsonwebtoken_1.default.verify(token, jwtSecret);
            console.log('✅ [JWT] Geração e verificação de token funcionando corretamente.');
        }
        catch (error) {
            console.error('❌ [JWT] FALHA ao gerar ou verificar token JWT.');
            console.error(`   - Erro: ${error.message}`);
            hasError = true;
        }
    }
    else {
        console.error('❌ [ENV] FALHA: A variável JWT_SECRET não está definida ou é muito curta.');
        hasError = true;
    }
    console.log('--- DIAGNÓSTICO CONCLUÍDO ---');
    if (hasError) {
        console.error('\n🔴 O diagnóstico encontrou um ou mais erros críticos. O deploy pode falhar.');
        process.exit(1);
    }
    else {
        console.log('\n🟢 Diagnóstico concluído com sucesso. O ambiente parece saudável.');
        process.exit(0);
    }
}
runDiagnostics();
