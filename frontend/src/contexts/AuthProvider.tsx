// frontend/src/contexts/AuthProvider.tsx

import React, { useState, useEffect, ReactNode } from 'react';
import { AuthContext, IUser } from './AuthContext'; // 1. Importa o contexto e a interface IUser
import { login as apiLogin } from '../services/api';

// 2. Define o tipo para as props do componente, esperando 'children'
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // 3. Tipa os estados com a interface IUser ou null/string
  const [usuario, setUsuario] = useState<IUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('usuario');
      const storedToken = localStorage.getItem('token');
      
      if (storedUser && storedToken) {
        // 4. Garante que o objeto parseado seja do tipo IUser
        setUsuario(JSON.parse(storedUser) as IUser);
        setToken(storedToken);
      }
    } catch (error) {
      console.error("Falha ao carregar dados de autenticação do localStorage", error);
      // Limpa o estado em caso de erro de parsing
      setUsuario(null);
      setToken(null);
      localStorage.clear();
    } finally {
      setLoading(false);
    }
  }, []);

  // 5. Adiciona os tipos para os parâmetros da função login
  const login = async (email: string, senha: string): Promise<void> => {
    try {
      const data = await apiLogin(email, senha);
      if (data && data.usuario && data.token) {
        setUsuario(data.usuario);
        setToken(data.token);
        localStorage.setItem('usuario', JSON.stringify(data.usuario));
        localStorage.setItem('token', data.token);
      } else {
        // Lança um erro se a resposta da API for inesperada
        throw new Error('Resposta de login inválida recebida da API.');
      }
    } catch (error) {
      console.error("Erro durante o login:", error);
      // Re-lança o erro para que o componente de login possa tratá-lo
      throw error;
    }
  };

  const logout = (): void => {
    setUsuario(null);
    setToken(null);
    localStorage.removeItem('usuario');
    localStorage.removeItem('token');
  };

  // 6. Monta o objeto de valor que corresponde à interface IAuthContext
  const value = { 
    usuario, 
    token, 
    login, 
    logout, 
    isAuthenticated: !!usuario 
  };

  if (loading) {
    return <div>Carregando autenticação...</div>;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
