import NodeCache from 'node-cache';
import logger from '@/config/logger';

class CacheService {
  private static instance: CacheService;
  private cache: NodeCache;

  private constructor() {
    // Configuração padrão: TTL 60 segundos
    this.cache = new NodeCache({ stdTTL: 60, checkperiod: 120 });
    logger.info('[CacheService] Initialized with stdTTL: 60s');
  }

  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  /**
   * Recupera um item do cache
   * @param key Chave única
   */
  public get<T>(key: string): T | undefined {
    const value = this.cache.get<T>(key);
    if (value !== undefined) {
      logger.info({ key }, 'Cache Hit');
    } else {
      logger.info({ key }, 'Cache Miss');
    }
    return value;
  }

  /**
   * Salva um item no cache
   * @param key Chave única
   * @param value Dado a ser salvo
   * @param ttl Tempo de vida em segundos (opcional)
   */
  public set<T>(key: string, value: T, ttl?: number): boolean {
    if (ttl) {
      return this.cache.set(key, value, ttl);
    }
    return this.cache.set(key, value);
  }

  /**
   * Remove um item do cache
   * @param key Chave única
   */
  public del(key: string): number {
    return this.cache.del(key);
  }

  /**
   * Limpa todo o cache (útil para testes ou reset)
   */
  public flush(): void {
    this.cache.flushAll();
    logger.info('[CacheService] Cache flushed');
  }
}

export default CacheService.getInstance();
