// Caminho: frontend/src/types.ts

// Esta é a interface que representa um usuário em toda a aplicação.
// Ela será usada para o usuário logado, usuários online, etc.
export interface IUsuario {
  id: number;
  nome: string;
  email: string;
  role: 'admin' | 'user';
  obm_id: number | null;
}
