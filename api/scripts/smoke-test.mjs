// Usamos .mjs para ter suporte nativo a 'await' no nível superior.
import https from 'https';

// A URL do nosso serviço é injetada pelo Render na variável de ambiente RENDER_EXTERNAL_URL
const apiUrl = process.env.RENDER_EXTERNAL_URL;

if (!apiUrl ) {
  console.error('❌ Erro: A variável de ambiente RENDER_EXTERNAL_URL não está definida.');
  process.exit(1); // Falha o script
}

const diagnosticsUrl = `${apiUrl}/api/diag`;
console.log(`💨 Iniciando Smoke Test: Verificando o endpoint de diagnóstico em ${diagnosticsUrl}`);

const options = {
  timeout: 15000, // Timeout de 15 segundos
};

const request = https.get(diagnosticsUrl, options, (res ) => {
  let data = '';

  // Um chunk de dados foi recebido.
  res.on('data', (chunk) => {
    data += chunk;
  });

  // A resposta inteira foi recebida.
  res.on('end', () => {
    console.log(`✅ Resposta recebida com status: ${res.statusCode}`);
    
    if (res.statusCode !== 200) {
      console.error(`❌ Falha no Smoke Test: Status HTTP inesperado: ${res.statusCode}`);
      console.error('Resposta recebida:', data);
      process.exit(1); // Falha o script
    }

    try {
      const report = JSON.parse(data);
      // Verificamos se o status geral e o do banco de dados estão 'ok'
      if (report.geral?.status === 'ok' && report.database?.status === 'ok') {
        console.log('✅ Sucesso no Smoke Test: O sistema está saudável.');
        console.log(`   - Status Geral: ${report.geral.status}`);
        console.log(`   - Status do Banco: ${report.database.status} (Ping: ${report.database.pingMs}ms)`);
        process.exit(0); // Sucesso
      } else {
        console.error('❌ Falha no Smoke Test: O relatório de diagnóstico indicou um problema.');
        console.error('Relatório:', JSON.stringify(report, null, 2));
        process.exit(1); // Falha o script
      }
    } catch (e) {
      console.error('❌ Falha no Smoke Test: Não foi possível analisar a resposta JSON do diagnóstico.');
      console.error('Erro de parsing:', e);
      process.exit(1); // Falha o script
    }
  });
});

request.on('error', (err) => {
  console.error('❌ Falha no Smoke Test: Erro ao tentar fazer a requisição.');
  console.error(err.message);
  process.exit(1); // Falha o script
});

request.end();
