import axios from 'axios';
import jwt from 'jsonwebtoken';

const JWT_SECRET = 'cbmgo-sistema-ocorrencias-secret-key-2026-super-secure';

async function testProxy() {
    try {
        console.log('Generating local token...');
        // Payload matching authController
        const tokenPayload = {
            id: 1, // Assuming admin exists at ID 1
            nome: 'Admin',
            email: 'admin@cbmgo.com.br',
            role: 'ADMIN',
            perfil: 'ADMIN',
            obm_id: null,
            obm_nome: null
        };

        const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '1h' });
        console.log('Token generated:', token.substring(0, 10) + '...');

        console.log('Calling proxy /admin/militares...');
        const proxyRes = await axios.get('http://localhost:3001/api/sisgpo/proxy/admin/militares?page=1&limit=20', {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('Proxy Response Status:', proxyRes.status);
        console.log('Proxy Response Data Type:', typeof proxyRes.data);
        if (proxyRes.data.data) {
            console.log('Proxy Response Data Length:', proxyRes.data.data.length);
            if (proxyRes.data.data.length === 0) {
                console.log('Proxy returned empty data.');
            } else {
                console.log('Sample item:', proxyRes.data.data[0]);
            }
        } else {
            console.log('Proxy Response Body:', JSON.stringify(proxyRes.data, null, 2));
        }

        if (proxyRes.data.pagination) {
            console.log('Proxy Response Pagination:', proxyRes.data.pagination);
        }

    } catch (error: any) {
        console.error('Error Code:', error.code);
        console.error('Error Message:', error.message);
        console.error('Error Response Status:', error.response?.status);
        console.error('Error Response Data:', JSON.stringify(error.response?.data, null, 2));
    }
}

testProxy();
