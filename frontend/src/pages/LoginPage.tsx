// Caminho: frontend/src/pages/LoginPage.tsx

import { useState, useEffect, ReactElement } from 'react';
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

  const handleGoogleSignIn = async () => {
    try {
      // Garante que o script do Google Identity Services esteja carregado
      if (!window.google) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://accounts.google.com/gsi/client';
          script.async = true;
          script.defer = true;
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('Falha ao carregar o script do Google Identity.'));
          document.head.appendChild(script);
        });
      }

      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      if (!clientId) {
        console.error('VITE_GOOGLE_CLIENT_ID não está definida. O login com Google não funcionará.');
        addNotification('O login com Google não está configurado.', 'error');
        return;
      }

      // Inicializa o cliente
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response: any) => {
          try {
            const result = await authGoogle(response.credential);
            if (result.token) {
              loginWithJwt(result.token);
              navigate('/'); // Redireciona após o login
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

      // Exibe o pop-up de login e trata o erro de cancelamento
      window.google.accounts.id.prompt((notification: any) => {
        // A documentação da GSI sugere que podemos verificar 'isNotDisplayed' ou 'isSkipped'.
        // No entanto, o erro AbortError é mais comum quando o usuário fecha manualmente.
        // O try/catch abaixo lida com isso de forma mais robusta.
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
           // Opcional: logar se o prompt não foi exibido por algum motivo (ex: bloqueador de pop-up)
           console.info('Google Sign-In prompt não foi exibido ou foi ignorado.');
        }
      });

    } catch (error: any) {
      // Esta é a parte crucial: capturar e identificar o AbortError.
      if (error.name === 'AbortError') {
        // O usuário cancelou o login. Isso é esperado.
        // Você pode logar para depuração ou simplesmente ignorar.
        console.log('Login com Google cancelado pelo usuário.');
      } else {
        // Trata outros erros inesperados durante a inicialização ou chamada do prompt.
        console.error('Erro inesperado durante o Google Sign-In:', error);
        addNotification('Ocorreu um erro ao tentar o login com Google.', 'error');
      }
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
          <button onClick={handleGoogleSignIn} className="mb-4 w-full rounded-md bg-white p-3 font-semibold text-gray-900 transition hover:bg-gray-100">
            Continuar com Google
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
