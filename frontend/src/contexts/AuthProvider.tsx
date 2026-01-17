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
  const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // Helper para buscar perfil e atualizar estado
  const fetchProfileAndSetUser = async (sessionUser: any) => {
    try {
      console.log('[AuthProvider] fetchProfileAndSetUser - email:', sessionUser?.email);
      if (!sessionUser?.email) {
        setUser(null);
        return null;
      }

      // Busca o usuário na tabela 'usuarios' usando o email
      console.log('[AuthProvider] Consultando tabela usuarios...');

      // Query direta sem timeout - deixa o Supabase gerenciar
      const { data: profile, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('email', sessionUser.email)
        .maybeSingle(); // Usa maybeSingle para não dar erro se não encontrar

      console.log('[AuthProvider] Resultado da consulta:', { hasProfile: !!profile, error: error?.message || null });

      if (error) {
        console.error('[AuthProvider] Erro ao buscar perfil:', error.message);
        setUser(null);
        return null;
      }

      if (!profile) {
        console.warn('[AuthProvider] Perfil não encontrado para:', sessionUser.email);
        setUser(null);
        return null;
      }

      // Normaliza profile
      const userProfile: IUser = {
        ...profile,
        role: profile.perfil as IUser['role']
      };

      console.log('[AuthProvider] setUser com perfil:', userProfile.email, 'perfil:', userProfile.perfil);
      setUser(userProfile);
      return userProfile;
    } catch (err: any) {
      console.error('[AuthProvider] Erro ao buscar perfil:', err?.message || err);
      setUser(null);
      return null;
    }
  };

  useEffect(() => {
    let didCancel = false;

    // Verifica sessão inicial imediatamente (sem timeout de segurança)
    const checkInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (didCancel) return;

        if (session) {
          setToken(session.access_token);
          api.defaults.headers.common['Authorization'] = `Bearer ${session.access_token}`;
          // Não deixar a tela travar se a consulta demorar: seguimos depois de 8s
          await Promise.race([
            fetchProfileAndSetUser(session.user),
            wait(8000)
          ]);
        } else {
          setToken(null);
          setUser(null);
          delete api.defaults.headers.common['Authorization'];
        }
      } catch (error) {
        console.error('[AuthProvider] Erro ao verificar sessão inicial:', error);
      } finally {
        if (!didCancel) {
          setLoading(false);
          setIsBootstrapping(false);
        }
      }
    };

    checkInitialSession();

    // Escuta mudanças na sessão do Supabase (Login, Logout, Refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (didCancel) return;

      if (session) {
        setToken(session.access_token);
        api.defaults.headers.common['Authorization'] = `Bearer ${session.access_token}`;
        await Promise.race([
          fetchProfileAndSetUser(session.user),
          wait(8000)
        ]);
      } else {
        setToken(null);
        setUser(null);
        delete api.defaults.headers.common['Authorization'];
      }
      setLoading(false);
      setIsBootstrapping(false);
    });

    return () => {
      didCancel = true;
      subscription.unsubscribe();
    };
  }, []);

  const login = useCallback(async (credentials: { email: string; senha: string }) => {
    setLoading(true);
    console.log('[AuthProvider] Iniciando login para:', credentials.email);
    try {
      console.log('[AuthProvider] Chamando signInWithPassword...');
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.senha,
      });

      console.log('[AuthProvider] Resposta do Supabase:', { hasData: !!data, hasError: !!error });
      if (error) throw error;
      if (!data.session) throw new Error('Sessão não criada.');

      console.log('[AuthProvider] Buscando perfil do usuário...');
      // O onAuthStateChange vai lidar com a atualização do estado, 
      // mas podemos aguardar a busca do perfil aqui se quisermos garantir que 'user' está setado antes de resolver a Promise.
      const profile = await fetchProfileAndSetUser(data.session.user);
      console.log('[AuthProvider] Perfil encontrado:', !!profile);
      if (!profile) throw new Error('Usuário autenticado, mas perfil não encontrado no sistema.');

      console.log('[AuthProvider] Login concluído com sucesso!');
    } catch (error: any) {
      console.error('[AuthProvider] Falha no processo de login:', error);
      throw new Error(error.message || 'Erro ao realizar login.');
    } finally {
      console.log('[AuthProvider] Finalizando login, setLoading(false)');
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
