const jwt = require('jsonwebtoken');
require('dotenv').config();

const proteger = (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      // Extrair o token do cabeçalho (formato "Bearer TOKEN")
      token = authHeader.split(' ')[1];

      // Verificar o token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Anexar o usuário decodificado (sem a senha) ao objeto da requisição
      req.usuario = decoded;

      next(); // Prosseguir para a próxima função do middleware/rota
    } catch (error) {
      console.error('Erro de autenticação:', error.message);
      return res.status(401).json({ message: 'Não autorizado, token inválido.' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Não autorizado, nenhum token fornecido.' });
  }
};

module.exports = { proteger };
