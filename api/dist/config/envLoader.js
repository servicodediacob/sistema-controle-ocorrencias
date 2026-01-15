"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// api/src/config/envLoader.ts
const fs_1 = __importDefault(require("fs"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Resolve o arquivo .env apropriado de forma resiliente ao diretório atual.
// Em monorepos é comum iniciar a API a partir do diretório raiz, então
// tentamos múltiplos caminhos possíveis até encontrar um arquivo existente.
const envFile = process.env.NODE_ENV === 'test'
    ? '.env.test'
    : process.env.NODE_ENV === 'production'
        ? '.env.production'
        : '.env.development';
const candidates = [
    // 1) Diretório atual do processo (padrão quando roda dentro de api/)
    path_1.default.resolve(process.cwd(), envFile),
    // 2) Pasta raiz do pacote "api" baseada no local deste arquivo (src/config)
    path_1.default.resolve(__dirname, '../../', envFile),
    // 3) Caso o processo seja iniciado no monorepo (raiz), procure em "api/"
    path_1.default.resolve(process.cwd(), 'api', envFile),
];
const chosenPath = candidates.find((p) => fs_1.default.existsSync(p));
if (chosenPath) {
    const shouldOverride = process.env.NODE_ENV !== 'production';
    const result = dotenv_1.default.config({ path: chosenPath, override: shouldOverride });
    if (result.error) {
        console.warn(`[EnvLoader] Aviso: falha ao carregar ${chosenPath}. Variáveis de ambiente do sistema serão usadas.`);
    }
    else {
        console.log(`[EnvLoader] Variáveis de ambiente carregadas de: ${chosenPath}`);
    }
}
else {
    console.warn(`[EnvLoader] Aviso: nenhum arquivo ${envFile} encontrado nos caminhos esperados: ${candidates.join(', ')}. Variáveis de ambiente do sistema serão usadas.`);
}
