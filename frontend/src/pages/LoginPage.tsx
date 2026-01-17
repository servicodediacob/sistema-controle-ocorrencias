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
  const { user, login, loading: authLoading } = useAuth();
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
        </form>
        <Link to="/solicitar-acesso" className={`mt-6 block w-full text-center rounded-md bg-gray-600 p-3 font-semibold text-white transition hover:bg-gray-500 ${animBase} ${!readyToShowForm ? animHidden : animVisible}`} style={{ transitionDelay: '250ms' }}>Solicitar Acesso</Link>
      </div>
    </div>
  );
}

export default LoginPage;
