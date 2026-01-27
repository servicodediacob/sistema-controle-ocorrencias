// frontend/src/pages/SolicitarAcessoPage.tsx

import { useState, useEffect, ReactElement, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { getCidades, solicitarAcesso, ICidade } from '../services/api';
import { useNotification } from '../contexts/NotificationContext';
import LoadingOverlay from '../components/LoadingOverlay'; // Assuming this component exists as used in LoginPage

// Validation Schema
const requestAccessSchema = z.object({
  nome: z.string().min(3, { message: "O nome deve ter no mínimo 3 caracteres." }),
  email: z.string().email({ message: "Por favor, insira um email válido." }),
  senha: z.string().min(6, { message: "A senha deve ter no mínimo 6 caracteres." }),
  obm_id: z.string().nonempty({ message: "Por favor, selecione sua OBM de origem." }),
});

type RequestFormInputs = z.infer<typeof requestAccessSchema>;
type FormErrors = { [key in keyof RequestFormInputs]?: string };

// Spinner Component
const Spinner = (): ReactElement => (
  <div
    className="h-5 w-5 animate-spin rounded-full border-4 border-neon-blue/30 border-t-neon-blue"
    role="status"
    aria-label="Carregando..."
  />
);

function SolicitarAcessoPage(): ReactElement {
  const navigate = useNavigate();
  const { addNotification } = useNotification();

  const [formData, setFormData] = useState<RequestFormInputs>({
    nome: '',
    email: '',
    senha: '',
    obm_id: '',
  });
  const [obms, setObms] = useState<ICidade[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [loadingObms, setLoadingObms] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Animation States
  const [readyToShowForm, setReadyToShowForm] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [oauthNotice, setOauthNotice] = useState<string | null>(null);

  // Initial Load Animation
  useEffect(() => {
    // Small delay to allow 'mounting'
    const timer = setTimeout(() => {
      setReadyToShowForm(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const fetchObms = async () => {
      try {
        const data = await getCidades();
        setObms(data);
      } catch (error) {
        addNotification('Falha ao carregar a lista de OBMs. Tente recarregar a página.', 'error');
      } finally {
        setLoadingObms(false);
      }
    };
    fetchObms();
  }, [addNotification]);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('oauthPrefill');
      if (!raw) return;
      const prefill = JSON.parse(raw) as { nome?: string; email?: string };
      if (prefill?.nome || prefill?.email) {
        setFormData(prev => ({
          ...prev,
          nome: prefill.nome || prev.nome,
          email: prefill.email || prev.email,
        }));
        setOauthNotice('Detectamos um login via Google. Finalize sua solicitação de acesso informando a OBM.');
      }
      sessionStorage.removeItem('oauthPrefill');
    } catch {
      // ignora falhas de parse
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const validateForm = () => {
    const result = requestAccessSchema.safeParse(formData);
    if (!result.success) {
      const newErrors: FormErrors = {};
      result.error.issues.forEach(issue => {
        newErrors[issue.path[0] as keyof RequestFormInputs] = issue.message;
      });
      setErrors(newErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        obm_id: parseInt(formData.obm_id, 10),
      };
      const response = await solicitarAcesso(payload);
      addNotification(response.message, 'success');

      // Exit animation
      setIsLeaving(true);
      setTimeout(() => {
        navigate('/login');
      }, 1000);

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.';
      addNotification(errorMessage, 'error');
      setLoading(false);
    }
  };

  const filteredObms = obms.filter(obm =>
    obm.cidade_nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectObm = (obm: ICidade) => {
    setFormData(prev => ({ ...prev, obm_id: obm.id.toString() }));
    setSearchTerm(obm.cidade_nome);
    setIsDropdownOpen(false);
  };

  return (
    <div className={`relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-obsidian text-white font-rajdhani transition-opacity duration-1000 ${isLeaving ? 'opacity-0' : 'opacity-100'}`}>

      {/* Background Grid/Effects - Global */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,243,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,243,255,0.05)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_100%)] opacity-50"></div>
        <div className="absolute inset-0 bg-radial-gradient from-blue-900/20 to-black"></div>
      </div>

      <LoadingOverlay visible={loading} text="ENVIANDO SOLICITAÇÃO..." />

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
      <div className="fixed bottom-0 right-0 z-0 opacity-20 pointer-events-none mix-blend-overlay translate-x-1/2 translate-y-1/2">
        <img
          src="https://i.postimg.cc/63KGQSt3/image-Photoroom.png"
          alt="Watermark BR"
          className="w-[700px] h-auto"
          style={{
            clipPath: 'polygon(0 0, 50% 0, 50% 50%, 0 50%)'
          }}
        />
      </div>

      {/* The Card - Centered on Screen */}
      <div className={`relative z-10 w-full max-w-[500px] p-6 transition-all duration-700 ease-out ${!readyToShowForm ? 'scale-95 opacity-0 translate-y-8' : 'scale-100 opacity-100 translate-y-0'}`}>

        {/* The Metallic Bezel */}
        <div
          className="relative p-[6px] shadow-[0_0_80px_rgba(0,0,0,0.9)] rounded-3xl"
          style={{
            background: 'linear-gradient(135deg, #1a1a1a 0%, #4a4a4a 25%, #2a2a2a 50%, #4a4a4a 75%, #1a1a1a 100%)'
          }}
        >
          {/* Inner Content Container */}
          <div
            className="relative bg-black/60 backdrop-blur-xl p-8 pt-10 border-2 border-neon-blue shadow-[0_0_25px_rgba(0,243,255,0.3)] rounded-2xl"
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

            {/* Header */}
            <div className="mb-8 text-center relative">
              <h2 className="font-orbitron text-2xl font-bold tracking-widest text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                SOLICITAR <br /><span className="text-neon-blue drop-shadow-[0_0_5px_rgba(0,243,255,0.5)]">ACESSO</span>
              </h2>
              <div className="mt-2 h-[1px] w-full bg-gradient-to-r from-transparent via-neon-blue/50 to-transparent"></div>
            </div>

            {oauthNotice && (
              <div className="mb-6 rounded-sm border border-neon-blue/40 bg-neon-blue/10 px-4 py-2 text-[10px] uppercase tracking-widest text-neon-blue font-orbitron">
                {oauthNotice}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">

              {/* Nome */}
              <div className="group relative">
                <label htmlFor="nome" className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-gray-400 font-orbitron group-focus-within:text-neon-blue transition-colors">Nome Completo</label>
                <div className="relative flex items-center bg-black/60 border-l-2 border-r-2 border-gray-700/50 rounded-sm overflow-hidden group-focus-within:border-neon-blue/70 transition-colors">
                  <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-neon-blue opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
                  <input
                    id="nome"
                    type="text"
                    name="nome"
                    placeholder="SEU NOME COMPLETO"
                    value={formData.nome}
                    onChange={handleChange}
                    disabled={loading}
                    autoComplete="off"
                    className="w-full bg-transparent p-3 pl-4 text-white placeholder-gray-600 outline-none font-rajdhani tracking-wide text-lg"
                  />
                  <div className="absolute right-0 top-0 bottom-0 w-[2px] bg-neon-blue opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
                </div>
                <p className="mt-1 min-h-[0.5rem] text-[9px] text-red-500 font-mono uppercase text-right">{errors.nome}</p>
              </div>

              {/* Email */}
              <div className="group relative">
                <label htmlFor="email" className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-gray-400 font-orbitron group-focus-within:text-neon-blue transition-colors">Email Institucional</label>
                <div className="relative flex items-center bg-black/60 border-l-2 border-r-2 border-gray-700/50 rounded-sm overflow-hidden group-focus-within:border-neon-blue/70 transition-colors">
                  <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-neon-blue opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    placeholder="SEU.EMAIL@CBM.PE.GOV.BR"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={loading}
                    autoComplete="off"
                    className="w-full bg-transparent p-3 pl-4 text-white placeholder-gray-600 outline-none font-rajdhani tracking-wide text-lg"
                  />
                  <div className="absolute right-0 top-0 bottom-0 w-[2px] bg-neon-blue opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
                </div>
                <p className="mt-1 min-h-[0.5rem] text-[9px] text-red-500 font-mono uppercase text-right">{errors.email}</p>
              </div>

              {/* Senha */}
              <div className="group relative">
                <label htmlFor="senha" className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-gray-400 font-orbitron group-focus-within:text-neon-blue transition-colors">Senha Desejada</label>
                <div className="relative flex items-center bg-black/60 border-l-2 border-r-2 border-gray-700/50 rounded-sm overflow-hidden group-focus-within:border-neon-blue/70 transition-colors">
                  <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-neon-blue opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
                  <input
                    id="senha"
                    type="password"
                    name="senha"
                    placeholder="MINIMO 6 CARACTERES"
                    value={formData.senha}
                    onChange={handleChange}
                    disabled={loading}
                    autoComplete="off"
                    className="w-full bg-transparent p-3 pl-4 text-white placeholder-gray-600 outline-none font-rajdhani tracking-wide text-lg"
                  />
                  <div className="absolute right-0 top-0 bottom-0 w-[2px] bg-neon-blue opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
                </div>
                <p className="mt-1 min-h-[0.5rem] text-[9px] text-red-500 font-mono uppercase text-right">{errors.senha}</p>
              </div>

              {/* OBM Dropdown */}
              <div className="group relative" ref={dropdownRef}>
                <label htmlFor="obm_search" className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-gray-400 font-orbitron group-focus-within:text-neon-blue transition-colors">OBM de Origem</label>
                <div className="relative flex items-center bg-black/60 border-l-2 border-r-2 border-gray-700/50 rounded-sm overflow-hidden group-focus-within:border-neon-blue/70 transition-colors">
                  <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-neon-blue opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
                  <input
                    id="obm_search"
                    type="text"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      if (e.target.value === '') {
                        setFormData(prev => ({ ...prev, obm_id: '' }));
                      }
                    }}
                    onFocus={() => setIsDropdownOpen(true)}
                    placeholder={loadingObms ? 'CARREGANDO OBMS...' : 'DIGITE PARA FILTRAR...'}
                    disabled={loading || loadingObms}
                    autoComplete="off"
                    className="w-full bg-transparent p-3 pl-4 text-white placeholder-gray-600 outline-none font-rajdhani tracking-wide text-lg"
                  />
                  <div className="absolute right-0 top-0 bottom-0 w-[2px] bg-neon-blue opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
                </div>

                {/* Dropdown Menu */}
                {isDropdownOpen && !loadingObms && (
                  <ul className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-sm bg-gray-900 border border-gray-700 py-1 text-base shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm custom-scrollbar">
                    {filteredObms.length > 0 ? (
                      filteredObms.map(obm => (
                        <li
                          key={obm.id}
                          onClick={() => handleSelectObm(obm)}
                          className="relative cursor-pointer select-none py-3 pl-4 pr-9 text-gray-300 hover:bg-neon-blue/20 hover:text-white font-rajdhani tracking-wide transition-colors border-b border-gray-800 last:border-0"
                        >
                          {obm.cidade_nome}
                        </li>
                      ))
                    ) : (
                      <li className="px-3 py-2 text-gray-500 font-rajdhani">Nenhuma OBM encontrada.</li>
                    )}
                  </ul>
                )}
                <p className="mt-1 min-h-[0.5rem] text-[9px] text-red-500 font-mono uppercase text-right">{errors.obm_id}</p>
              </div>

              {/* Botões */}
              <div className="mt-4 flex flex-col gap-3">
                <button
                  type="submit"
                  disabled={loading || loadingObms}
                  className="group relative w-full overflow-hidden rounded-sm bg-gradient-to-r from-blue-900 to-blue-800 py-3 text-white border border-blue-500/50 transition-all hover:border-neon-blue hover:shadow-[0_0_20px_rgba(0,243,255,0.4)] active:scale-[0.99] disabled:opacity-50"
                >
                  <div className="relative z-10 flex items-center justify-center gap-2 font-orbitron font-bold tracking-[0.1em] uppercase text-xs">
                    {loading ? <><Spinner /><span className="ml-2">ENVIANDO...</span></> : 'ENVIAR SOLICITAÇÃO'}
                  </div>
                </button>

                <Link to="/login" className="flex w-full items-center justify-center gap-2 bg-white/5 py-3 text-xs font-medium text-gray-300 border border-white/5 transition-all hover:bg-white/10 hover:text-white hover:border-white/20 active:scale-[0.99] rounded-sm font-orbitron tracking-widest uppercase">
                  VOLTAR PARA O LOGIN
                </Link>
              </div>

            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SolicitarAcessoPage;
