// Caminho: frontend/src/pages/LoginPage.tsx

import { useState, useEffect, ReactElement, useRef } from 'react';

import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../contexts/AuthProvider';

import { authGoogle, solicitarAcessoGoogle, getCidades, ICidade } from '../services/api';

import { useNotification } from '../contexts/NotificationContext';

import { z } from 'zod';
import { isAxiosError } from 'axios';

import LoadingOverlay from '../components/LoadingOverlay'; // 1. Importar o overlay



// Esquema de validacao com Zod (sem alteracoes)


const loginSchema = z.object({

  email: z.string().email({ message: "Por favor, insira um email valido." }),

  senha: z.string().min(6, { message: "A senha deve ter no minimo 6 caracteres." }),

});



type LoginFormInputs = z.infer<typeof loginSchema>;

type FormErrors = { [key in keyof LoginFormInputs]?: string };



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



  useEffect(() => {

    if (user) {

      navigate('/');

    }

  }, [user, navigate]);



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



    setLoading(true);

    try {

      await login(formData);

      navigate('/');

    } catch (err: unknown) { 

      const errorMessage = err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.';

      setApiError(errorMessage);

    } finally {

      setLoading(false);

    }

  };



  const isFormInvalid = Object.keys(errors).length > 0;

  const isSignInInProgress = useRef(false);
  const isGsiInitialized = useRef(false);
  const [isGsiReady, setIsGsiReady] = useState(false);



  useEffect(() => {

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

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

            setLoading(true);

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

              console.error('Erro na autenticacao com o backend:', error);

              addNotification('Falha na verificacao com o servidor.', 'error');

            } finally {

              setLoading(false);

            }

          },

          use_fedcm_for_prompt: true,

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


  }, [addNotification, loginWithJwt, navigate]);



    const handleGoogleSignIn = () => {



      if (isSignInInProgress.current) {



        return;



      }



      if (!isGsiReady) {



        addNotification('Servico de login ainda esta carregando. Tente novamente.', 'warning');



        return;



      }



      isSignInInProgress.current = true;



      try {



        window.google?.accounts?.id?.prompt((notification: any) => {



          if (notification.isDisplayMoment()) {



            setLoading(false);



          } else if (notification.isNotDisplayed() || notification.isSkippedMoment()) {



            isSignInInProgress.current = false;



            setLoading(false);



          } else if (notification.isDismissedMoment()) {



            isSignInInProgress.current = false;



            setLoading(false);



          }



        });



      } catch (error) {



        isSignInInProgress.current = false;



        setLoading(false);



        console.error('Erro ao exibir o prompt do Google:', error);



        addNotification('Nao foi possivel iniciar o login com Google. Tente novamente.', 'error');



      }



    };



  return (

    <div className="flex min-h-screen items-center justify-center bg-gray-900 p-4">

      {/* 5. Renderizar o overlay de carregamento */}

      <LoadingOverlay visible={loading} text="Entrando..." />



      <div className="w-full max-w-sm rounded-lg bg-gray-800 p-8 shadow-lg">

        <h2 className="mb-6 text-center text-2xl font-medium text-gray-200">

          Controle de Ocorrencias

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



          {/* 6. Botao simplificado */}

          <button

            type="submit" disabled={loading || isFormInvalid}

            className="mt-2 flex items-center justify-center rounded-md bg-blue-700 p-3 text-lg font-semibold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-blue-800 disabled:opacity-70"

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

          <button onClick={handleGoogleSignIn} disabled={loading || !isGsiReady} className="mb-4 flex w-full items-center justify-center gap-3 rounded-md bg-white p-3 font-semibold text-gray-900 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-70">

            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 48 48"><g><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path><path fill="none" d="M0 0h48v48H0z"></path></g></svg>

            <span>Entrar com Google</span>

          </button>

        ) : (

          <div className="mb-4 w-full rounded-md bg-gray-700 p-3 text-center text-sm text-gray-300">

            Login com Google indisponivel (GOOGLE_CLIENT_ID nao configurado)

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

            <h3 className="mb-4 text-lg font-semibold text-white">Selecionar OBM para solicitacao</h3>

            <p className="mb-4 text-sm text-gray-300">{pendingGoogleProfile.nome} ({pendingGoogleProfile.email})</p>

            <select value={selectedObm} onChange={e=>setSelectedObm(e.target.value)} className="w-full rounded-md border border-gray-600 bg-gray-700 p-3 text-white">

              <option value="">Selecione sua OBM</option>

              {obms.map(o => <option key={o.id} value={o.id}>{o.cidade_nome}</option>)}

            </select>

            <div className="mt-6 flex justify-end gap-2">

              <button onClick={()=>setPendingGoogleProfile(null)} className="rounded-md bg-gray-600 px-4 py-2 text-white">Cancelar</button>

              <button onClick={async ()=>{

                if(!selectedObm){ addNotification('Selecione sua OBM.', 'warning'); return; }

                setLoading(true);

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

                  setLoading(false);

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
