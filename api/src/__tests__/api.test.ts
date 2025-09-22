// Caminho: api/src/__tests__/api.test.ts

import request from 'supertest';
import { app } from '../server'; // Apenas o 'app' é necessário para o supertest
import { seedDatabase } from '../db/seed';
import db from '../db';

describe('API End-to-End Test Suite', () => {
  let token: string;

  // Antes de cada teste, semeia o banco e obtém um token de autenticação.
  // Usar beforeEach garante que cada teste comece em um estado limpo e conhecido.
  beforeEach(async () => {
    await seedDatabase();

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'supervisor@cbm.pe.gov.br', // Usuário do seed
        senha: 'supervisor123',
      });
    
    token = loginResponse.body.token;
    expect(token).toBeDefined();
  });

  describe('POST /api/auth/login', () => {
    it('deve autenticar o usuário supervisor e retornar um token', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'supervisor@cbm.pe.gov.br',
          senha: 'supervisor123',
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.usuario.email).toEqual('supervisor@cbm.pe.gov.br');
    });
  });

  describe('CRUD de Recursos Protegidos', () => {
    let obmId: number;
    let naturezaId: number;

    // Obtém IDs necessários para os testes de CRUD
    beforeEach(async () => {
      const obms = await db.query("SELECT id FROM obms WHERE nome = 'Goiânia - Diurno'");
      obmId = obms.rows[0].id;

      const naturezas = await db.query("SELECT id FROM naturezas_ocorrencia WHERE subgrupo = 'Resgate'");
      naturezaId = naturezas.rows[0].id;
    });

    it('CRUD /api/ocorrencias -> deve criar, ler e deletar uma ocorrência', async () => {
      // 1. POST -> Criar uma nova ocorrência
      const ocorrenciaPayload = {
        ocorrencia: {
          obm_id: obmId,
          natureza_id: naturezaId,
          data_ocorrencia: '2025-09-21',
        },
      };
      const createRes = await request(app)
        .post('/api/ocorrencias')
        .set('Authorization', `Bearer ${token}`)
        .send(ocorrenciaPayload);

      expect(createRes.statusCode).toEqual(201);
      expect(createRes.body).toHaveProperty('ocorrenciaId');
      const novaOcorrenciaId = createRes.body.ocorrenciaId;

      // 2. GET -> Verificar se a ocorrência foi criada
      const getRes = await request(app)
        .get('/api/ocorrencias')
        .set('Authorization', `Bearer ${token}`);
      
      expect(getRes.statusCode).toEqual(200);
      const ocorrenciaEncontrada = getRes.body.ocorrencias.find((o: any) => o.id === novaOcorrenciaId);
      expect(ocorrenciaEncontrada).toBeDefined();

      // 3. DELETE -> Excluir a ocorrência criada
      const deleteRes = await request(app)
        .delete(`/api/ocorrencias/${novaOcorrenciaId}`)
        .set('Authorization', `Bearer ${token}`);
        
      expect(deleteRes.statusCode).toEqual(200);
      expect(deleteRes.body.message).toContain('excluída com sucesso');
    });
  });
});
