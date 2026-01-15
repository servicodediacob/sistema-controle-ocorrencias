require('dotenv').config();
const https = require('https');

async function testSupabaseAPI() {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'rqhzudbbmsximjfvndyd.supabase.co',
            port: 443,
            path: '/rest/v1/',
            method: 'GET',
            headers: {
                'apikey': process.env.SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`
            }
        };

        console.log('🔍 Testando API REST do Supabase...');
        console.log('URL:', `https://${options.hostname}${options.path}`);

        const req = https.request(options, (res) => {
            console.log('✅ API respondeu com status:', res.statusCode);
            console.log('Headers:', res.headers);

            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                console.log('📊 Resposta:', data.substring(0, 200));
                resolve();
            });
        });

        req.on('error', (error) => {
            console.error('❌ Erro na API:', error.message);
            reject(error);
        });

        req.setTimeout(10000, () => {
            console.error('❌ Timeout na requisição');
            req.destroy();
            reject(new Error('Timeout'));
        });

        req.end();
    });
}

testSupabaseAPI()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
