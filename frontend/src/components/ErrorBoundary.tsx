// frontend/src/components/ErrorBoundary.tsx

import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Atualiza o estado para que a próxima renderização mostre a UI de fallback.
    return { hasError: true, error: error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Você também pode registrar o erro em um serviço de log de erros
    console.error("--- ERRO CAPTURADO PELO ERROR BOUNDARY ---");
    console.error("Erro:", error);
    console.error("Informações do Componente:", errorInfo);
    this.setState({ error, errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      // Você pode renderizar qualquer UI de fallback
      return (
        <div style={{ padding: '2rem', color: 'white', backgroundColor: '#4d2121', border: '2px solid red', margin: '1rem' }}>
          <h2>Algo deu errado na renderização.</h2>
          <p>Isso não deveria acontecer. Por favor, verifique o console para detalhes do erro.</p>
          <details style={{ whiteSpace: 'pre-wrap', marginTop: '1rem' }}>
            <summary>Detalhes do Erro</summary>
            {this.state.error && this.state.error.toString()}
              

            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
