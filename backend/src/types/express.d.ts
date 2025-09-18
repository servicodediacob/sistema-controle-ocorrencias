// Este arquivo de declaração estende a interface Request do Express.
// Isso nos permite adicionar propriedades personalizadas ao objeto 'req' de forma segura.

// Importamos os tipos originais para estendê-los, não para substituí-los.
import { Request } from 'express';

// Definimos a estrutura do payload que esperamos do nosso token JWT.
interface JwtPayload {
  id: number;
  nome: string;
}

declare global {
  namespace Express {
    export interface Request {
      // Adicionamos a propriedade 'usuario' como opcional ao objeto Request.
      // O tipo é o nosso payload JWT ou indefinido.
      usuario?: JwtPayload;
    }
  }
}
