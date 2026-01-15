"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.proxySisgpoRequest = void 0;
const axios_1 = __importDefault(require("axios"));
const logger_1 = __importDefault(require("../config/logger"));
const crypto_1 = __importDefault(require("crypto"));
const cacheService_1 = __importDefault(require("../services/cacheService"));
const sisgpoAuthService_1 = require("../services/sisgpoAuthService");
const SISGPO_API_URL = (process.env.SISGPO_API_URL || 'http://localhost:3333').trim();
// Estratégia de Cache (TTL em segundos)
const CACHE_TTL_MAP = {
    '/admin/viaturas': 15, // Dinâmico: atualização rápida
    '/admin/plantoes': 15, // Dinâmico: status de plantão pode mudar
    '/admin/obms': 300, // Estático: muda raramente
    '/admin/militares': 300, // Estático
    '/admin/civis': 300, // Estático
    '/admin/aeronaves': 300, // Estático
    '/admin/metadata': 300,
};
const getCacheTTL = (path) => {
    // Verifica se o caminho começa com algum prefixo mapeado
    const match = Object.keys(CACHE_TTL_MAP).find((prefix) => path.startsWith(prefix));
    return match ? CACHE_TTL_MAP[match] : 60; // Default 60s
};
const ALLOWED_PREFIXES = [
    '/admin/plantoes',
    '/admin/viaturas',
    '/admin/obms',
    '/admin/militares',
    '/admin/escala-medicos',
    '/admin/escala-aeronaves',
    '/admin/escala-codec',
    '/admin/civis',
    '/admin/aeronaves',
    '/admin/metadata',
];
const isPathAllowed = (path) => ALLOWED_PREFIXES.some((prefix) => path.startsWith(prefix));
const normalizeProxyPath = (wildcard) => {
    const suffix = wildcard ? `/${wildcard.replace(/^\/+/, '')}` : '';
    return suffix || '';
};
const proxySisgpoRequest = async (req, res) => {
    if (!req.usuario) {
        res.status(401).json({ message: 'Usuário não autenticado.' });
        return;
    }
    const wildcardPath = normalizeProxyPath(req.params[0]);
    if (!wildcardPath || !isPathAllowed(wildcardPath)) {
        res.status(400).json({ message: 'Rota do SISGPO não permitida para proxy.' });
        return;
    }
    let sisgpoJwt;
    try {
        sisgpoJwt = await (0, sisgpoAuthService_1.fetchSisgpoSessionToken)(req.usuario);
    }
    catch (error) {
        const isConnectionError = error?.code === 'ECONNREFUSED' || error?.code === 'ENOTFOUND';
        let message;
        if (isConnectionError) {
            message = 'Não foi possível conectar ao SISGPO. Verifique se o serviço está rodando.';
        }
        else if (error instanceof Error) {
            message = error.message;
        }
        else {
            message = 'Falha ao autenticar no SISGPO via SSO.';
        }
        res.status(503).json({ message });
        return;
    }
    const targetUrl = `${SISGPO_API_URL}/api${wildcardPath}`;
    const isGetRequest = req.method === 'GET';
    // -- Lógica de Cache (Leitura) --
    // Cria uma chave única baseada no caminho e nos parâmetros (ex: filtros de busca)
    let cacheKey = '';
    if (isGetRequest) {
        const paramsHash = crypto_1.default.createHash('md5').update(JSON.stringify(req.query)).digest('hex');
        cacheKey = `sisgpo:${wildcardPath}:${paramsHash}`;
        const cachedResponse = cacheService_1.default.get(cacheKey);
        if (cachedResponse) {
            // logger.info is handled inside cacheService.get usually, but we can log specific proxy hit here if needed
            res.json(cachedResponse);
            return;
        }
    }
    // Log the request details for debugging
    logger_1.default.info({
        targetUrl,
        method: req.method,
        params: req.query,
        wildcardPath,
        sisgpoApiUrl: SISGPO_API_URL,
        cacheKey: isGetRequest ? cacheKey : undefined,
    }, '[SISGPO Proxy] Forwarding request to SISGPO');
    const incomingIfMatch = req.headers['if-match'];
    const contentType = req.headers['content-type'];
    const isMultipart = typeof contentType === 'string' && contentType.startsWith('multipart/form-data');
    const outgoingHeaders = {
        Authorization: `Bearer ${sisgpoJwt}`,
        'Content-Type': contentType,
    };
    if (typeof incomingIfMatch === 'string' && incomingIfMatch.trim()) {
        outgoingHeaders['If-Match'] = incomingIfMatch;
    }
    // Para JSON/urlencoded usamos req.body (já parseado). Para multipart encaminhamos o stream bruto.
    const data = isMultipart ? req : req.body;
    try {
        const response = await axios_1.default.request({
            method: req.method,
            url: targetUrl,
            params: req.query,
            data,
            headers: outgoingHeaders,
            validateStatus: () => true,
        });
        const eTagValue = response.headers?.etag ??
            response.headers?.ETag;
        if (eTagValue) {
            res.setHeader('ETag', eTagValue);
        }
        if (response.status === 204) {
            res.sendStatus(204);
            return;
        }
        // -- Lógica de Cache (Escrita) --
        // Armazena no cache apenas se for GET e status 200
        if (isGetRequest && response.status === 200) {
            const ttl = getCacheTTL(wildcardPath);
            cacheService_1.default.set(cacheKey, response.data, ttl);
            logger_1.default.debug({ key: cacheKey, ttl }, '[SISGPO Proxy] Response cached');
        }
        res.status(response.status).json(response.data);
    }
    catch (error) {
        const axiosError = error;
        const status = axiosError.response?.status ?? 500;
        const data = axiosError.response?.data ??
            { message: 'Erro ao comunicar com o SISGPO.', details: axiosError.message };
        logger_1.default.error({ err: axiosError, path: wildcardPath }, '[SISGPO] Falha ao proxiar requisição.');
        if (status === 204) {
            res.sendStatus(204);
        }
        else {
            res.status(status).json(data);
        }
    }
};
exports.proxySisgpoRequest = proxySisgpoRequest;
