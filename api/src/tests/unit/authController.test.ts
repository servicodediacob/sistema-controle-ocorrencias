import { prisma } from '../../lib/prisma';
import { DeepMockProxy, mockReset } from 'jest-mock-extended';

jest.mock('../../lib/prisma', () => ({
  __esModule: true,
  prisma: require('jest-mock-extended').mockDeep(),
}));

const prismaMock = prisma as unknown as DeepMockProxy<any>;

import { Request, Response } from 'express';
import { login } from '../../controllers/authController';
import { dbMock } from '../../__tests__/dbMock';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

jest.mock('../../services/auditoriaService', () => ({
  registrarAcao: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../services/socketService', () => ({
  notifyAdmins: jest.fn().mockReturnValue(undefined),
}));

jest.mock('jsonwebtoken');
const mockedJwtSign = jwt.sign as jest.Mock;

describe('Unit Tests - authController', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    mockReset(prismaMock);
    jest.clearAllMocks();
    req = { body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    process.env.JWT_SECRET = 'test_secret';
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('deve retornar status 200 e um token em caso de login bem-sucedido', async () => {
    req.body = { email: 'test@example.com', senha: 'password123' };
    const mockUser = {
      id: 1,
      nome: 'Test User',
      email: 'test@example.com',
      senha_hash: 'any_hash',
      role: 'admin',
      obm_id: 1,
      obm: { id: 1, nome: 'OBM Alpha' }
    };

    // Usando prismaMock para simular findUnique
    prismaMock.usuario.findUnique.mockResolvedValue(mockUser as any);
    mockedJwtSign.mockReturnValue('fake.jwt.token');

    const bcryptSpy = jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true));

    await login(req as Request, res as Response);

    expect(prismaMock.usuario.findUnique).toHaveBeenCalledWith({
      where: { email: req.body.email },
      include: { obm: true }
    });
    expect(bcryptSpy).toHaveBeenCalledWith(req.body.senha, mockUser.senha_hash);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ token: 'fake.jwt.token' });
  });

  it('deve retornar status 401 se a senha estiver incorreta', async () => {
    req.body = { email: 'test@example.com', senha: 'wrong_password' };
    const mockUser = { id: 1, senha_hash: 'any_hash' };

    prismaMock.usuario.findUnique.mockResolvedValue(mockUser as any);
    const bcryptSpy = jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(false));

    await login(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('deve retornar status 401 se o usuário não for encontrado', async () => {
    req.body = { email: 'notfound@example.com', senha: 'any_password' };
    prismaMock.usuario.findUnique.mockResolvedValue(null);

    await login(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(401);
  });
});
