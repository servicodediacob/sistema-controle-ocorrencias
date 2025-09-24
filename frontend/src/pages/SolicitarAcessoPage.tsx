// frontend/src/pages/SolicitarAcessoPage.tsx

import { useState, useEffect, ReactElement, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { getCidades, solicitarAcesso, ICidade } from '../services/api';
import { useNotification } from '../contexts/NotificationContext';

// Esquema de validação (sem alterações)
const requestAccessSchema = z.object({
  nome: z.string().min(3, { message: "O nome deve ter no mínimo 3 caracteres." }),
  email: z.string().email({ message: "Por favor, insira um email válido." }),
  senha: z.string().min(6, { message: "A senha deve ter no mínimo 6 caracteres." }),
  obm_id: z.string().nonempty({ message: "Por favor, selecione sua OBM de origem." }),
});

type RequestFormInputs = z.infer<typeof requestAccessSchema>;
type FormErrors = { [key in keyof RequestFormInputs]?: string };

// Componente Spinner (sem alterações)
const Spinner = (): ReactElement => (
  <div
    className="h-5 w-5 animate-spin rounded-full border-4 border-white/30 border-t-white"
    role="status"
    aria-label="Carregando..."
  />
);

function SolicitarAcessoPage(): ReactElement {
  const navigate = useNavigate(); // CORREÇÃO: 'navigate' será usado
  const { addNotification } = useNotification();

  const [formData, setFormData] = useState<RequestFormInputs>({
    nome: '',
    email: '',
    senha: '',
    obm_id: '',
  });
  const [obms, setObms] = useState<ICidade[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false); // CORREÇÃO: 'setLoading' será usado
  const [loadingObms, setLoadingObms] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  // ======================= INÍCIO DA CORREÇÃO =======================
  // As funções 'validateForm', 'handleChange' e 'handleSubmit' foram restauradas.

  const validateForm = () => {
    const result = requestAccessSchema.safeParse(formData);
    if (!result.success) {
      const newErrors: FormErrors = {};
      result.error.issues.forEach(issue => {
        newErrors[issue.path[0] as keyof RequestFormInputs] = issue.message;
      });
      setErrors(newErrors); // CORREÇÃO: 'setErrors' agora é usado
      return false;
    }
    setErrors({}); // CORREÇÃO: 'setErrors' agora é usado
    return true;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) { // CORREÇÃO: 'validateForm' agora é usado
      return;
    }

    setLoading(true); // CORREÇÃO: 'setLoading' agora é usado
    try {
      const payload = {
        ...formData,
        obm_id: parseInt(formData.obm_id, 10),
      };
      const response = await solicitarAcesso(payload); // CORREÇÃO: 'solicitarAcesso' agora é usado
      addNotification(response.message, 'success');
      navigate('/login'); // CORREÇÃO: 'navigate' agora é usado
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.';
      addNotification(errorMessage, 'error');
    } finally {
      setLoading(false); // CORREÇÃO: 'setLoading' agora é usado
    }
  };
  // ======================= FIM DA CORREÇÃO =======================

  const filteredObms = obms.filter(obm =>
    obm.cidade_nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectObm = (obm: ICidade) => {
    setFormData(prev => ({ ...prev, obm_id: obm.id.toString() }));
    setSearchTerm(obm.cidade_nome);
    setIsDropdownOpen(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900 p-4">
      <div className="w-full max-w-lg rounded-lg bg-gray-800 p-8 shadow-lg">
        <h2 className="mb-6 text-center text-2xl font-medium text-gray-200">
          Solicitar Acesso ao Sistema
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Campo Nome */}
          <div>
            <label htmlFor="nome" className="mb-1 block text-sm text-gray-400">Nome Completo</label>
            <input id="nome" type="text" name="nome" placeholder="Seu nome completo" value={formData.nome} onChange={handleChange} required disabled={loading} className="w-full rounded-md border border-gray-600 bg-gray-700 p-3 text-white transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500" />
            <p className="mt-1 min-h-[1.25rem] text-left text-sm text-red-500">{errors.nome || ''}</p>
          </div>

          {/* Campo Email */}
          <div>
            <label htmlFor="email" className="mb-1 block text-sm text-gray-400">Email</label>
            <input id="email" type="email" name="email" placeholder="seu.email@cbm.pe.gov.br" value={formData.email} onChange={handleChange} required disabled={loading} className="w-full rounded-md border border-gray-600 bg-gray-700 p-3 text-white transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500" />
            <p className="mt-1 min-h-[1.25rem] text-left text-sm text-red-500">{errors.email || ''}</p>
          </div>

          {/* Campo Senha */}
          <div>
            <label htmlFor="senha" className="mb-1 block text-sm text-gray-400">Senha</label>
            <input id="senha" type="password" name="senha" placeholder="Mínimo de 6 caracteres" value={formData.senha} onChange={handleChange} required disabled={loading} className="w-full rounded-md border border-gray-600 bg-gray-700 p-3 text-white transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500" />
            <p className="mt-1 min-h-[1.25rem] text-left text-sm text-red-500">{errors.senha || ''}</p>
          </div>

          {/* Campo OBM de Origem */}
          <div className="relative" ref={dropdownRef}>
            <label htmlFor="obm_search" className="mb-1 block text-sm text-gray-400">OBM de Origem</label>
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
              placeholder={loadingObms ? 'Carregando OBMs...' : 'Digite para filtrar...'}
              disabled={loading || loadingObms}
              className="w-full rounded-md border border-gray-600 bg-gray-700 p-3 text-white transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            />
            {isDropdownOpen && !loadingObms && (
              <ul className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-gray-700 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                {filteredObms.length > 0 ? (
                  filteredObms.map(obm => (
                    <li
                      key={obm.id}
                      onClick={() => handleSelectObm(obm)}
                      className="relative cursor-pointer select-none py-2 pl-3 pr-9 text-white hover:bg-blue-600"
                    >
                      {obm.cidade_nome}
                    </li>
                  ))
                ) : (
                  <li className="px-3 py-2 text-gray-400">Nenhuma OBM encontrada.</li>
                )}
              </ul>
            )}
            <p className="mt-1 min-h-[1.25rem] text-left text-sm text-red-500">{errors.obm_id || ''}</p>
          </div>

          {/* Botões */}
          <div className="mt-4 flex flex-col gap-4">
            <button type="submit" disabled={loading || loadingObms} className="flex items-center justify-center rounded-md bg-teal-600 p-3 text-lg font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-70">
              {loading ? <><Spinner /><span className="ml-2">Enviando...</span></> : 'Enviar Solicitação'}
            </button>
            <Link to="/login" className="text-center rounded-md bg-gray-600 p-3 font-semibold text-white transition hover:bg-gray-500">
              Voltar para o Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SolicitarAcessoPage;
