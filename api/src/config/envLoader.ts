import dotenv from 'dotenv';
import path from 'path';

// Determina qual arquivo .env carregar com base no ambiente NODE_ENV
const envFile = process.env.NODE_ENV === 'test' 
    ? '.env.test' 
    : process.env.NODE_ENV === 'production'
    ? '.env.production'
    : '.env.development';

const envPath = path.resolve(process.cwd(), envFile);

const result = dotenv.config({ path: envPath });

if (result.error) {
    // Não lança erro se o arquivo não existir, mas avisa no console.
    // Isso é útil para ambientes de produção que injetam as variáveis diretamente.
    console.warn(`[EnvLoader] Aviso: Não foi possível carregar o arquivo de ambiente: ${envPath}. As variáveis de ambiente do sistema serão usadas.`);
} else {
    console.log(`[EnvLoader] Variáveis de ambiente carregadas de: ${envPath}`);
}
