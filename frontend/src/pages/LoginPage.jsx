// frontend/src/pages/LoginPage.jsx

import React, { useState } from 'react';
import { useAuth } from '../contexts/useAuth.js';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState('');

  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      // A função login do contexto é chamada.
      // Se for bem-sucedida, o estado 'isAuthenticated' mudará,
      // e o componente App.jsx cuidará do redirecionamento.
      await login(email, senha);

    } catch (err) {
      console.error('Falha no login:', err);
      // Exibe a mensagem de erro vinda da API ou uma mensagem padrão.
      setError(err.message || 'Falha ao tentar fazer login. Verifique suas credenciais.');
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '300px' }}>
        <h2>Login - Controle de Ocorrências</h2>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ padding: '0.5rem' }}
        />
        <input
          type="password"
          placeholder="Senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          required
          style={{ padding: '0.5rem' }}
        />
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" style={{ padding: '0.75rem', cursor: 'pointer' }}>
          Entrar
        </button>
      </form>
    </div>
  );
}

export default LoginPage;
