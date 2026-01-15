"use strict";
// api/src/controllers/acessoController.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.gerenciarSolicitacao = exports.solicitarAcessoGoogle = exports.listarSolicitacoes = exports.solicitarAcesso = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_1 = require("../lib/prisma");
const socketService_1 = require("../services/socketService");
const logger_1 = __importDefault(require("../config/logger"));
const solicitarAcesso = async (req, res) => {
    const { nome, email, senha, obm_id } = req.body;
    if (!nome || !email || !senha || !obm_id) {
        res.status(400).json({ message: 'Todos os campos sao obrigatorios: nome, email, senha e OBM.' });
        return;
    }
    try {
        // O Prisma pode verificar em multiplas tabelas de forma mais complexa,
        // mas para este caso, duas consultas separadas sao claras e eficientes.
        const usuarioExistente = await prisma_1.prisma.usuario.findUnique({ where: { email } });
        const solicitacaoExistente = await prisma_1.prisma.solicitacaoAcesso.findUnique({ where: { email } });
        if (usuarioExistente || solicitacaoExistente) {
            res.status(409).json({ message: 'Este endereco de e-mail ja esta em uso ou aguardando aprovacao.' });
            return;
        }
        const salt = await bcryptjs_1.default.genSalt(10);
        const senha_hash = await bcryptjs_1.default.hash(senha, salt);
        const novaSolicitacao = await prisma_1.prisma.solicitacaoAcesso.create({
            data: {
                nome,
                email,
                senha_hash,
                obm_id: Number(obm_id),
                status: 'pendente',
            },
            select: { id: true, nome: true, email: true, data_solicitacao: true },
        });
        logger_1.default.info({ solicitacao: novaSolicitacao }, 'Nova solicitacao de acesso recebida.');
        res.status(201).json({
            message: 'Solicitacao de acesso enviada com sucesso! Aguarde a aprovacao de um administrador.',
            solicitacao: novaSolicitacao,
        });
    }
    catch (error) {
        logger_1.default.error({ err: error }, 'Erro ao criar solicitacao de acesso.');
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};
exports.solicitarAcesso = solicitarAcesso;
const listarSolicitacoes = async (_req, res) => {
    try {
        const solicitacoes = await prisma_1.prisma.solicitacaoAcesso.findMany({
            include: {
                obm: { select: { nome: true } }, // Inclui o nome da OBM
            },
            orderBy: {
                data_solicitacao: 'desc',
            },
        });
        // Formata a resposta para manter a compatibilidade com o frontend, se necessario
        const resultadoFormatado = solicitacoes.map(s => ({
            ...s,
            obm_nome: s.obm.nome,
        }));
        res.status(200).json(resultadoFormatado);
    }
    catch (error) {
        logger_1.default.error({ err: error }, 'Erro ao listar solicitacoes de acesso.');
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};
exports.listarSolicitacoes = listarSolicitacoes;
// Solicitacao de acesso via Google (gera senha aleatoria para cumprir o schema atual)
const solicitarAcessoGoogle = async (req, res) => {
    const { nome, email, obm_id } = req.body;
    if (!nome || !email || !obm_id) {
        res.status(400).json({ message: 'Campos obrigatorios: nome, email, obm_id.' });
        return;
    }
    try {
        const usuarioExistente = await prisma_1.prisma.usuario.findUnique({ where: { email } });
        const solicitacaoExistente = await prisma_1.prisma.solicitacaoAcesso.findUnique({ where: { email } });
        if (usuarioExistente || solicitacaoExistente) {
            res.status(409).json({ message: 'Ja existe usuario ou solicitacao pendente para este email.', code: 'SOLICITACAO_EXISTENTE' });
            return;
        }
        const senhaRandom = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
        const salt = await bcryptjs_1.default.genSalt(10);
        const senha_hash = await bcryptjs_1.default.hash(senhaRandom, salt);
        const novaSolicitacao = await prisma_1.prisma.solicitacaoAcesso.create({
            data: { nome, email, senha_hash, obm_id: Number(obm_id), status: 'pendente' },
            select: { id: true, nome: true, email: true, data_solicitacao: true },
        });
        try {
            (0, socketService_1.notifyAdmins)('acesso:solicitacao-nova', { id: novaSolicitacao.id, nome, email });
        }
        catch (notifyError) {
            logger_1.default.warn({ err: notifyError }, 'Falha ao notificar admins sobre nova solicitacao Google.');
        }
        res.status(201).json({ message: 'Solicitacao enviada! Aguarde aprovacao de um administrador.', solicitacao: novaSolicitacao });
    }
    catch (error) {
        logger_1.default.error({ err: error }, 'Erro ao criar solicitacao de acesso (google).');
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};
exports.solicitarAcessoGoogle = solicitarAcessoGoogle;
const gerenciarSolicitacao = async (req, res) => {
    const { id } = req.params;
    const { acao } = req.body;
    const aprovador_id = req.usuario?.id;
    if (!acao || !['aprovar', 'recusar'].includes(acao)) {
        res.status(400).json({ message: "A acao e obrigatoria e deve ser 'aprovar' ou 'recusar'." });
        return;
    }
    try {
        const solicitacao = await prisma_1.prisma.solicitacaoAcesso.findFirst({
            where: { id: Number(id), status: 'pendente' },
        });
        if (!solicitacao) {
            res.status(404).json({ message: 'Solicitacao nao encontrada ou ja processada.' });
            return;
        }
        if (acao === 'aprovar') {
            // Usamos uma transacao para garantir que ambas as operacoes (criar usuario e atualizar solicitacao)
            // sejam concluidas com sucesso. Se uma falhar, a outra e revertida.
            await prisma_1.prisma.$transaction(async (tx) => {
                await tx.usuario.create({
                    data: {
                        nome: solicitacao.nome,
                        email: solicitacao.email,
                        senha_hash: solicitacao.senha_hash,
                        role: 'user',
                        obm_id: solicitacao.obm_id,
                    },
                });
                await tx.solicitacaoAcesso.update({
                    where: { id: solicitacao.id },
                    data: {
                        status: 'aprovado',
                        aprovador_id,
                        data_aprovacao: new Date(),
                    },
                });
            });
            logger_1.default.info({ aprovadorId: aprovador_id, solicitacaoId: id }, `Usuario ${solicitacao.nome} aprovado e criado.`);
            res.status(200).json({ message: `Usuario ${solicitacao.nome} aprovado e criado com sucesso.` });
        }
        else { // acao === 'recusar'
            await prisma_1.prisma.solicitacaoAcesso.update({
                where: { id: solicitacao.id },
                data: {
                    status: 'recusado',
                    aprovador_id,
                    data_aprovacao: new Date(),
                },
            });
            logger_1.default.info({ aprovadorId: aprovador_id, solicitacaoId: id }, `Solicitacao de ${solicitacao.nome} recusada.`);
            res.status(200).json({ message: `Solicitacao de ${solicitacao.nome} recusada.` });
        }
    }
    catch (error) {
        // O Prisma ja faz o rollback da transacao automaticamente em caso de erro.
        logger_1.default.error({ err: error, solicitacaoId: id }, 'Erro ao gerenciar solicitacao.');
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};
exports.gerenciarSolicitacao = gerenciarSolicitacao;
// FORCAR PUSH ENV.LOCAL-- revertido
