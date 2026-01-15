// Caminho: api/src/tests/unit/authController.test.ts

import { Request, Response } from 'express';
import { login } from '../../controllers/authController';
import db from '../../db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Mockamos apenas os módulos que NÃO vamos espionar ou que são simples
jest.mock('../../db');
jest.mock('jsonwebtoken');

const mockedDbQuery = db.query as jest.Mock;
const mockedJwtSign = jwt.sign as jest.Mock;

describe.skip('Unit Tests - authController', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  // CRUCIAL: Restaura todos os mocks após cada teste
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('deve retornar status 200 e um token em caso de login bem-sucedido', async () => {
    // ARRANGE
    req.body = { email: 'test@example.com', senha: 'password123' };
    const mockUser = { id: 1, nome: 'Test User', senha_hash: 'any_hash' };

    mockedDbQuery.mockResolvedValue({ rows: [mockUser] });
    mockedJwtSign.mockReturnValue('fake.jwt.token');

    // --- A CORREÇÃO DEFINITIVA ---
    // Criamos um "espião" no método 'compare' do bcrypt.
    // E forçamos seu valor de retorno para este teste específico.
    const bcryptSpy = jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true));

    // ACT
    await login(req as Request, res as Response);

    // ASSERT
    expect(mockedDbQuery).toHaveBeenCalledWith('SELECT * FROM usuarios WHERE email = $1', [req.body.email]);
    expect(bcryptSpy).toHaveBeenCalledWith(req.body.senha, mockUser.senha_hash);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ token: 'fake.jwt.token' }));
  });

  it('deve retornar status 401 se a senha estiver incorreta', async () => {
    // ARRANGE
    req.body = { email: 'test@example.com', senha: 'wrong_password' };
    const mockUser = { id: 1, senha_hash: 'any_hash' };

    mockedDbQuery.mockResolvedValue({ rows: [mockUser] });
    
    // Forçamos o retorno para 'false'
    const bcryptSpy = jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(false));

    // ACT
    await login(req as Request, res as Response);

    // ASSERT
    expect(bcryptSpy).toHaveBeenCalledWith(req.body.senha, mockUser.senha_hash);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(mockedJwtSign).not.toHaveBeenCalled();
  });

  it('deve retornar status 401 se o usuário não for encontrado', async () => {
    // ARRANGE
    req.body = { email: 'notfound@example.com', senha: 'any_password' };
    mockedDbQuery.mockResolvedValue({ rows: [] });
    
    // Apenas espionamos, sem forçar um retorno, para garantir que não seja chamado
    const bcryptSpy = jest.spyOn(bcrypt, 'compare');

    // ACT
    await login(req as Request, res as Response);

    // ASSERT
    expect(res.status).toHaveBeenCalledWith(401);
    expect(bcryptSpy).not.toHaveBeenCalled();
  });
});
