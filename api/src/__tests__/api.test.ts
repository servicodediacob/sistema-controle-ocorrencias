import request from 'supertest';
import server from '../server';
import db from '../db';
import bcrypt from 'bcryptjs';

// --- CORREÇÃO FINAL ---
// Agora simulamos 'compare' para retornar uma Promise, alinhando-se ao uso de 'await' no controller.
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hash_falso_para_teste'),
  compare: jest.fn().mockResolvedValue(true), // <-- A CORREÇÃO ESTÁ AQUI
}));
// --- FIM DA CORREÇÃO FINAL ---

const app = server;

describe('API End-to-End Test Suite', () => {
  let token: string;

  beforeEach(async () => {
    await db.query('TRUNCATE TABLE usuarios, ocorrencias RESTART IDENTITY CASCADE');

    const supervisorPassword = 'supervisor123';
    const supervisorSenhaHash = await bcrypt.hash(supervisorPassword, 10);
    
    await db.query(
      `INSERT INTO usuarios (nome, email, senha_hash, role) VALUES ($1, $2, $3, 'admin')`,
      ['Supervisor de Teste', 'supervisor@cbm.pe.gov.br', supervisorSenhaHash]
    );

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'supervisor@cbm.pe.gov.br',
        senha: supervisorPassword,
      });
    
    expect(loginResponse.statusCode).toBe(200);
    token = loginResponse.body.token;
    expect(token).toBeDefined();
  });

  describe('POST /api/auth/login', () => {
    it('deve autenticar o usuário supervisor e retornar um token', async () => {
      const res = await request(app).post('/api/auth/login').send({ email: 'supervisor@cbm.pe.gov.br', senha: 'supervisor123' });
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('token');
    });
  });

  describe('CRUD de Recursos Protegidos', () => {
    let obmId: number;
    let naturezaId: number;

    beforeEach(async () => {
      const obms = await db.query("SELECT id FROM obms WHERE nome = 'Goiânia - Diurno'");
      obmId = obms.rows[0].id;
      const naturezas = await db.query("SELECT id FROM naturezas_ocorrencia WHERE subgrupo = 'Resgate'");
      naturezaId = naturezas.rows[0].id;
    });

    it('CRUD /api/ocorrencias -> deve criar, ler e deletar uma ocorrência', async () => {
      const ocorrenciaPayload = { ocorrencia: { obm_id: obmId, natureza_id: naturezaId, data_ocorrencia: '2025-09-21' } };
      const createRes = await request(app).post('/api/ocorrencias').set('Authorization', `Bearer ${token}`).send(ocorrenciaPayload);
      expect(createRes.statusCode).toEqual(201);
      const novaOcorrenciaId = createRes.body.ocorrenciaId;
      const getRes = await request(app).get('/api/ocorrencias').set('Authorization', `Bearer ${token}`);
      expect(getRes.statusCode).toEqual(200);
      const ocorrenciaEncontrada = getRes.body.ocorrencias.find((o: any) => o.id === novaOcorrenciaId);
      expect(ocorrenciaEncontrada).toBeDefined();
      const deleteRes = await request(app).delete(`/api/ocorrencias/${novaOcorrenciaId}`).set('Authorization', `Bearer ${token}`);
      expect(deleteRes.statusCode).toEqual(200);
    });
  });
});
