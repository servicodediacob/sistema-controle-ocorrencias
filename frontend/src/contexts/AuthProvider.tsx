// frontend/src/contexts/AuthProvider.tsx

import React, { createContext, useState, useEffect, useCallback, ReactNode, useContext } from 'react';
import { supabase } from '../lib/supabase';
import { offlineSyncService } from '../services/offlineSyncService';
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
  loginWithGoogle(): Promise<void>;
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
  const persistAuthError = (message: string) => {
    try {
      sessionStorage.setItem('authError', message);
    } catch (e) {
      console.warn('[AuthProvider] Falha ao persistir erro de auth:', e);
    }
  };

  const queryUserProfile = async (email: string, timeoutMs: number) => {
    const queryPromise = supabase
      .from('usuarios')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`TIMEOUT_${timeoutMs}`)), timeoutMs)
    );

    return await Promise.race([queryPromise, timeoutPromise]) as any;
  };

  const getCachedProfile = (email: string): IUser | null => {
    try {
      const raw = localStorage.getItem('lastProfile');
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed?.email && parsed.email === email) {
        return parsed as IUser;
      }
    } catch (e) {
      console.warn('[AuthProvider] Falha ao ler cache de perfil:', e);
    }
    return null;
  };

  const setCachedProfile = (profile: IUser) => {
    try {
      localStorage.setItem('lastProfile', JSON.stringify(profile));
    } catch (e) {
      console.warn('[AuthProvider] Falha ao salvar cache de perfil:', e);
    }
  };

  const buildFallbackProfile = (sessionUser: any): IUser => {
    const email = sessionUser?.email || '';
    const nome = sessionUser?.user_metadata?.nome ||
      sessionUser?.user_metadata?.name ||
      sessionUser?.user_metadata?.full_name ||
      email.split('@')[0] ||
      'Usuario';

    return {
      id: -1,
      nome,
      email,
      perfil: 'user',
      role: 'user',
      obm_id: null
    };
  };


  // Helper para buscar perfil e atualizar estado
  const fetchProfileAndSetUser = async (sessionUser: any): Promise<IUser | null> => {
    try {
      console.log('[AuthProvider] fetchProfileAndSetUser - email:', sessionUser?.email);
      if (!sessionUser?.email) {
        setUser(null);
        return null;
      }

      // Busca o usuário na tabela 'usuarios' usando o email
      console.log('[AuthProvider] Consultando tabela usuarios...');

      // Query com timeout e retry simples (evita falha em cold start)
      const timeouts = [10000, 20000];
      let profile: any = null;
      let error: any = null;

      for (let i = 0; i < timeouts.length; i++) {
        try {
          const result = await queryUserProfile(sessionUser.email, timeouts[i]);
          profile = result?.data || null;
          error = result?.error || null;
          break;
        } catch (err: any) {
          error = err;
          if (err?.message?.includes('TIMEOUT') && i < timeouts.length - 1) {
            console.warn(`[AuthProvider] Timeout (${timeouts[i]}ms). Tentando novamente...`);
            continue;
          }
          break;
        }
      }

      console.log('[AuthProvider] Resultado da consulta:', { hasProfile: !!profile, error: error?.message || null });

      if (error) {
        console.error('[AuthProvider] Erro ao buscar perfil:', error.message);

        // Se for timeout, limpar sessão completamente
        if (error.message?.includes('TIMEOUT')) {
          const cached = getCachedProfile(sessionUser.email);
          if (cached) {
            console.warn('[AuthProvider] Usando perfil em cache por timeout.');
            setUser(cached);
            return cached;
          }
          const fallback = buildFallbackProfile(sessionUser);
          console.warn('[AuthProvider] Perfil fallback usado por timeout.');
          setUser(fallback);
          persistAuthError('Perfil nao carregado. Usando dados basicos (timeout).');
          return fallback;
        }

        if (!error.message?.includes('TIMEOUT')) {
          persistAuthError('Falha ao carregar seu perfil. Tente novamente.');
        }

        setUser(null);
        return null;
      }

      if (!profile) {
        console.warn('[AuthProvider] Perfil não encontrado para:', sessionUser.email);
        setUser(null);

        try {
          const nome =
            sessionUser?.user_metadata?.nome ||
            sessionUser?.user_metadata?.name ||
            sessionUser?.user_metadata?.full_name ||
            sessionUser?.email?.split('@')[0] ||
            '';
          sessionStorage.setItem('oauthPrefill', JSON.stringify({
            nome,
            email: sessionUser.email || ''
          }));
        } catch (e) {
          console.warn('[AuthProvider] Falha ao salvar prefill OAuth:', e);
        }

        // Limpa sessão e direciona para solicitação de acesso
        try {
          await supabase.auth.signOut();
          const keysToRemove = Object.keys(localStorage).filter(key =>
            key.includes('supabase')
          );
          keysToRemove.forEach(key => localStorage.removeItem(key));
        } catch (e) {
          console.error('[AuthProvider] Erro ao encerrar sessão após OAuth:', e);
        }

        window.location.href = '/solicitar-acesso?oauth=google';
        return null;
      }

      // Normaliza profile
      const userProfile: IUser = {
        ...profile,
        role: profile.perfil as IUser['role']
      };

      console.log('[AuthProvider] setUser com perfil:', userProfile.email, 'perfil:', userProfile.perfil);
      setUser(userProfile);
      setCachedProfile(userProfile);
      return userProfile;
    } catch (err: any) {
      console.error('[AuthProvider] Erro ao buscar perfil:', err?.message || err);

      // Se for timeout, limpar sessão completamente
      if (err?.message?.includes('TIMEOUT')) {
        const cached = sessionUser?.email ? getCachedProfile(sessionUser.email) : null;
        if (cached) {
          console.warn('[AuthProvider] Usando perfil em cache por timeout (catch).');
          setUser(cached);
          return cached;
        }
        const fallback = buildFallbackProfile(sessionUser);
        console.warn('[AuthProvider] Perfil fallback usado por timeout (catch).');
        setUser(fallback);
        persistAuthError('Perfil nao carregado. Usando dados basicos (timeout).');
        return fallback;
      }

      if (!err?.message?.includes('TIMEOUT')) {
        persistAuthError('Falha ao carregar seu perfil. Tente novamente.');
      }

      setUser(null);
      return null;
    }
  };

  useEffect(() => {
    let didCancel = false;

    // onAuthStateChange vai lidar com a recuperação real da sessão
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (didCancel) return;

      console.log('[AuthProvider] onAuthStateChange event:', _event, 'session:', session ? 'presente' : 'ausente');

      if (session) {
        setToken(session.access_token);
        api.defaults.headers.common['Authorization'] = `Bearer ${session.access_token}`;
        // Limpa o hash do OAuth para evitar reprocessamento em reloads
        if (window.location.hash && window.location.hash.includes('access_token=')) {
          history.replaceState(null, document.title, window.location.pathname + window.location.search);
        }
        if (session.user?.email) {
          const cached = getCachedProfile(session.user.email);
          if (cached) {
            setUser(cached);
          } else {
            setUser(buildFallbackProfile(session.user));
          }
        }
        fetchProfileAndSetUser(session.user);
      } else {
        setToken(null);
        setUser(null);
        delete api.defaults.headers.common['Authorization'];
      }
      setLoading(false);
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

  const loginWithGoogle = useCallback(async () => {
    setLoading(true);
    console.log('[AuthProvider] Iniciando login com Google...');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });

      if (error) throw error;

      console.log('[AuthProvider] Redirecionando para Google OAuth...');
      // O redirecionamento acontece automaticamente
      // Quando o usuário retornar, onAuthStateChange será chamado
    } catch (error: any) {
      console.error('[AuthProvider] Falha no login com Google:', error);
      setLoading(false);
      throw new Error(error.message || 'Erro ao realizar login com Google.');
    }
  }, []);

  const logout = useCallback(async () => {
    offlineSyncService.clearAllPendingLancamentos();
    await supabase.auth.signOut();
    // O onAuthStateChange limpará o estado
    window.location.href = '/login';
  }, []);

  // Mantemos para compatibilidade, mas agora apenas redireciona ou faz nada se não for sessão Supabase
  const loginWithJwt = useCallback((_token: string) => {
    // No fluxo Supabase, loginWithJwt é menos comum a menos que venha de OAuth manual.
    // Se for necessário, podemos tentar `supabase.auth.setSession(newToken)` se for um refresh token.
    console.warn('loginWithJwt chamado - ignorado em favor do fluxo Supabase ou implemente setSession.');
  }, []);

  return (
    <AuthContext.Provider value={{ user, usuario: user, token, loading, login, loginWithGoogle, loginWithJwt, logout }}>
      {children}
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
