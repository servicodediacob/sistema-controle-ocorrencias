import axios from 'axios';
import logger from '@/config/logger';

const SISGPO_API_URL = process.env.SISGPO_API_URL || 'http://localhost:3333';

/**
 * Status válidos para sincronização
 */
type ViaturaStatus = 'EMPENHADA' | 'DISPONIVEL' | 'MANUTENCAO' | 'INDISPONIVEL';

/**
 * Serviço responsável por sincronizar status de viaturas com o SISGPO
 * Implementa o Feedback Loop da integração SCO -> SISGPO
 */
export class SisgpoSyncService {
    /**
     * Sincroniza o status de uma viatura com o SISGPO
     * @param viaturaId - ID da viatura no SISGPO (prefixo ou ID numérico)
     * @param status - Novo status da viatura
     * @param ocorrenciaId - ID da ocorrência relacionada (opcional)
     * @param token - Token de autenticação para o SISGPO
     */
    async syncViaturaStatus(
        viaturaId: number | string,
        status: ViaturaStatus,
        ocorrenciaId: string,
        token?: string
    ): Promise<void> {
        try {
            const url = `${SISGPO_API_URL}/api/admin/viaturas/${viaturaId}/status-integracao`;

            logger.info({
                msg: `[SISGPO Sync] Iniciando sincronização de status`,
                viaturaId,
                status,
                ocorrenciaId
            });

            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
            };

            // Se tiver token, adiciona ao header Authorization
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            await axios.patch(
                url,
                {
                    status,
                    ocorrenciaId
                },
                {
                    headers,
                    timeout: 5000, // 5 segundos de timeout
                }
            );

            logger.info({
                msg: `[SISGPO Sync] Status sincronizado com sucesso`,
                viaturaId,
                status
            });
        } catch (error: any) {
            // NÃO propagar o erro - apenas logar
            // O SCO não deve quebrar se o SISGPO estiver offline
            logger.error({
                msg: `[SISGPO Sync] FALHA ao sincronizar status (SISGPO pode estar offline)`,
                viaturaId,
                status,
                error: error.message,
                code: error.code,
                response: error.response?.data
            });
        }
    }

    /**
     * Marca viatura como EMPENHADA no SISGPO
     */
    async marcarViaturaEmpenhada(
        viaturaId: number | string,
        ocorrenciaId: string,
        token?: string
    ): Promise<void> {
        return this.syncViaturaStatus(viaturaId, 'EMPENHADA', ocorrenciaId, token);
    }

    /**
     * Marca viatura como DISPONIVEL no SISGPO
     */
    async marcarViaturaDisponivel(
        viaturaId: number | string,
        ocorrenciaId: string,
        token?: string
    ): Promise<void> {
        return this.syncViaturaStatus(viaturaId, 'DISPONIVEL', ocorrenciaId, token);
    }
}

export default new SisgpoSyncService();
