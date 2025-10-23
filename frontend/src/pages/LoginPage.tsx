// Caminho: frontend/src/pages/LoginPage.tsx

import { useState, useEffect, ReactElement, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthProvider';
import { authGoogle, solicitarAcessoGoogle, getCidades, ICidade } from '../services/api';
import { useNotification } from '../contexts/NotificationContext';
import { z } from 'zod';

// Esquema de validação com Zod (sem alterações)
const loginSchema = z.object({
  email: z.string().email({ message: "Por favor, insira um email válido." }),
  senha: z.string().min(6, { message: "A senha deve ter no mínimo 6 caracteres." }),
});

type LoginFormInputs = z.infer<typeof loginSchema>;
type FormErrors = { [key in keyof LoginFormInputs]?: string };

// Componente Spinner (sem alterações)
const Spinner = (): ReactElement => (
  <div
    className="h-5 w-5 animate-spin rounded-full border-4 border-white/30 border-t-white"
    role="status"
    aria-label="Carregando..."
  />
);

declare global { interface Window { google?: any } }

function LoginPage(): ReactElement {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    senha: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { user, login, loginWithJwt } = useAuth();
  const { addNotification } = useNotification();
  const [obms, setObms] = useState<ICidade[]>([]);
  const [selectedObm, setSelectedObm] = useState<string>('');
  const [pendingGoogleProfile, setPendingGoogleProfile] = useState<{ nome: string; email: string } | null>(null);
  // Se já estiver autenticado, redireciona para a home
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user]);
  // Carrega OBMs apenas quando o modal for aberto (evita 401 na tela pública)
  useEffect(() => {
    if (pendingGoogleProfile && obms.length === 0) {
      getCidades().then(setObms).catch(() => {
        addNotification('Falha ao carregar OBMs. Tente novamente.', 'error');
      });
    }
  }, [pendingGoogleProfile]);

  const validateForm = () => {
    const result = loginSchema.safeParse(formData);
    if (!result.success) {
      const newErrors: FormErrors = {};
      for (const issue of result.error.issues) {
        newErrors[issue.path[0] as keyof LoginFormInputs] = issue.message;
      }
      setErrors(newErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  useEffect(() => {
    validateForm();
  }, [formData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setApiError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // ======================= MODO DE DIAGNÓSTICO E CORREÇÃO =======================
      // 1. Código de Diagnóstico: Mostra os dados que estão sendo enviados.
      console.log('[DIAGNÓSTICO | LoginPage] 1. Dados coletados do formulário:', formData);

      // 2. Correção: A função 'login' é chamada com UM único objeto 'formData'.
      await login(formData);
      // Redireciona após login bem-sucedido
      navigate('/');
      // ==========================================================================

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.';
      setApiError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const isFormInvalid = Object.keys(errors).length > 0;

  const isSignInInProgress = useRef(false);

  // Efeito para inicializar o Google Sign-In de forma segura
  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      console.error('VITE_GOOGLE_CLIENT_ID não está definida. O login com Google não funcionará.');
      return;
    }

    const initializeGsi = () => {
      if (!window.google) {
        console.error("Objeto 'google' não encontrado no window.");
        return;
      }

      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response: any) => {
            isSignInInProgress.current = false;
            try {
              const result = await authGoogle(response.credential);
              if (result.token) {
                loginWithJwt(result.token);
                navigate('/');
              } else if (result.needsApproval && result.profile) {
                setPendingGoogleProfile(result.profile);
              } else {
                addNotification('Falha no login com Google. Tente novamente.', 'error');
              }
            } catch (error) {
              console.error("Erro na autenticação com o backend:", error);
              addNotification('Falha na verificação com o servidor.', 'error');
            }
          },
        });
      } catch (error) {
        console.error("Falha ao inicializar o Google Sign-In:", error);
        addNotification('Não foi possível iniciar o serviço de login do Google.', 'error');
      }
    };

    if (!document.querySelector('script[src="https://accounts.google.com/gsi/client"]')) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initializeGsi;
      script.onerror = () => {
        addNotification('Falha ao carregar script do Google. Tente recarregar a página.', 'error');
      };
      document.head.appendChild(script);
    } else {
      initializeGsi();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGoogleSignIn = () => {
    console.log('1. handleGoogleSignIn foi chamado.');

    if (isSignInInProgress.current) {
      console.log('2. Bloqueado: login já em andamento.');
      return;
    }
    if (!window.google?.accounts?.id) {
      console.error('3. Erro: window.google.accounts.id não existe. GSI não foi inicializado corretamente.');
      addNotification('Serviço de login não está pronto. Tente novamente em um instante.', 'warning');
      return;
    }

    isSignInInProgress.current = true;
    console.log('4. Tentando chamar o prompt do Google...');

    try {
      window.google.accounts.id.prompt((notification: any) => {
        console.log('Callback do prompt recebido:', notification);
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          isSignInInProgress.current = false;
        }
      });
    } catch (error) {
      isSignInInProgress.current = false;
      console.error("5. Erro ao chamar o prompt:", error);
    }
  };

  // --- O SEU LAYOUT JSX PERMANECE 100% IDÊNTICO ---
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900 p-4">
      <div className="w-full max-w-sm rounded-lg bg-gray-800 p-8 shadow-lg">
        <h2 className="mb-6 text-center text-2xl font-medium text-gray-200">
          Controle de Ocorrências
        </h2>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <input
              type="email" name="email" placeholder="Email"
              value={formData.email} onChange={handleChange} required disabled={loading}
              className="w-full rounded-md border border-gray-600 bg-gray-700 p-3 text-white transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-600"
            />
            <p className="mt-1 min-h-[1.25rem] text-left text-sm text-red-500">{errors.email || ''}</p>
          </div>

          <div>
            <input
              type={showPassword ? 'text' : 'password'} 
              name="senha" placeholder="Senha"
              value={formData.senha} onChange={handleChange} required disabled={loading}
              className="w-full rounded-md border border-gray-600 bg-gray-700 p-3 text-white transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-600"
            />
            <p className="mt-1 min-h-[1.25rem] text-left text-sm text-red-500">{errors.senha || ''}</p>
          </div>

          <div className="flex items-center gap-2 self-start">
            <input
              type="checkbox"
              id="show-password"
              checked={showPassword}
              onChange={() => setShowPassword(!showPassword)}
              className="h-4 w-4 rounded border-gray-500 bg-gray-700 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="show-password" className="text-sm text-gray-300">
              Mostrar senha
            </label>
          </div>

          <button
            type="submit" disabled={loading || isFormInvalid}
            className="mt-2 flex items-center justify-center rounded-md bg-blue-700 p-3 text-lg font-semibold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-blue-800 disabled:opacity-70"
          >
            {loading ? <><Spinner /><span className="ml-2">Entrando...</span></> : 'Entrar'}
          </button>

          {apiError && <p className="mt-4 text-center text-sm text-red-500">{apiError}</p>}
        </form>

        <div className="my-6 flex items-center gap-4">
          <hr className="flex-grow border-t border-gray-600" />
          <span className="text-gray-400">OU</span>
          <hr className="flex-grow border-t border-gray-600" />
        </div>

        {import.meta.env.VITE_GOOGLE_CLIENT_ID ? (
          <button onClick={handleGoogleSignIn} className="mb-4 flex w-full items-center justify-center gap-3 rounded-md bg-white p-3 font-semibold text-gray-900 transition hover:bg-gray-100">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 48 48"><g><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path><path fill="none" d="M0 0h48v48H0z"></path></g></svg>
            <span>Entrar com Google</span>
          </button>
        ) : (
          <div className="mb-4 w-full rounded-md bg-gray-700 p-3 text-center text-sm text-gray-300">
            Login com Google indisponível (GOOGLE_CLIENT_ID não configurado)
          </div>
        )}

        <Link
          to="/solicitar-acesso"
          className="block w-full text-center rounded-md bg-gray-600 p-3 font-semibold text-white transition hover:bg-gray-500"
        >
          Solicitar Acesso
        </Link>
      </div>

      {pendingGoogleProfile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-lg bg-gray-800 p-6">
            <h3 className="mb-4 text-lg font-semibold text-white">Selecionar OBM para solicitação</h3>
            <p className="mb-4 text-sm text-gray-300">{pendingGoogleProfile.nome} ({pendingGoogleProfile.email})</p>
            <select value={selectedObm} onChange={e=>setSelectedObm(e.target.value)} className="w-full rounded-md border border-gray-600 bg-gray-700 p-3 text-white">
              <option value="">Selecione sua OBM</option>
              {obms.map(o => <option key={o.id} value={o.id}>{o.cidade_nome}</option>)}
            </select>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={()=>setPendingGoogleProfile(null)} className="rounded-md bg-gray-600 px-4 py-2 text-white">Cancelar</button>
              <button onClick={async ()=>{
                if(!selectedObm){ addNotification('Selecione sua OBM.', 'warning'); return; }
                try{
                  await solicitarAcessoGoogle({ nome: pendingGoogleProfile.nome, email: pendingGoogleProfile.email, obm_id: parseInt(selectedObm) });
                  addNotification('Solicitação enviada! Aguarde aprovação.', 'success');
                  setPendingGoogleProfile(null);
                }catch(e){ addNotification('Falha ao enviar solicitação.', 'error'); }
              }} className="rounded-md bg-teal-600 px-4 py-2 text-white">Enviar Solicitação</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LoginPage;