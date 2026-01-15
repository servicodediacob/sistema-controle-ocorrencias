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

describe('Fluxo de Integração - Gerenciamento de Acesso', () => {
  let adminToken: string;

  beforeEach(async () => {
    await db.query('TRUNCATE TABLE usuarios, solicitacoes_acesso RESTART IDENTITY CASCADE');

    const adminPassword = 'admin123';
    const adminSenhaHash = await bcrypt.hash(adminPassword, 10);
    
    await db.query(
      `INSERT INTO usuarios (nome, email, senha_hash, role) VALUES ($1, $2, $3, 'admin')`,
      ['Admin de Teste', 'admin@cbm.pe.gov.br', adminSenhaHash]
    );

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@cbm.pe.gov.br', senha: adminPassword });
    
    expect(loginRes.statusCode).toBe(200);
    adminToken = loginRes.body.token;
    expect(adminToken).toBeDefined();
  });

  it('deve permitir que um novo usuário solicite acesso, um admin aprove, e o usuário seja criado', async () => {
    const novoUsuario = { nome: 'Carlos Teste', email: 'carlos.teste@example.com', senha: 'password123', obm_id: 1 };
    const solicitarRes = await request(app).post('/api/acesso/solicitar').send(novoUsuario);
    
    expect(solicitarRes.status).toBe(201);

    const listarRes = await request(app).get('/api/acesso').set('Authorization', `Bearer ${adminToken}`);
    const solicitacaoPendente = listarRes.body.find((s: any) => s.email === novoUsuario.email);
    expect(solicitacaoPendente).toBeDefined();
    const solicitacaoId = solicitacaoPendente.id;

    const gerenciarRes = await request(app).put(`/api/acesso/${solicitacaoId}/gerenciar`).set('Authorization', `Bearer ${adminToken}`).send({ acao: 'aprovar' });
    expect(gerenciarRes.status).toBe(200);

    const solicitacaoAprovada = await db.query('SELECT status FROM solicitacoes_acesso WHERE id = $1', [solicitacaoId]);
    expect(solicitacaoAprovada.rows[0].status).toBe('aprovado');

    const novoUsuarioDb = await db.query('SELECT * FROM usuarios WHERE email = $1', [novoUsuario.email]);
    expect(novoUsuarioDb.rows.length).toBe(1);
  });

  it('deve permitir que um admin recuse uma solicitação', async () => {
    const outroUsuario = { nome: 'Mariana Recusada', email: 'mariana.recusada@example.com', senha: 'password123', obm_id: 2 };
    await request(app).post('/api/acesso/solicitar').send(outroUsuario);

    const listarRes = await request(app).get('/api/acesso').set('Authorization', `Bearer ${adminToken}`);
    const solicitacaoPendente = listarRes.body.find((s: any) => s.email === outroUsuario.email);
    expect(solicitacaoPendente).toBeDefined();
    const solicitacaoId = solicitacaoPendente.id;

    const gerenciarRes = await request(app).put(`/api/acesso/${solicitacaoId}/gerenciar`).set('Authorization', `Bearer ${adminToken}`).send({ acao: 'recusar' });
    expect(gerenciarRes.status).toBe(200);

    const solicitacaoRecusada = await db.query('SELECT status FROM solicitacoes_acesso WHERE id = $1', [solicitacaoId]);
    expect(solicitacaoRecusada.rows[0].status).toBe('recusado');

    const usuarioNaoExiste = await db.query('SELECT * FROM usuarios WHERE email = $1', [outroUsuario.email]);
    expect(usuarioNaoExiste.rows.length).toBe(0);
  });
});
