// Caminho: api/src/__tests__/api.test.ts
import '../config/envLoader'; // IMPORTANTE: Carrega o .env.test primeiro
import request from 'supertest';
import { app, server } from '../server';
import db from '../db';
import { seedDatabase } from '../db/seed';

// Variáveis globais para armazenar dados entre os testes
let token: string;
let naturezaId: number;
let cidadeId: number; // Representa o ID da OBM
let ocorrenciaId: number;

// HOOK: Executado uma vez antes de todos os testes desta suíte.
beforeAll(async () => {
  // 1. Garante um banco de dados limpo e semeado para o teste
  try {
    await seedDatabase();
  } catch (error) {
    console.error("Falha crítica ao semear o banco de dados para teste. Abortando.", error);
    process.exit(1);
  }

  // 2. Inicia o servidor HTTP
  const port = process.env.PORT || 3002;
  await new Promise<void>((resolve) => {
    server.listen(port, resolve);
  });
});

// HOOK: Executado uma vez após todos os testes desta suíte.
afterAll(async () => {
  // Fecha a conexão com o banco e o servidor para evitar "open handles".
  await db.pool.end();
  await new Promise<void>((resolve, reject) => {
    server.close((err) => {
      if (err) return reject(err);
      resolve();
    });
  });
});

// Suíte principal de testes
describe('API End-to-End Test Suite', () => {

  describe('POST /api/auth/login', () => {
    it('deve autenticar o usuário supervisor e retornar um token', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'supervisor@cbm.pe.gov.br',
          senha: 'supervisor123',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      token = response.body.token;
    });
  });

  describe('CRUD de Recursos Protegidos', () => {
    // Hook para garantir que o token existe antes de rodar os testes protegidos
    beforeAll(() => {
      if (!token) {
        throw new Error('O token de autenticação não foi obtido. Os testes de rotas protegidas não podem continuar.');
      }
    });

    it('GET /api/unidades -> deve obter a OBM para usar nos testes', async () => {
      const res = await request(app).get('/api/unidades').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.length).toBeGreaterThan(0);
      cidadeId = res.body[0].id;
    });

    describe('CRUD /api/naturezas', () => {
      it('POST -> deve criar uma nova natureza', async () => {
        const response = await request(app)
          .post('/api/naturezas')
          .set('Authorization', `Bearer ${token}`)
          .send({ grupo: 'Teste Automatizado', subgrupo: `Subgrupo ${Date.now()}` });
        
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('id');
        naturezaId = response.body.id;
      });

      it('GET -> deve listar a natureza criada', async () => {
        const response = await request(app).get('/api/naturezas').set('Authorization', `Bearer ${token}`);
        expect(response.status).toBe(200);
        expect(response.body.some((item: any) => item.id === naturezaId)).toBe(true);
      });
    });

    describe('CRUD /api/ocorrencias', () => {
      it('POST -> deve criar uma nova ocorrência', async () => {
        const response = await request(app)
          .post('/api/ocorrencias')
          .set('Authorization', `Bearer ${token}`)
          .send({
            ocorrencia: { 
              data_ocorrencia: '2025-09-18', 
              natureza_id: naturezaId, 
              obm_id: cidadeId // Corrigido para obm_id
            },
            obitos: []
          });
        
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('ocorrenciaId');
        ocorrenciaId = response.body.ocorrenciaId;
      });

      it('DELETE -> deve excluir a ocorrência criada', async () => {
        const response = await request(app)
          .delete(`/api/ocorrencias/${ocorrenciaId}`)
          .set('Authorization', `Bearer ${token}`);
        
        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Ocorrência excluída com sucesso.');
      });
    });

    it('Limpeza -> deve excluir a natureza de teste', async () => {
      const response = await request(app)
        .delete(`/api/naturezas/${naturezaId}`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Natureza excluída com sucesso.');
    });
  });
});
