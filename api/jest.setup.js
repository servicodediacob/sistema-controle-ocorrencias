// api/jest.setup.js (VERIFIQUE SE ESTÁ ASSIM)
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, './.env.test') });
