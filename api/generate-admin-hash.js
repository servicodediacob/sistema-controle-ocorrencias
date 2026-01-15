const bcrypt = require('bcryptjs');

async function generateHash() {
    const password = 'Cbmgo-Admin@2026';
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    console.log('Senha:', password);
    console.log('Hash bcrypt:', hash);
    console.log('\nSQL para atualizar:');
    console.log(`UPDATE usuarios SET senha_hash = '${hash}' WHERE email = 'admin@cbmgo.com.br';`);
}

generateHash();
