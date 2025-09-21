// Caminho: frontend/src/pages/LoginPage.tsx (CORRIGIDO)

import { useState, useEffect, ReactElement } from 'react';
import { useAuth } from '../contexts/useAuth';
import { z } from 'zod';

// Esquema de validação com Zod
const loginSchema = z.object({
  email: z.string().email({ message: "Por favor, insira um email válido." }),
  senha: z.string().min(6, { message: "A senha deve ter no mínimo 6 caracteres." }),
});

type LoginFormInputs = z.infer<typeof loginSchema>;
type FormErrors = { [key in keyof LoginFormInputs]?: string };

// Componente Spinner
const Spinner = (): ReactElement => (
  <div
    className="h-5 w-5 animate-spin rounded-full border-4 border-white/30 border-t-white"
    role="status"
    aria-label="Carregando..."
  />
);

function LoginPage(): ReactElement {
  const [formData, setFormData] = useState({
    email: 'supervisor@cbm.pe.gov.br',
    senha: 'supervisor123',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();

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
      await login(formData.email, formData.senha);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.';
      setApiError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const isFormInvalid = Object.keys(errors).length > 0;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900">
      <div className="w-full max-w-sm rounded-lg bg-gray-800 p-8 shadow-lg">
        <h2 className="mb-6 text-center text-2xl font-medium text-gray-200">
          Controle de Ocorrências
        </h2>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={loading}
              className="w-full rounded-md border border-gray-600 bg-gray-700 p-3 text-white transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-600"
            />
            <p className="mt-1 min-h-[1.25rem] text-left text-sm text-red-500">
              {errors.email || ''}
            </p>
          </div>

          <div>
            <input
              type="password"
              name="senha"
              placeholder="Senha"
              value={formData.senha}
              onChange={handleChange}
              required
              disabled={loading}
              className="w-full rounded-md border border-gray-600 bg-gray-700 p-3 text-white transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-600"
            />
            <p className="mt-1 min-h-[1.25rem] text-left text-sm text-red-500">
              {errors.senha || ''}
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || isFormInvalid}
            className="mt-2 flex items-center justify-center rounded-md bg-blue-700 p-3 text-lg font-semibold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-blue-800 disabled:opacity-70"
          >
            {loading ? (
              <>
                <Spinner />
                <span className="ml-2">Entrando...</span>
              </>
            ) : (
              'Entrar'
            )}
          </button>

          {apiError && (
            <p className="mt-4 text-center text-sm text-red-500">
              {apiError}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
