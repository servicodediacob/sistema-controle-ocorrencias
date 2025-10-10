// Caminho: frontend/src/pages/PerfilPage.tsx

import React, { useState } from 'react';
import { z } from 'zod';
import { useAuth } from '../contexts/AuthProvider';
import { useNotification } from '../contexts/NotificationContext';
import { api, extractErrorMessage } from '../services/api';
import MainLayout from '../components/MainLayout';
import Spinner from '../components/Spinner';

// Esquema de validação para o formulário
const senhaSchema = z.object({
  senhaAtual: z.string().min(1, "A senha atual é obrigatória."),
  novaSenha: z.string().min(6, "A nova senha deve ter no mínimo 6 caracteres."),
  confirmarSenha: z.string(),
}).refine(data => data.novaSenha === data.confirmarSenha, {
  message: "As senhas não coincidem.",
  path: ["confirmarSenha"], // O erro será associado a este campo
});

type SenhaFormInputs = z.infer<typeof senhaSchema>;
type FormErrors = { [key in keyof SenhaFormInputs]?: string };

const PerfilPage: React.FC = () => {
  const { usuario, logout } = useAuth();
  const { addNotification } = useNotification();
  const [formData, setFormData] = useState<SenhaFormInputs>({
    senhaAtual: '',
    novaSenha: '',
    confirmarSenha: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = senhaSchema.safeParse(formData);
    if (!result.success) {
      const newErrors: FormErrors = {};
      result.error.issues.forEach(issue => {
        newErrors[issue.path[0] as keyof SenhaFormInputs] = issue.message;
      });
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const response = await api.put('/perfil/alterar-senha', {
        senhaAtual: formData.senhaAtual,
        novaSenha: formData.novaSenha,
      });
      addNotification(response.data.message, 'success');
      addNotification('Você será desconectado por segurança. Por favor, faça login novamente com sua nova senha.', 'info');
      
      // Desloga o usuário após um pequeno atraso para que ele possa ler a notificação
      setTimeout(() => {
        logout();
      }, 3000);

    } catch (error) {
      addNotification(extractErrorMessage(error), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout pageTitle="Meu Perfil">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-lg border border-border bg-surface p-6 shadow-lg md:p-8">
          <div className="mb-6 border-b border-border pb-4">
            <h2 className="text-xl font-bold text-text-strong">Alterar Senha</h2>
            <p className="mt-1 text-sm text-text">
              Olá, <span className="font-semibold">{usuario?.nome}</span>. Use o formulário abaixo para definir uma nova senha de acesso.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="senhaAtual" className="block text-sm font-medium text-text">Senha Atual</label>
              <input
                type="password"
                id="senhaAtual"
                name="senhaAtual"
                value={formData.senhaAtual}
                onChange={handleChange}
                disabled={loading}
                className="mt-1 block w-full rounded-md border-border bg-background p-3 text-text-strong"
              />
              {errors.senhaAtual && <p className="mt-1 text-sm text-red-500">{errors.senhaAtual}</p>}
            </div>

            <div>
              <label htmlFor="novaSenha" className="block text-sm font-medium text-text">Nova Senha</label>
              <input
                type="password"
                id="novaSenha"
                name="novaSenha"
                value={formData.novaSenha}
                onChange={handleChange}
                disabled={loading}
                className="mt-1 block w-full rounded-md border-border bg-background p-3 text-text-strong"
              />
              {errors.novaSenha && <p className="mt-1 text-sm text-red-500">{errors.novaSenha}</p>}
            </div>

            <div>
              <label htmlFor="confirmarSenha" className="block text-sm font-medium text-text">Confirmar Nova Senha</label>
              <input
                type="password"
                id="confirmarSenha"
                name="confirmarSenha"
                value={formData.confirmarSenha}
                onChange={handleChange}
                disabled={loading}
                className="mt-1 block w-full rounded-md border-border bg-background p-3 text-text-strong"
              />
              {errors.confirmarSenha && <p className="mt-1 text-sm text-red-500">{errors.confirmarSenha}</p>}
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center rounded-md bg-blue-700 px-6 py-3 font-semibold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? <Spinner /> : 'Salvar Nova Senha'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </MainLayout>
  );
};

export default PerfilPage;
