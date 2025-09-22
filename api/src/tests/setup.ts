// api/src/tests/setup.ts
import { server } from '../server';
import db from '../db';
import { seedDatabase } from '../db/seed';

beforeAll(async () => {
  // Inicia o servidor (se ele não estiver ouvindo, o supertest o fará)
  // Apenas garantimos que o banco está pronto.
  await seedDatabase(); // Semeia o banco uma vez no início
  console.log('🚀 Banco de dados semeado para o início dos testes.');
});

afterAll(async () => {
  server.close(); // Fecha o servidor HTTP
  await db.pool.end(); // Fecha todas as conexões com o banco
  console.log('🛑 Servidor e pool do banco de dados fechados.');
});
