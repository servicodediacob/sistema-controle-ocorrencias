
import { createClient } from '@supabase/supabase-js';

// Essas variáveis DEVEM estar definidas no .env (Vite requer prefixo VITE_)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    // Em dev, podemos apenas logar. Em prod, talvez lançar erro.
    console.error('Supabase URL ou Key não definidas nas variáveis de ambiente.');
}

// Criação do cliente único - configuração balanceada para OAuth funcionar
export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
    auth: {
        persistSession: true,
        storage: window.localStorage,
        autoRefreshToken: true, // Necessário para renovar token automaticamente
        detectSessionInUrl: true // Necessário para OAuth (Google login) funcionar
    }
});

