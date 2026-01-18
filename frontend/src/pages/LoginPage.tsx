// Caminho: frontend/src/pages/LoginPage.tsx
import { useState, useEffect, ReactElement, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthProvider';
import { useNotification } from '../contexts/NotificationContext';
import { z } from 'zod';
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
  const [formData, setFormData] = useState({ email: '', senha: '' });
  const [errors, setErrors] = useState<FormErrors>({});
  const [apiError, setApiError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { user, login, loginWithGoogle, loading: authLoading } = useAuth();
  const { addNotification } = useNotification();
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

  const handleGoogleLogin = async (): Promise<void> => {
    setApiError('');
    hasAttemptedLoginRef.current = true;
    try {
      await loginWithGoogle();
      // O redirecionamento para o Google acontece automaticamente
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao iniciar login com Google.';
      setApiError(errorMessage);
      addNotification(errorMessage, 'error');
    }
  };

  const isFormInvalid = Object.keys(errors).length > 0;



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

          {/* Divisor "OU" */}
          <div className={`flex items-center gap-3 my-4 ${animBase} ${!readyToShowForm ? animHidden : animVisible}`} style={{ transitionDelay: '250ms' }}>
            <div className="flex-1 h-px bg-gray-600"></div>
            <span className="text-sm text-gray-400 font-medium">OU</span>
            <div className="flex-1 h-px bg-gray-600"></div>
          </div>

          {/* Botão Google Sign-In */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={uiBlocked}
            className={`flex items-center justify-center gap-3 rounded-md bg-white p-3 text-gray-800 font-semibold transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-70 ${animBase} ${!readyToShowForm ? animHidden : animVisible}`}
            style={{ transitionDelay: '300ms' }}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Entrar com Google
          </button>
        </form>
        <Link to="/solicitar-acesso" className={`mt-6 block w-full text-center rounded-md bg-gray-600 p-3 font-semibold text-white transition hover:bg-gray-500 ${animBase} ${!readyToShowForm ? animHidden : animVisible}`} style={{ transitionDelay: '350ms' }}>Solicitar Acesso</Link>
      </div>
    </div>
  );
}

export default LoginPage;
