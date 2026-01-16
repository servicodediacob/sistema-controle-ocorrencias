// Caminho: frontend/src/pages/LoginPage.tsx
import { useState, useEffect, ReactElement, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthProvider';
import { authGoogle, solicitarAcessoGoogle, getCidades, ICidade } from '../services/api';
import { useNotification } from '../contexts/NotificationContext';
import { z } from 'zod';
import { isAxiosError } from 'axios';
import { supabase } from '../lib/supabase';
import LoadingOverlay from '../components/LoadingOverlay';

const loginSchema = z.object({
  email: z.string().email({ message: "Por favor, insira um email valido." }),
  senha: z.string().min(6, { message: "A senha deve ter no minimo 6 caracteres." }),
});

type LoginFormInputs = z.infer<typeof loginSchema>;
type FormErrors = { [key in keyof LoginFormInputs]?: string };
const MIN_LOADING_DURATION_MS = 600;

const ensureMinimumLoadingDuration = async (startedAt: number) => {
  const elapsed = Date.now() - startedAt;
  if (elapsed < MIN_LOADING_DURATION_MS) {
    await new Promise(resolve => setTimeout(resolve, MIN_LOADING_DURATION_MS - elapsed));
  }
};

declare global { interface Window { google?: any } }

function LoginPage(): ReactElement {
  const navigate = useNavigate();
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const [formData, setFormData] = useState({ email: '', senha: '' });
  const [errors, setErrors] = useState<FormErrors>({});
  const [apiError, setApiError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { user, login, loginWithJwt, loading: authLoading } = useAuth();
  const { addNotification } = useNotification();
  const [obms, setObms] = useState<ICidade[]>([]);
  const [selectedObm, setSelectedObm] = useState<string>('');
  const [pendingGoogleProfile, setPendingGoogleProfile] = useState<{ nome: string; email: string } | null>(null);
  const isLoading = isSubmitting || authLoading;

  const [showIntro, setShowIntro] = useState(() => !sessionStorage.getItem('loginIntroSeen'));
  const [bgLoaded, setBgLoaded] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.src = '/images/login-blue-hex-bg.svg';
    const done = () => setBgLoaded(true);
    img.onload = done;
    img.onerror = done;
  }, []);

  useEffect(() => {
    if (!showIntro || !bgLoaded) return;
    const t = setTimeout(() => {
      setShowIntro(false);
      sessionStorage.setItem('loginIntroSeen', '1');
    }, 1200);
    return () => clearTimeout(t);
  }, [showIntro, bgLoaded]);

  const readyToShowForm = bgLoaded && !showIntro;
  const uiBlocked = !readyToShowForm || isLoading;
  const [isLeaving, setIsLeaving] = useState(false);

  const navigateWithExit = (to: string) => {
    try { sessionStorage.setItem('systemEnterAnim', '1'); } catch { }
    setIsLeaving(true);
    window.setTimeout(() => navigate(to), 300);
  };

  const animBase = 'transition-all duration-500 ease-out';
  const animHidden = 'opacity-0 translate-y-2';
  const animVisible = 'opacity-100 translate-y-0';
  const hasAttemptedLoginRef = useRef(false);

  useEffect(() => {
    if (user && !authLoading && !isSubmitting && !hasAttemptedLoginRef.current) {
      navigateWithExit('/');
    }
  }, [user, authLoading, isSubmitting, navigate]);

  useEffect(() => {
    if (pendingGoogleProfile && obms.length === 0) {
      getCidades().then(setObms).catch(() => {
        addNotification('Falha ao carregar OBMs. Tente novamente.', 'error');
      });
    }
  }, [pendingGoogleProfile, obms.length, addNotification]);

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

  useEffect(() => { validateForm(); }, [formData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setApiError('');
    if (!validateForm()) return;
    hasAttemptedLoginRef.current = true;
    setIsSubmitting(true);
    const overlayStartedAt = Date.now();
    const finalize = async () => {
      await ensureMinimumLoadingDuration(overlayStartedAt);
      setIsSubmitting(false);
    };
    let shouldResetOverlay = true;
    try {
      await login(formData);
      shouldResetOverlay = false;
      await finalize();
      navigateWithExit('/');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.';
      setApiError(errorMessage);
    } finally {
      if (shouldResetOverlay) {
        await finalize();
      }
    }
  };

  const isFormInvalid = Object.keys(errors).length > 0;

  const handleGoogleSignIn = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          skipBrowserRedirect: false,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      console.error('Erro no login Google:', error);
      addNotification('Erro: ' + (error.message || 'Falha ao iniciar Google Auth'), 'error');
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`login-background flex min-h-screen w-full items-center justify-center px-4 py-8 transition-all duration-300 ${isLeaving ? 'opacity-0 -translate-x-3' : 'opacity-100 translate-x-0'}`}>
      <LoadingOverlay visible={uiBlocked} text={!bgLoaded ? 'Carregando...' : (showIntro ? 'Carregando...' : 'Entrando...')} />
      <div className={`login-card w-full max-w-md rounded-2xl p-8 shadow-[0_20px_60px_rgba(0,0,0,0.6)] mx-auto border border-white/10 transition-all duration-500 ease-out ${!readyToShowForm ? 'opacity-0 translate-y-3 scale-95' : 'opacity-100 translate-y-0 scale-100'}`}>
        <h2 className="mb-6 text-center text-2xl font-medium text-gray-200">Controle de Ocorrencias</h2>
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div className={`${animBase} ${!readyToShowForm ? animHidden : animVisible}`} style={{ transitionDelay: '50ms' }}>
            <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required disabled={uiBlocked} className="w-full rounded-md border border-gray-600 bg-gray-700 p-3 text-white transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-600" />
            <p className="mt-1 min-h-[1.25rem] text-left text-sm text-red-500">{errors.email || ''}</p>
          </div>
          <div className={`${animBase} ${!readyToShowForm ? animHidden : animVisible}`} style={{ transitionDelay: '100ms' }}>
            <input type={showPassword ? 'text' : 'password'} name="senha" placeholder="Senha" value={formData.senha} onChange={handleChange} required disabled={uiBlocked} className="w-full rounded-md border border-gray-600 bg-gray-700 p-3 text-white transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-600" />
            <p className="mt-1 min-h-[1.25rem] text-left text-sm text-red-500">{errors.senha || ''}</p>
          </div>
          <div className={`flex items-center gap-2 self-start ${animBase} ${!readyToShowForm ? animHidden : animVisible}`} style={{ transitionDelay: '150ms' }}>
            <input type="checkbox" id="show-password" checked={showPassword} onChange={() => setShowPassword(!showPassword)} className="h-4 w-4 rounded border-gray-500 bg-gray-700 text-blue-600 focus:ring-blue-500" />
            <label htmlFor="show-password" className="text-sm text-gray-300">Mostrar senha</label>
          </div>
          <button type="submit" disabled={uiBlocked || isFormInvalid} className={`mt-2 flex items-center justify-center rounded-md bg-blue-700 p-3 text-lg font-semibold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-blue-800 disabled:opacity-70 ${animBase} ${!readyToShowForm ? animHidden : animVisible}`} style={{ transitionDelay: '200ms' }}>Entrar</button>
          {apiError && <p className="mt-4 text-center text-sm text-red-500">{apiError}</p>}
        </form>
        <div className="my-6 flex items-center gap-4">
          <hr className="flex-grow border-t border-gray-600" />
          <span className="text-gray-400">OU</span>
          <hr className="flex-grow border-t border-gray-600" />
        </div>
        {import.meta.env.VITE_GOOGLE_CLIENT_ID ? (
          <button type="button" onClick={handleGoogleSignIn} disabled={uiBlocked} className={`mb-4 flex w-full items-center justify-center gap-3 rounded-md bg-white p-3 font-semibold text-gray-900 transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-70 ${animBase} ${!readyToShowForm ? animHidden : animVisible}`} style={{ transitionDelay: '250ms' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 48 48"><g><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path><path fill="none" d="M0 0h48v48H0z"></path></g></svg>
            <span>Entrar com Google</span>
          </button>
        ) : (
          <div className={`mb-4 w-full rounded-md bg-gray-700 p-3 text-center text-sm text-gray-300 ${animBase} ${!readyToShowForm ? animHidden : animVisible}`} style={{ transitionDelay: '250ms' }}>Login com Google indisponivel (GOOGLE_CLIENT_ID nao configurado)</div>
        )}
        <Link to="/solicitar-acesso" className={`block w-full text-center rounded-md bg-gray-600 p-3 font-semibold text-white transition hover:bg-gray-500 ${animBase} ${!readyToShowForm ? animHidden : animVisible}`} style={{ transitionDelay: '300ms' }}>Solicitar Acesso</Link>
      </div>
      {pendingGoogleProfile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-lg bg-gray-800 p-6">
            <h3 className="mb-4 text-lg font-semibold text-white">Selecionar OBM para solicitacao</h3>
            <p className="mb-4 text-sm text-gray-300">{pendingGoogleProfile.nome} ({pendingGoogleProfile.email})</p>
            <select value={selectedObm} onChange={e => setSelectedObm(e.target.value)} className="w-full rounded-md border border-gray-600 bg-gray-700 p-3 text-white">
              <option value="">Selecione sua OBM</option>
              {obms.map(o => <option key={o.id} value={o.id}>{o.cidade_nome}</option>)}
            </select>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setPendingGoogleProfile(null)} className="rounded-md bg-gray-600 px-4 py-2 text-white">Cancelar</button>
              <button onClick={async () => {
                if (!selectedObm) { addNotification('Selecione sua OBM.', 'warning'); return; }
                setIsSubmitting(true);
                try {
                  await solicitarAcessoGoogle({ nome: pendingGoogleProfile.nome, email: pendingGoogleProfile.email, obm_id: Number.parseInt(selectedObm, 10) });
                  addNotification('Solicitacao enviada! Aguarde aprovacao.', 'success');
                  setPendingGoogleProfile(null);
                  setSelectedObm('');
                } catch (error) {
                  if (isAxiosError(error)) {
                    if (error.response?.data?.code === 'SOLICITACAO_EXISTENTE' || error.response?.status === 409) {
                      addNotification('Ja existe um usuario ou solicitacao pendente para este email.', 'warning');
                    } else {
                      addNotification('Falha ao enviar solicitacao. Tente novamente.', 'error');
                    }
                  } else {
                    addNotification('Falha ao enviar solicitacao. Tente novamente.', 'error');
                  }
                } finally { setIsSubmitting(false); }
              }} className="rounded-md bg-teal-600 px-4 py-2 text-white">Enviar Solicitacao</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LoginPage;
