const fs = require('fs');
const path = require('path');

const source = path.resolve(__dirname, '../src/db/schema.sql');
const destinationDir = path.resolve(__dirname, '../dist/db');
const destination = path.join(destinationDir, 'schema.sql');

if (!fs.existsSync(source)) {
  console.error(`[copy-schema] Arquivo não encontrado em ${source}`);
  process.exit(1);
}

fs.mkdirSync(destinationDir, { recursive: true });
fs.copyFileSync(source, destination);
console.log(`[copy-schema] schema.sql copiado para ${destination}`);
