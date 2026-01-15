"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_cache_1 = __importDefault(require("node-cache"));
const logger_1 = __importDefault(require("../config/logger"));
class CacheService {
    constructor() {
        // Configuração padrão: TTL 60 segundos
        this.cache = new node_cache_1.default({ stdTTL: 60, checkperiod: 120 });
        logger_1.default.info('[CacheService] Initialized with stdTTL: 60s');
    }
    static getInstance() {
        if (!CacheService.instance) {
            CacheService.instance = new CacheService();
        }
        return CacheService.instance;
    }
    /**
     * Recupera um item do cache
     * @param key Chave única
     */
    get(key) {
        const value = this.cache.get(key);
        if (value !== undefined) {
            logger_1.default.info({ key }, 'Cache Hit');
        }
        else {
            logger_1.default.info({ key }, 'Cache Miss');
        }
        return value;
    }
    /**
     * Salva um item no cache
     * @param key Chave única
     * @param value Dado a ser salvo
     * @param ttl Tempo de vida em segundos (opcional)
     */
    set(key, value, ttl) {
        if (ttl) {
            return this.cache.set(key, value, ttl);
        }
        return this.cache.set(key, value);
    }
    /**
     * Remove um item do cache
     * @param key Chave única
     */
    del(key) {
        return this.cache.del(key);
    }
    /**
     * Limpa todo o cache (útil para testes ou reset)
     */
    flush() {
        this.cache.flushAll();
        logger_1.default.info('[CacheService] Cache flushed');
    }
}
exports.default = CacheService.getInstance();
