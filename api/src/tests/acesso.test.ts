// Caminho: api/src/tests/acesso.test.ts

import request from 'supertest';
import bcrypt from 'bcryptjs';
import { app } from '../server';
import { seedDatabase } from '../db/seed';
import db from '../db';

describe('Fluxo de Integração - Gerenciamento de Acesso', () => {
  let adminToken: string;

  // Antes de cada teste, semeia o banco, cria um usuário admin e obtém seu token.
  beforeEach(async () => {
    await seedDatabase();

    const salt = await bcrypt.genSalt(10);
    const adminPassword = 'admin123';
    const adminSenhaHash = await bcrypt.hash(adminPassword, salt);
    
    await db.query(
      "INSERT INTO usuarios (nome, email, senha_hash, role) VALUES ($1, $2, $3, 'admin') ON CONFLICT (email) DO UPDATE SET senha_hash = $3, role = 'admin'",
      ['Admin de Teste', 'admin@cbm.pe.gov.br', adminSenhaHash]
    );

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@cbm.pe.gov.br', senha: adminPassword });
    
    adminToken = loginRes.body.token;
    expect(adminToken).toBeDefined();
  });

  it('deve permitir que um novo usuário solicite acesso, um admin aprove, e o usuário seja criado', async () => {
    // --- ETAPA 1: Novo usuário solicita acesso ---
    const novoUsuario = {
      nome: 'Carlos Teste',
      email: 'carlos.teste@example.com',
      senha: 'password123',
      obm_id: 1, // Assumindo que a OBM com ID 1 existe no seed
    };

    const solicitarRes = await request(app)
      .post('/api/acesso/solicitar')
      .send(novoUsuario);

    expect(solicitarRes.status).toBe(201);
    expect(solicitarRes.body.message).toContain('Solicitação de acesso enviada com sucesso');

    // --- ETAPA 2: Admin lista as solicitações ---
    const listarRes = await request(app)
      .get('/api/acesso')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(listarRes.status).toBe(200);
    const solicitacaoPendente = listarRes.body.find((s: any) => s.email === novoUsuario.email);
    expect(solicitacaoPendente).toBeDefined();
    expect(solicitacaoPendente.status).toBe('pendente');

    const solicitacaoId = solicitacaoPendente.id;

    // --- ETAPA 3: Admin aprova a solicitação ---
    const gerenciarRes = await request(app)
      .put(`/api/acesso/${solicitacaoId}/gerenciar`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ acao: 'aprovar' });

    expect(gerenciarRes.status).toBe(200);
    expect(gerenciarRes.body.message).toContain('aprovado e criado com sucesso');

    // --- ETAPA 4: Verificar o resultado final no banco de dados ---
    const solicitacaoAprovada = await db.query('SELECT status FROM solicitacoes_acesso WHERE id = $1', [solicitacaoId]);
    expect(solicitacaoAprovada.rows[0].status).toBe('aprovado');

    const novoUsuarioDb = await db.query('SELECT * FROM usuarios WHERE email = $1', [novoUsuario.email]);
    expect(novoUsuarioDb.rows.length).toBe(1);
    expect(novoUsuarioDb.rows[0].nome).toBe(novoUsuario.nome);
    expect(novoUsuarioDb.rows[0].role).toBe('user');
  });

  it('deve permitir que um admin recuse uma solicitação', async () => {
    // --- ETAPA 1: Outro usuário solicita acesso ---
    const outroUsuario = {
      nome: 'Mariana Recusada',
      email: 'mariana.recusada@example.com',
      senha: 'password123',
      obm_id: 2,
    };
    await request(app).post('/api/acesso/solicitar').send(outroUsuario);

    // --- ETAPA 2: Admin encontra a solicitação ---
    const listarRes = await request(app).get('/api/acesso').set('Authorization', `Bearer ${adminToken}`);
    const solicitacaoId = listarRes.body[0].id;

    // --- ETAPA 3: Admin recusa a solicitação ---
    const gerenciarRes = await request(app)
      .put(`/api/acesso/${solicitacaoId}/gerenciar`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ acao: 'recusar' });

    expect(gerenciarRes.status).toBe(200);
    expect(gerenciarRes.body.message).toContain('recusada');

    // --- ETAPA 4: Verificar o resultado final no banco de dados ---
    const solicitacaoRecusada = await db.query('SELECT status FROM solicitacoes_acesso WHERE id = $1', [solicitacaoId]);
    expect(solicitacaoRecusada.rows[0].status).toBe('recusado');

    const usuarioNaoExiste = await db.query('SELECT * FROM usuarios WHERE email = $1', [outroUsuario.email]);
    expect(usuarioNaoExiste.rows.length).toBe(0);
  });
});
