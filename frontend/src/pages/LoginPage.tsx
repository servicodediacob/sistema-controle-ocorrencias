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

  // No previous design we waited for an image. Now we use CSS, so it's always "loaded".
  const readyToShowForm = !showIntro;
  const uiBlocked = !readyToShowForm || isLoading;
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    if (!showIntro) return;
    const t = setTimeout(() => {
      setShowIntro(false);
      sessionStorage.setItem('loginIntroSeen', '1');
    }, 1200);
    return () => clearTimeout(t);
  }, [showIntro]);

  const navigateWithExit = (to: string) => {
    try { sessionStorage.setItem('systemEnterAnim', '1'); } catch { }
    setIsLeaving(true);
    window.setTimeout(() => navigate(to), 300);
  };

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

  return (
    <div className={`relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-obsidian text-white font-rajdhani transition-opacity duration-1000 ${isLeaving ? 'opacity-0' : 'opacity-100'}`}>

      {/* Background Grid/Effects - Global */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,243,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,243,255,0.05)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_100%)] opacity-50"></div>
        <div className="absolute inset-0 bg-radial-gradient from-blue-900/20 to-black"></div>
      </div>

      <LoadingOverlay visible={uiBlocked} text={showIntro ? 'INICIANDO SISTEMA...' : 'AUTENTICANDO...'} />

      {/* Watermark 1 - Top Left (Lighter) */}
      <div className="fixed top-0 left-0 z-0 opacity-20 pointer-events-none mix-blend-overlay -translate-x-1/2 -translate-y-1/2">
        <img
          src="https://i.postimg.cc/63KGQSt3/image-Photoroom.png"
          alt="Watermark TL"
          className="w-[700px] h-auto"
          style={{
            clipPath: 'polygon(50% 50%, 100% 50%, 100% 100%, 50% 100%)'
          }}
        />
      </div>

      {/* Watermark 2 - Bottom Right (Standard) */}
      <div className="fixed bottom-0 right-0 z-0 opacity-50 pointer-events-none mix-blend-overlay translate-x-1/2 translate-y-1/2">
        <img
          src="https://i.postimg.cc/63KGQSt3/image-Photoroom.png"
          alt="Watermark BR"
          className="w-[700px] h-auto"
          style={{
            clipPath: 'polygon(0 0, 50% 0, 50% 50%, 0 50%)' // Top-Left quadrant, moved to center
          }}
        />
      </div>

      {/* The Login Card - Centered on Screen */}
      <div className={`relative z-10 w-full max-w-[420px] p-6 transition-all duration-700 ease-out ${!readyToShowForm ? 'scale-95 opacity-0 translate-y-8' : 'scale-100 opacity-100 translate-y-0'}`}>

        {/* The Metallic Bezel - Dark Brushed Steel Effect */}
        <div
          className="relative p-[6px] shadow-[0_0_80px_rgba(0,0,0,0.9)] rounded-3xl"
          style={{
            background: 'linear-gradient(135deg, #1a1a1a 0%, #4a4a4a 25%, #2a2a2a 50%, #4a4a4a 75%, #1a1a1a 100%)'
          }}
        >
          {/* Texture Overlay for Brushed Look */}
          <div
            className="absolute inset-0 opacity-30 mix-blend-overlay pointer-events-none rounded-3xl"
            style={{
              backgroundImage: `repeating-linear-gradient(90deg, transparent 0, transparent 2px, #000 2px, #000 4px), repeating-linear-gradient(0deg, transparent 0, transparent 2px, #000 2px, #000 4px)`
            }}
          ></div>

          {/* Bezel Accents - Adjusted for Rounded */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-[3px] bg-neon-blue shadow-[0_0_15px_#00f3ff] z-20 rounded-b-md"></div>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/3 h-[3px] bg-neon-blue shadow-[0_0_15px_#00f3ff] z-20 rounded-t-md"></div>

          {/* Inner Groove */}
          <div
            className="relative bg-charcoal p-[6px] rounded-[20px]"
          >
            <div className="absolute inset-0 bg-charcoal border-2 border-neon-blue/20 shadow-[inset_0_0_20px_rgba(0,243,255,0.1)] rounded-[20px]"></div>

            {/* Highly Transparent Content Area */}
            <div
              className="relative bg-black/40 backdrop-blur-md p-8 pt-10 border border-white/5 shadow-inner rounded-2xl"
            >
              {/* CSS Override for Chrome Autofill */}
              <style>{`
                 input:-webkit-autofill,
                 input:-webkit-autofill:hover, 
                 input:-webkit-autofill:focus, 
                 input:-webkit-autofill:active{
                     -webkit-box-shadow: 0 0 0 30px #0a0a0a inset !important;
                     -webkit-text-fill-color: white !important;
                     transition: background-color 5000s ease-in-out 0s;
                 }
              `}</style>

              <div className="mb-6 flex justify-center">
                <img
                  src="https://i.postimg.cc/63KGQSt3/image-Photoroom.png"
                  alt="Novo Brasão Corpo de Bombeiros"
                  className="h-[12.75rem] w-auto object-contain drop-shadow-[0_0_20px_rgba(0,243,255,0.4)] mix-blend-screen"
                />
              </div>

              {/* Header */}
              <div className="mb-8 text-center relative">
                <h2 className="font-orbitron text-2xl font-bold tracking-widest text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                  CONTROLE DE <br /><span className="text-neon-blue drop-shadow-[0_0_5px_rgba(0,243,255,0.5)]">OCORRÊNCIAS</span>
                </h2>
                <div className="mt-2 h-[1px] w-full bg-gradient-to-r from-transparent via-neon-blue/50 to-transparent"></div>
              </div>

              {/* Form */}
              <form onSubmit={handleLogin} className="flex flex-col gap-5">
                <div className="group relative">
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-gray-400 font-orbitron group-focus-within:text-neon-blue transition-colors">Identificação (Email)</label>
                  <div className="relative flex items-center bg-black/60 border-l-2 border-r-2 border-gray-700/50 rounded-sm overflow-hidden group-focus-within:border-neon-blue/70 transition-colors">
                    <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-neon-blue opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      disabled={uiBlocked}
                      autoComplete="off"
                      className="w-full bg-transparent p-3 pl-4 text-white placeholder-gray-600 outline-none font-rajdhani tracking-wide text-lg"
                      placeholder="SEU E-MAIL"
                    />
                    <div className="absolute right-0 top-0 bottom-0 w-[2px] bg-neon-blue opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
                  </div>
                  <p className="mt-1 min-h-[0.5rem] text-[9px] text-red-500 font-mono uppercase text-right">{errors.email}</p>
                </div>

                <div className="group relative">
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-gray-400 font-orbitron group-focus-within:text-neon-blue transition-colors">Chave de Acesso</label>
                  <div className="relative flex items-center bg-black/60 border-l-2 border-r-2 border-gray-700/50 rounded-sm overflow-hidden group-focus-within:border-neon-blue/70 transition-colors">
                    <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-neon-blue opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="senha"
                      value={formData.senha}
                      onChange={handleChange}
                      disabled={uiBlocked}
                      autoComplete="off"
                      className="w-full bg-transparent p-3 pl-4 text-white placeholder-gray-600 outline-none font-rajdhani tracking-wide text-lg"
                      placeholder="SUA SENHA"
                    />
                    <div className="absolute right-0 top-0 bottom-0 w-[2px] bg-neon-blue opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
                  </div>
                  <p className="mt-1 min-h-[0.5rem] text-[9px] text-red-500 font-mono uppercase text-right">{errors.senha}</p>
                </div>

                {/* Options */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="show-password" checked={showPassword} onChange={() => setShowPassword(!showPassword)} className="h-3 w-3 appearance-none rounded-none border border-neon-blue/50 bg-black checked:bg-neon-blue checked:shadow-[0_0_10px_#00f3ff] transition-all cursor-pointer" />
                    <label htmlFor="show-password" className="text-[10px] text-gray-400 hover:text-white cursor-pointer select-none tracking-widest uppercase font-orbitron">Visualizar</label>
                  </div>
                  <Link to="/solicitar-acesso" className="text-[10px] uppercase text-neon-blue/70 hover:text-neon-blue hover:shadow-[0_0_10px_rgba(0,243,255,0.4)] transition-all font-orbitron tracking-widest">Solicitar</Link>
                </div>

                {/* Buttons Row */}
                <div className="mt-2 flex gap-3">
                  <button type="submit" disabled={uiBlocked || Object.keys(errors).length > 0} className="group relative flex-1 overflow-hidden rounded-sm bg-gradient-to-r from-blue-900 to-blue-800 py-3 text-white border border-blue-500/50 transition-all hover:border-neon-blue hover:shadow-[0_0_20px_rgba(0,243,255,0.4)] active:scale-[0.99] disabled:opacity-50">
                    <div className="relative z-10 flex items-center justify-center gap-2 font-orbitron font-bold tracking-[0.1em] uppercase text-xs">
                      <span>Entrar</span>
                      <svg className="w-4 h-4 text-neon-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5-5 5M6 12h12" /></svg>
                    </div>
                  </button>
                  <button type="button" onClick={handleGoogleLogin} disabled={uiBlocked} className="flex flex-1 items-center justify-center gap-2 bg-white/5 py-3 text-xs font-medium text-gray-300 border border-white/5 transition-all hover:bg-white/10 hover:text-white hover:border-white/20 active:scale-[0.99] rounded-sm">
                    <span>Google</span>
                  </button>
                </div>

                {apiError && <p className="text-center text-[10px] text-red-500 font-mono animate-pulse border border-red-500/30 bg-red-500/10 p-2 rounded">{apiError}</p>}
              </form>
            </div>
          </div>
        </div>

        {/* Footer Metrics */}
        <div className="mt-6 flex justify-between text-[8px] text-gray-500 font-mono uppercase tracking-wider opacity-50">
          <span>Sys.V.3.1</span>
          <span>Encrypted Connection</span>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
