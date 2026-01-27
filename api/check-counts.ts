
import { prisma } from './src/lib/prisma';
import fs from 'fs';

async function checkCounts() {
    try {
        const obms = await prisma.obmSisgpo.count();
        const militares = await prisma.militarSisgpo.count();
        const viaturas = await prisma.viaturaSisgpo.count();

        const output = `OBMs: ${obms}\nMilitares: ${militares}\nViaturas: ${viaturas}`;
        fs.writeFileSync('counts.txt', output);
        console.log('Counts written to counts.txt');
    } catch (error) {
        fs.writeFileSync('counts.txt', `Error: ${error}`);
        console.error('Erro ao contar registros:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkCounts();
