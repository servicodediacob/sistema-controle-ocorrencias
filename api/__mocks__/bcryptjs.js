// api/__mocks__/bcryptjs.js

'use strict';

const bcrypt = jest.createMockFromModule('bcryptjs');

// Esta é a função que vamos controlar em nossos testes
bcrypt.compare = jest.fn();

module.exports = bcrypt;
