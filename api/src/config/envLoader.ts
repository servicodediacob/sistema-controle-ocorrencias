// Caminho: api/src/config/envLoader.ts
import dotenv from 'dotenv';
import path from 'path';

// Determina qual arquivo .env carregar com base no comando executado
const envFile = process.env.NODE_ENV === 'test' 
    ? '.env.test' 
    : '.env.development';

const envPath = path.resolve(process.cwd(), envFile);

const result = dotenv.config({ path: envPath });

if (result.error) {
    // Não lança erro se o arquivo não existir, mas avisa.
    // Isso permite que o app funcione em ambientes de produção que usam variáveis de ambiente do sistema.
    console.warn(`[EnvLoader] Aviso: Não foi possível carregar o arquivo de ambiente: ${envPath}`);
} else {
    console.log(`[EnvLoader] Variáveis de ambiente carregadas de: ${envPath}`);
}
