"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Determina qual arquivo .env carregar com base no ambiente NODE_ENV
const envFile = process.env.NODE_ENV === 'test'
    ? '.env.test'
    : process.env.NODE_ENV === 'production'
        ? '.env.production'
        : '.env.development';
const envPath = path_1.default.resolve(process.cwd(), envFile);
const result = dotenv_1.default.config({ path: envPath });
if (result.error) {
    // Não lança erro se o arquivo não existir, mas avisa no console.
    // Isso é útil para ambientes de produção que injetam as variáveis diretamente.
    console.warn(`[EnvLoader] Aviso: Não foi possível carregar o arquivo de ambiente: ${envPath}. As variáveis de ambiente do sistema serão usadas.`);
}
else {
    console.log(`[EnvLoader] Variáveis de ambiente carregadas de: ${envPath}`);
}
