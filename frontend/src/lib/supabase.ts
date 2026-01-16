
import { createClient } from '@supabase/supabase-js';

// Essas variáveis DEVEM estar definidas no .env (Vite requer prefixo VITE_)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    // Em dev, podemos apenas logar. Em prod, talvez lançar erro.
    console.error('Supabase URL ou Key não definidas nas variáveis de ambiente.');
}

// Criação do cliente único
// "persistSession: true" é o padrão, usa localStorage para manter o usuário logado
export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');
