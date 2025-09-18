import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { useAuth } from '../contexts/useAuth';
import { z } from 'zod'; // 1. Importe o Zod

// 2. Defina o esquema de validação para o formulário
const loginSchema = z.object({
  email: z.string().email({ message: "Por favor, insira um email válido." }),
  senha: z.string().min(6, { message: "A senha deve ter no mínimo 6 caracteres." }),
});

// Extrai o tipo do esquema para usar no estado de erros
type LoginFormInputs = z.infer<typeof loginSchema>;
type FormErrors = { [key in keyof LoginFormInputs]?: string };


// --- Componentes Estilizados (sem alterações) ---
const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #1e1e1e;
`;
// ... (todos os outros styled-components que criamos antes)
const LoginBox = styled.div`
  padding: 2.5rem;
  background-color: #2c2c2c;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
  width: 350px;
  text-align: center;
`;

const Title = styled.h2`
  margin: 0 0 1.5rem 0;
  color: #e0e0e0;
  font-weight: 500;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 0.5rem; /* Reduzido para acomodar mensagens de erro */
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  text-align: left;
`;

const Input = styled.input`
  padding: 0.8rem;
  border-radius: 4px;
  border: 1px solid #555;
  background-color: #3a3a3a;
  color: white;
  font-size: 1rem;

  &:disabled {
    background-color: #444;
    cursor: not-allowed;
  }
`;

const Button = styled.button`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0.8rem;
  border-radius: 4px;
  border: none;
  background-color: #3a7ca5;
  color: white;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
  margin-top: 1rem; /* Espaçamento acima do botão */

  &:disabled {
    background-color: #5a8ca5;
    cursor: not-allowed;
    opacity: 0.7;
  }
`;

const ErrorMessage = styled.p`
  color: #d9534f;
  font-size: 0.8rem;
  margin: 4px 0 0 4px;
  min-height: 1.2rem;
`;

const spin = keyframes`
  to {
    transform: rotate(360deg);
  }
`;

const Spinner = styled.div`
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
  margin-right: 10px;
`;


function LoginPage(): React.ReactElement {
  const [formData, setFormData] = useState({
    email: 'supervisor@cbm.pe.gov.br',
    senha: 'supervisor123',
  });
  const [errors, setErrors] = useState<FormErrors>({}); // 3. Estado para os erros
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();

  // 4. Função para validar o formulário em tempo real
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

  // Valida o formulário sempre que os dados mudam
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

    // 5. Verifica a validade antes de enviar
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
    <Container>
      <LoginBox>
        <Title>Controle de Ocorrências</Title>
        <Form onSubmit={handleLogin}>
          <InputGroup>
            <Input
              type="email"
              name="email" // Adicionado o 'name'
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={loading}
            />
            {errors.email && <ErrorMessage>{errors.email}</ErrorMessage>}
          </InputGroup>

          <InputGroup>
            <Input
              type="password"
              name="senha" // Adicionado o 'name'
              placeholder="Senha"
              value={formData.senha}
              onChange={handleChange}
              required
              disabled={loading}
            />
            {errors.senha && <ErrorMessage>{errors.senha}</ErrorMessage>}
          </InputGroup>

          <Button type="submit" disabled={loading || isFormInvalid}>
            {loading ? (
              <>
                <Spinner />
                <span>Entrando...</span>
              </>
            ) : (
              'Entrar'
            )}
          </Button>
          {apiError && <ErrorMessage style={{ textAlign: 'center', marginTop: '1rem' }}>{apiError}</ErrorMessage>}
        </Form>
      </LoginBox>
    </Container>
  );
}

export default LoginPage;
