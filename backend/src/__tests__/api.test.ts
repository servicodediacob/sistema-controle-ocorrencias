// backend/src/ __tests__/api.test.ts

import request from 'supertest';
import express from 'express';
import cors from 'cors';

// Importar rotas com os caminhos corrigidos
import authRoutes from '../routes/authRoutes';
import dadosRoutes from '../routes/dadosRoutes';
import unidadesRoutes from '../routes/unidadesRoutes';
import db from '../db';

// Configuração do App Express para o ambiente de teste
const app = express();
app.use(cors());
app.use(express.json());

// Registrar rotas
app.use('/api/auth', authRoutes);
app.use('/api', dadosRoutes);
app.use('/api', unidadesRoutes);

// ... o restante do código de teste permanece o mesmo ...

// Variáveis globais para o teste
let token: string;
let naturezaId: number;
let cidadeId: number;
let ocorrenciaId: number;

// Encerrar a conexão com o banco após todos os testes
afterAll(async () => {
  await db.pool.end();
});

describe('API End-to-End Test Suite', () => {

  // 1. Teste de Autenticação
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
      expect(response.body.usuario.email).toBe('supervisor@cbm.pe.gov.br');
      
      token = response.body.token;
    });

    it('deve falhar com credenciais inválidas', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'supervisor@cbm.pe.gov.br',
          senha: 'senhaincorreta',
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Credenciais inválidas.');
    });
  });

  // 2. Testes do CRUD de Naturezas de Ocorrência
  describe('CRUD /api/naturezas', () => {
    it('POST /naturezas -> deve criar uma nova natureza de ocorrência', async () => {
      const response = await request(app)
        .post('/api/naturezas')
        .set('Authorization', `Bearer ${token}`)
        .send({
          grupo: 'Teste Automatizado',
          subgrupo: `Subgrupo ${Date.now()}`,
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.grupo).toBe('Teste Automatizado');
      
      naturezaId = response.body.id;
    });

    it('GET /naturezas -> deve listar as naturezas de ocorrência', async () => {
      const response = await request(app)
        .get('/api/naturezas')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('PUT /naturezas/:id -> deve atualizar a natureza criada', async () => {
      const response = await request(app)
        .put(`/api/naturezas/${naturezaId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          grupo: 'Teste Automatizado (Atualizado)',
          subgrupo: 'Subgrupo Atualizado',
        });

      expect(response.status).toBe(200);
      expect(response.body.grupo).toBe('Teste Automatizado (Atualizado)');
    });
  });

  // 3. Testes do CRUD de Ocorrências
    describe('CRUD /api/ocorrencias', () => {
        // O beforeAll já está correto, usando async/await implicitamente pelo Supertest
        beforeAll(async () => {
            const res = await request(app).get('/api/unidades').set('Authorization', `Bearer ${token}`);
            
            // Adicionar um log para depuração
            if (res.status !== 200) {
                console.error('Falha ao buscar unidades no beforeAll:', res.body);
            }

            if (res.body && res.body.length > 0) {
                cidadeId = res.body[0].id;
            } else {
                throw new Error("Nenhuma cidade encontrada para usar nos testes de ocorrência.");
            }
        });

    it('POST /ocorrencias -> deve criar uma nova ocorrência', async () => {
      const response = await request(app)
        .post('/api/ocorrencias')
        .set('Authorization', `Bearer ${token}`)
        .send({
          ocorrencia: {
            data_ocorrencia: '2025-09-18',
            natureza_id: naturezaId,
            cidade_id: cidadeId,
          },
          obitos: []
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('ocorrenciaId');
      
      ocorrenciaId = response.body.ocorrenciaId;
    });

    it('GET /ocorrencias -> deve listar as ocorrências com paginação', async () => {
      const response = await request(app)
        .get('/api/ocorrencias?page=1&limit=5')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('ocorrencias');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.ocorrencias)).toBe(true);
    });

    it('PUT /ocorrencias/:id -> deve atualizar a ocorrência criada', async () => {
        const response = await request(app)
          .put(`/api/ocorrencias/${ocorrenciaId}`)
          .set('Authorization', `Bearer ${token}`)
          .send({
            data_ocorrencia: '2025-09-19',
            natureza_id: naturezaId,
            cidade_id: cidadeId,
          });
  
        expect(response.status).toBe(200);
        expect(response.body.ocorrencia.data_ocorrencia).toContain('2025-09-19');
      });
  
      it('DELETE /ocorrencias/:id -> deve excluir a ocorrência criada', async () => {
        const response = await request(app)
          .delete(`/api/ocorrencias/${ocorrenciaId}`)
          .set('Authorization', `Bearer ${token}`);
  
        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Ocorrência excluída com sucesso.');
      });
  });

  // 4. Limpeza: Excluir a natureza de teste no final
  describe('Limpeza', () => {
    it('DELETE /naturezas/:id -> deve excluir a natureza de teste', async () => {
      const response = await request(app)
        .delete(`/api/naturezas/${naturezaId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Natureza excluída com sucesso.');
    });
  });
});
