// frontend/src/contexts/AuthProvider.tsx

import React, { createContext, useState, useEffect, useCallback, ReactNode, useContext } from 'react';
import { supabase } from '../lib/supabase';
import { offlineSyncService } from '../services/offlineSyncService';
import LoadingOverlay from '../components/LoadingOverlay';
import { api, IUser as ApiUser } from '../services/api'; // Maintain api import for other services if needed, but not for login

// 1. Tipos compartilhados
// Unifica o tipo de usuário com o do serviço de API e permite um alias opcional `role`.
// Nota: Com Supabase, o 'id' do Auth é UUID, mas mantemos o 'id' numérico da tabela 'usuarios' para compatibilidade.
export type IUser = ApiUser & { role?: 'admin' | 'supervisor' | 'user' };

export interface IAuthContext {
  user: IUser | null;
  usuario: IUser | null;
  token: string | null; // Access Token do Supabase
  loading: boolean;
  login(credentials: { email: string; senha: string }): Promise<void>;
  loginWithJwt(token: string): void; // Deprecated/Adapted
  logout(): void;
}

// 2. CRIAÇÃO DO CONTEXTO
export const AuthContext = createContext<IAuthContext>({} as IAuthContext);

// 4. COMPONENTE PROVIDER
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<IUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  // Helper para buscar perfil e atualizar estado
  const fetchProfileAndSetUser = async (sessionUser: any) => {
    try {
      if (!sessionUser?.email) throw new Error('Email não encontrado na sessão.');

      // Busca o usuário na tabela 'usuarios' usando o email
      const { data: profile, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('email', sessionUser.email)
        .single();

      if (error || !profile) {
        console.error('Perfil de usuário não encontrado na tabela usuarios.', error);
        // Fallback or Logout?
        return null;
      }

      // Normaliza profile
      const userProfile: IUser = {
        ...profile,
        role: profile.perfil as IUser['role']
      };

      setUser(userProfile);
      return userProfile;
    } catch (err) {
      console.error('Erro ao buscar perfil:', err);
      return null;
    }
  };

  useEffect(() => {
    // Escuta mudanças na sessão do Supabase (Login, Logout, Refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        setToken(session.access_token);
        // Atualiza header da API legado, caso ainda seja usada
        api.defaults.headers.common['Authorization'] = `Bearer ${session.access_token}`;

        // Se ainda não temos o perfil do usuário carregado, busca agora
        // (Ou sempre busca para garantir dados frescos)
        await fetchProfileAndSetUser(session.user);
      } else {
        setToken(null);
        setUser(null);
        delete api.defaults.headers.common['Authorization'];
      }
      setLoading(false);
      setIsBootstrapping(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = useCallback(async (credentials: { email: string; senha: string }) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.senha,
      });

      if (error) throw error;
      if (!data.session) throw new Error('Sessão não criada.');

      // O onAuthStateChange vai lidar com a atualização do estado, 
      // mas podemos aguardar a busca do perfil aqui se quisermos garantir que 'user' está setado antes de resolver a Promise.
      const profile = await fetchProfileAndSetUser(data.session.user);
      if (!profile) throw new Error('Usuário autenticado, mas perfil não encontrado no sistema.');

    } catch (error: any) {
      console.error('Falha no processo de login Supabase:', error);
      throw new Error(error.message || 'Erro ao realizar login.');
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    offlineSyncService.clearAllPendingLancamentos();
    await supabase.auth.signOut();
    // O onAuthStateChange limpará o estado
    window.location.href = '/login';
  }, []);

  // Mantemos para compatibilidade, mas agora apenas redireciona ou faz nada se não for sessão Supabase
  const loginWithJwt = useCallback((newToken: string) => {
    // No fluxo Supabase, loginWithJwt é menos comum a menos que venha de OAuth manual.
    // Se for necessário, podemos tentar `supabase.auth.setSession(newToken)` se for um refresh token.
    console.warn('loginWithJwt chamado - ignorado em favor do fluxo Supabase ou implemente setSession.');
  }, []);

  return (
    <AuthContext.Provider value={{ user, usuario: user, token, loading, login, loginWithJwt, logout }}>
      {isBootstrapping ? <LoadingOverlay visible text="Iniciando sistema..." /> : children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): IAuthContext => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

