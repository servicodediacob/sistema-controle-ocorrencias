// Caminho: frontend/src/pages/LoginPage.tsx

import { useState, useEffect, ReactElement, useRef } from 'react';

import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../contexts/AuthProvider';

import { authGoogle, solicitarAcessoGoogle, getCidades, ICidade } from '../services/api';

import { useNotification } from '../contexts/NotificationContext';

import { z } from 'zod';
import { isAxiosError } from 'axios';
import { supabase } from '../lib/supabase'; // 1. Importar supabase
import LoadingOverlay from '../components/LoadingOverlay'; // 1. Importar o overlay



// Esquema de validacao com Zod (sem alteracoes)


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

  const [formData, setFormData] = useState({

    email: '',

    senha: '',

  });



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

  // Splash/intro: bloqueia a UI brevemente antes do login (uma vez por sessão)
  const [showIntro, setShowIntro] = useState(() => !sessionStorage.getItem('loginIntroSeen'));
  // Garante carregar a imagem de fundo antes de exibir o formulário
  const [bgLoaded, setBgLoaded] = useState(false);
  useEffect(() => {
    const img = new Image();
    img.src = '/images/login-blue-hex-bg.svg';
    const done = () => setBgLoaded(true);
    img.onload = done;
    img.onerror = done;
  }, []);

  // Inicia o timer de intro somente após o fundo carregar
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

  // Animação de saída ao navegar para o sistema
  const [isLeaving, setIsLeaving] = useState(false);

  const navigateWithExit = (to: string) => {
    try {
      sessionStorage.setItem('systemEnterAnim', '1');
    } catch { }
    setIsLeaving(true);
    window.setTimeout(() => navigate(to), 300);
  };

  // Animação sequencial (inputs/botões)
  const animBase = 'transition-all duration-500 ease-out';
  const animHidden = 'opacity-0 translate-y-2';
  const animVisible = 'opacity-100 translate-y-0';

  const hasAttemptedLoginRef = useRef(false);

  const googlePromptOverlayStartedAt = useRef<number | null>(null);

  const resetGooglePromptOverlay = async () => {

    if (googlePromptOverlayStartedAt.current !== null) {

      const startedAt = googlePromptOverlayStartedAt.current;

      googlePromptOverlayStartedAt.current = null;

      await ensureMinimumLoadingDuration(startedAt);

    }

    setIsSubmitting(false);

  };



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

  const isSignInInProgress = useRef(false);
  const isGsiInitialized = useRef(false);
  const [isGsiReady, setIsGsiReady] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isRunningDiagnostics, setIsRunningDiagnostics] = useState(false);
  const googleBtnRef = useRef<HTMLDivElement | null>(null);

  const runGoogleDiagnostics = async (reason?: string, notification?: any, notifyUser = false) => {
    if (isRunningDiagnostics) return;
    setIsRunningDiagnostics(true);
    try {
      const diag: Record<string, unknown> = {
        reason,
        clientIdPresent: Boolean(clientId),
        isMobile,
        isGsiReady,
        gsiScriptPresent: Boolean(document.querySelector('script[src="https://accounts.google.com/gsi/client"]')),
        windowGoogle: Boolean(window.google),
        accountsId: Boolean(window.google?.accounts?.id),
        promptDisplayMoment: notification?.isDisplayMoment?.(),
        promptSkipped: notification?.isSkippedMoment?.(),
        promptNotDisplayed: notification?.isNotDisplayed?.(),
      };
      try {
        diag.notDisplayedReason = typeof notification?.getNotDisplayedReason === 'function'
          ? notification.getNotDisplayedReason()
          : undefined;
      } catch (err) {
        diag.notDisplayedReasonError = (err as Error).message;
      }
      try {
        diag.dismissedReason = typeof notification?.getDismissedReason === 'function'
          ? notification.getDismissedReason()
          : undefined;
      } catch (err) {
        diag.dismissedReasonError = (err as Error).message;
      }
      if (clientId) {
        try {
          const resp = await fetch(`https://accounts.google.com/gsi/status?client_id=${encodeURIComponent(clientId)}`, {
            mode: 'cors',
            credentials: 'omit',
          });
          diag.statusProbe = { status: resp.status, ok: resp.ok, type: resp.type };
        } catch (err) {
          diag.statusProbeError = (err as Error).message;
        }
      }
      console.groupCollapsed('Google login diagnostics');
      console.log(diag);
      console.groupEnd();
      if (notifyUser) {
        addNotification('Diagnostico do login com Google registrado no console.', 'info');
      }
    } finally {
      setIsRunningDiagnostics(false);
    }
  };



  useEffect(() => {

    // Detecta ambiente mobile para ajustar o fluxo do Google
    try {
      setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    } catch { }

    if (!clientId) {

      console.error('VITE_GOOGLE_CLIENT_ID nao esta definida.');

      return;

    }



    const initializeGsi = () => {

      if (isGsiInitialized.current) {

        setIsGsiReady(true);

        return;

      }

      const gsi = window.google?.accounts?.id;

      if (!gsi) {

        console.error('Google Identity Services ainda nao carregou.');

        return;

      }



      try {

        gsi.initialize({

          client_id: clientId,

          callback: async (response: any) => {

            isSignInInProgress.current = false;

            googlePromptOverlayStartedAt.current = null;

            hasAttemptedLoginRef.current = true;

            setIsSubmitting(true);

            const overlayStartedAt = Date.now();

            const finalize = async () => {

              await ensureMinimumLoadingDuration(overlayStartedAt);

              setIsSubmitting(false);

            };

            let shouldResetOverlay = true;

            try {
              // MIGRAÇÃO SUPABASE: Login com Google via ID Token
              const { data, error } = await supabase.auth.signInWithIdToken({
                provider: 'google',
                token: response.credential,
              });

              if (error) throw error;

              // O AuthProvider (onAuthStateChange) detectará a sessão e redirecionará.
              // Apenas finalizamos o overlay visual.
              shouldResetOverlay = false;
              await finalize();

              // O redirecionamento acontece via useEffect monitorando 'user'

            } catch (error: any) {
              console.error('Erro na autenticacao Google Supabase:', error);
              addNotification(error.message || 'Falha no login com Google.', 'error');
            } finally {
              if (shouldResetOverlay) {
                await finalize();
              }
            }


          },

          // FedCM is becoming mandatory; keep it enabled to avoid prompt blocking in modern browsers
          use_fedcm_for_prompt: true,
          itp_support: true,
          auto_select: false,

        });

        isGsiInitialized.current = true;

        setIsGsiReady(true);

      } catch (error) {

        console.error('Falha ao inicializar o Google Sign-In:', error);

        addNotification('Nao foi possivel iniciar o servico de login do Google.', 'error');

        setIsGsiReady(false);

      }

    };



    const scriptSrc = 'https://accounts.google.com/gsi/client';
    const listeners: Array<{ element: HTMLScriptElement; type: 'load' | 'error'; handler: EventListener }> = [];

    const loadHandler: EventListener = () => {

      initializeGsi();

    };

    const errorHandler: EventListener = () => {

      addNotification('Falha ao carregar script do Google.', 'error');

      setIsGsiReady(false);

    };

    const existingScript = document.querySelector(`script[src="${scriptSrc}"]`) as HTMLScriptElement | null;

    if (existingScript) {

      if (window.google?.accounts?.id) {

        initializeGsi();

      } else {

        existingScript.addEventListener('load', loadHandler, { once: true });

        listeners.push({ element: existingScript, type: 'load', handler: loadHandler });

      }

    } else {

      const script = document.createElement('script');

      script.src = scriptSrc;

      script.async = true;

      script.defer = true;

      script.addEventListener('load', loadHandler, { once: true });

      script.addEventListener('error', errorHandler, { once: true });

      listeners.push({ element: script, type: 'load', handler: loadHandler });

      listeners.push({ element: script, type: 'error', handler: errorHandler });

      document.head.appendChild(script);

    }

    return () => {
      listeners.forEach(({ element, type, handler }) => element.removeEventListener(type, handler));
    };


  }, [addNotification, clientId, loginWithJwt, navigate]);

  // Renderiza o botão oficial do Google em mobile (melhor compatibilidade em iOS/Android)
  useEffect(() => {
    if (!isGsiReady || !isMobile) return;
    const gsi = window.google?.accounts?.id;
    if (!gsi || !googleBtnRef.current) return;
    try {
      // Evita duplicação em hot reload
      googleBtnRef.current.innerHTML = '';
      gsi.renderButton(googleBtnRef.current, {
        theme: 'filled_black',
        size: 'large',
        text: 'signin_with',
        shape: 'pill',
        logo_alignment: 'left',
      });
    } catch (e) {
      console.error('Falha ao renderizar botao do Google:', e);
    }
  }, [isGsiReady, isMobile]);



  const handleGoogleSignIn = () => {



    if (isSignInInProgress.current) {



      return;



    }



    if (!isGsiReady) {



      addNotification('Servico de login ainda esta carregando. Tente novamente.', 'warning');



      return;



    }



    isSignInInProgress.current = true;



    googlePromptOverlayStartedAt.current = Date.now();



    setIsSubmitting(true);



    try {



      const gsi = window.google?.accounts?.id;

      if (!gsi) {

        throw new Error('Google Identity Services nao inicializado.');

      }

      gsi.disableAutoSelect?.();

      gsi.prompt(async (notification: any) => {



        if (notification.isDisplayMoment()) {



          googlePromptOverlayStartedAt.current = null;



          setIsSubmitting(false);



          return;



        }



        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          try {
            const reason = typeof notification.getNotDisplayedReason === 'function'
              ? notification.getNotDisplayedReason()
              : undefined;
            console.warn('Google Sign-In prompt not displayed/skipped:', reason);
            if (reason) {
              addNotification(`Login Google bloqueado: ${reason}. Verifique permissões de cookies/FedCM.`, 'warning');
            } else {
              addNotification('Login Google não pôde mostrar o prompt. Verifique permissões de cookies/FedCM.', 'warning');
            }
          } catch { }
          void runGoogleDiagnostics('prompt_not_displayed_or_skipped', notification, false);


          isSignInInProgress.current = false;


          await resetGooglePromptOverlay();


          return;


        }



        if (notification.isDismissedMoment()) {



          const dismissedReason = typeof notification.getDismissedReason === 'function'

            ? notification.getDismissedReason()

            : undefined;

          void runGoogleDiagnostics('prompt_dismissed', notification, false);


          if (dismissedReason === 'credential_returned') {



            return;



          }



          isSignInInProgress.current = false;



          await resetGooglePromptOverlay();



        }



      });



    } catch (error) {



      isSignInInProgress.current = false;



      googlePromptOverlayStartedAt.current = null;



      setIsSubmitting(false);



      console.error('Erro ao exibir o prompt do Google:', error);



      addNotification('Nao foi possivel iniciar o login com Google. Tente novamente.', 'error');



    }



  };



  return (

    <div className={`login-background flex min-h-screen w-full items-center justify-center px-4 py-8 transition-all duration-300 ${isLeaving ? 'opacity-0 -translate-x-3' : 'opacity-100 translate-x-0'}`}>

      {/* 5. Renderizar o overlay de carregamento */}

      <LoadingOverlay visible={uiBlocked} text={!bgLoaded ? 'Carregando...' : (showIntro ? 'Carregando...' : 'Entrando...')} />



      <div
        className={`login-card w-full max-w-md rounded-2xl p-8 shadow-[0_20px_60px_rgba(0,0,0,0.6)] mx-auto border border-white/10 transition-all duration-500 ease-out ${!readyToShowForm ? 'opacity-0 translate-y-3 scale-95' : 'opacity-100 translate-y-0 scale-100'}`}
      >

        <h2 className="mb-6 text-center text-2xl font-medium text-gray-200">

          Controle de Ocorrencias

        </h2>



        <form onSubmit={handleLogin} className="flex flex-col gap-4">

          <div className={`${animBase} ${!readyToShowForm ? animHidden : animVisible}`} style={{ transitionDelay: '50ms' }}>

            <input

              type="email" name="email" placeholder="Email"

              value={formData.email} onChange={handleChange} required disabled={uiBlocked}

              className="w-full rounded-md border border-gray-600 bg-gray-700 p-3 text-white transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-600"

            />

            <p className="mt-1 min-h-[1.25rem] text-left text-sm text-red-500">{errors.email || ''}</p>

          </div>



          <div className={`${animBase} ${!readyToShowForm ? animHidden : animVisible}`} style={{ transitionDelay: '100ms' }}>

            <input

              type={showPassword ? 'text' : 'password'}

              name="senha" placeholder="Senha"

              value={formData.senha} onChange={handleChange} required disabled={uiBlocked}

              className="w-full rounded-md border border-gray-600 bg-gray-700 p-3 text-white transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-600"

            />

            <p className="mt-1 min-h-[1.25rem] text-left text-sm text-red-500">{errors.senha || ''}</p>

          </div>



          <div className={`flex items-center gap-2 self-start ${animBase} ${!readyToShowForm ? animHidden : animVisible}`} style={{ transitionDelay: '150ms' }}>

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



          {/* 6. Botao simplificado */}

          <button

            type="submit" disabled={uiBlocked || isFormInvalid}

            className={`mt-2 flex items-center justify-center rounded-md bg-blue-700 p-3 text-lg font-semibold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-blue-800 disabled:opacity-70 ${animBase} ${!readyToShowForm ? animHidden : animVisible}`}
            style={{ transitionDelay: '200ms' }}

          >

            Entrar

          </button>



          {apiError && <p className="mt-4 text-center text-sm text-red-500">{apiError}</p>}

        </form>



        <div className="my-6 flex items-center gap-4">

          <hr className="flex-grow border-t border-gray-600" />

          <span className="text-gray-400">OU</span>

          <hr className="flex-grow border-t border-gray-600" />

        </div>



        {import.meta.env.VITE_GOOGLE_CLIENT_ID ? (
          isMobile ? (
            <div ref={googleBtnRef} className={`mb-4 w-full flex items-center justify-center ${animBase} ${!readyToShowForm ? animHidden : animVisible}`} style={{ transitionDelay: '250ms' }} />
          ) : (
            <button onClick={handleGoogleSignIn} disabled={uiBlocked || !isGsiReady} className={`mb-4 flex w-full items-center justify-center gap-3 rounded-md bg-white p-3 font-semibold text-gray-900 transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-70 ${animBase} ${!readyToShowForm ? animHidden : animVisible}`} style={{ transitionDelay: '250ms' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 48 48"><g><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path><path fill="none" d="M0 0h48v48H0z"></path></g></svg>
              <span>Entrar com Google</span>
            </button>
          )
        ) : (

          <div className={`mb-4 w-full rounded-md bg-gray-700 p-3 text-center text-sm text-gray-300 ${animBase} ${!readyToShowForm ? animHidden : animVisible}`} style={{ transitionDelay: '250ms' }}>

            Login com Google indisponivel (GOOGLE_CLIENT_ID nao configurado)

          </div>

        )}



        <Link

          to="/solicitar-acesso"

          className={`block w-full text-center rounded-md bg-gray-600 p-3 font-semibold text-white transition hover:bg-gray-500 ${animBase} ${!readyToShowForm ? animHidden : animVisible}`}
          style={{ transitionDelay: '300ms' }}

        >

          Solicitar Acesso

        </Link>

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

                  await solicitarAcessoGoogle({

                    nome: pendingGoogleProfile.nome,

                    email: pendingGoogleProfile.email,

                    obm_id: Number.parseInt(selectedObm, 10),

                  });

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

                } finally {

                  setIsSubmitting(false);

                }

              }} className="rounded-md bg-teal-600 px-4 py-2 text-white">Enviar Solicitacao</button>

            </div>

          </div>

        </div>

      )}

    </div>

  );

}



export default LoginPage;


