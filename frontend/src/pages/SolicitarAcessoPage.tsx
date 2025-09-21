// frontend/src/pages/SolicitarAcessoPage.tsx

import { useState, useEffect, ReactElement } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { getCidades, solicitarAcesso, ICidade } from '../services/api'; // getCidades será reutilizado para buscar OBMs
import { useNotification } from '../contexts/NotificationContext';

// Esquema de validação com Zod para o formulário
const requestAccessSchema = z.object({
  nome: z.string().min(3, { message: "O nome deve ter no mínimo 3 caracteres." }),
  email: z.string().email({ message: "Por favor, insira um email válido." }),
  senha: z.string().min(6, { message: "A senha deve ter no mínimo 6 caracteres." }),
  obm_id: z.string().nonempty({ message: "Por favor, selecione sua OBM de origem." }),
});

type RequestFormInputs = z.infer<typeof requestAccessSchema>;
type FormErrors = { [key in keyof RequestFormInputs]?: string };

// Componente Spinner simples para feedback visual
const Spinner = (): ReactElement => (
  <div
    className="h-5 w-5 animate-spin rounded-full border-4 border-white/30 border-t-white"
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

  // Busca a lista de OBMs (cidades) para preencher o select
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
      navigate('/login'); // Redireciona para a tela de login após o sucesso
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.';
      addNotification(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
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
            <input
              id="nome" type="text" name="nome" placeholder="Seu nome completo"
              value={formData.nome} onChange={handleChange} required disabled={loading}
              className="w-full rounded-md border border-gray-600 bg-gray-700 p-3 text-white transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            />
            <p className="mt-1 min-h-[1.25rem] text-left text-sm text-red-500">{errors.nome || ''}</p>
          </div>

          {/* Campo Email */}
          <div>
            <label htmlFor="email" className="mb-1 block text-sm text-gray-400">Email</label>
            <input
              id="email" type="email" name="email" placeholder="seu.email@cbm.pe.gov.br"
              value={formData.email} onChange={handleChange} required disabled={loading}
              className="w-full rounded-md border border-gray-600 bg-gray-700 p-3 text-white transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            />
            <p className="mt-1 min-h-[1.25rem] text-left text-sm text-red-500">{errors.email || ''}</p>
          </div>

          {/* Campo Senha */}
          <div>
            <label htmlFor="senha" className="mb-1 block text-sm text-gray-400">Senha</label>
            <input
              id="senha" type="password" name="senha" placeholder="Mínimo de 6 caracteres"
              value={formData.senha} onChange={handleChange} required disabled={loading}
              className="w-full rounded-md border border-gray-600 bg-gray-700 p-3 text-white transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            />
            <p className="mt-1 min-h-[1.25rem] text-left text-sm text-red-500">{errors.senha || ''}</p>
          </div>

          {/* Campo OBM de Origem */}
          <div>
            <label htmlFor="obm_id" className="mb-1 block text-sm text-gray-400">OBM de Origem</label>
            <select
              id="obm_id" name="obm_id" value={formData.obm_id} onChange={handleChange}
              required disabled={loading || loadingObms}
              className="w-full rounded-md border border-gray-600 bg-gray-700 p-3 text-white transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            >
              <option value="" disabled>{loadingObms ? 'Carregando OBMs...' : 'Selecione sua unidade'}</option>
              {!loadingObms && obms.map(obm => (
                <option key={obm.id} value={obm.id}>{obm.cidade_nome}</option>
              ))}
            </select>
            <p className="mt-1 min-h-[1.25rem] text-left text-sm text-red-500">{errors.obm_id || ''}</p>
          </div>

          {/* Botões */}
          <div className="mt-4 flex flex-col gap-4">
            <button
              type="submit" disabled={loading || loadingObms}
              className="flex items-center justify-center rounded-md bg-teal-600 p-3 text-lg font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? <><Spinner /><span className="ml-2">Enviando...</span></> : 'Enviar Solicitação'}
            </button>
            <Link
              to="/login"
              className="text-center rounded-md bg-gray-600 p-3 font-semibold text-white transition hover:bg-gray-500"
            >
              Voltar para o Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SolicitarAcessoPage;
