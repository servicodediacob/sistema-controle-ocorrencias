// api/scripts/copy-files.js
const fs = require('fs-extra');
const path = require('path');

async function copyFiles() {
  try {
    const source = path.resolve(__dirname, '../src/db/schema.sql');
    const destination = path.resolve(__dirname, '../dist/db/schema.sql');
    
    console.log(`📄 Copiando schema de ${source} para ${destination}...`);
    
    // fs-extra garante que o diretório de destino exista antes de copiar.
    await fs.copy(source, destination);
    
    console.log('✅ Schema.sql copiado com sucesso para a pasta dist/db.');
  } catch (err) {
    console.error('❌ Erro ao copiar o arquivo schema.sql:', err);
    process.exit(1); // Falha o script se a cópia não funcionar
  }
}

copyFiles();
