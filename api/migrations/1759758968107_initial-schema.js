/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = pgm => {
  // Comentários removidos, o código está ativo novamente.
  pgm.sql(`
    -- COMANDOS DE CRIAÇÃO (CREATE)

    CREATE TABLE crbms (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(100) NOT NULL UNIQUE
    );

    CREATE TABLE obms (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(100) NOT NULL UNIQUE,
        crbm_id INTEGER NOT NULL,
        CONSTRAINT fk_crbm_obm FOREIGN KEY(crbm_id) REFERENCES crbms(id) ON DELETE RESTRICT
    );

    CREATE TABLE usuarios (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        senha_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
        obm_id INTEGER,
        criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_usuario_obm FOREIGN KEY(obm_id) REFERENCES obms(id) ON DELETE SET NULL
    );

    CREATE TABLE solicitacoes_acesso (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        senha_hash VARCHAR(255) NOT NULL,
        obm_id INTEGER NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'recusado')),
        data_solicitacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        data_aprovacao TIMESTAMP WITH TIME ZONE,
        aprovador_id INTEGER,
        CONSTRAINT fk_solicitacao_obm FOREIGN KEY(obm_id) REFERENCES obms(id) ON DELETE CASCADE,
        CONSTRAINT fk_aprovador FOREIGN KEY(aprovador_id) REFERENCES usuarios(id) ON DELETE SET NULL
    );

    CREATE TABLE naturezas_ocorrencia (
        id SERIAL PRIMARY KEY,
        grupo VARCHAR(255) NOT NULL,
        subgrupo VARCHAR(255) NOT NULL,
        abreviacao VARCHAR(20),
        CONSTRAINT uq_grupo_subgrupo UNIQUE (grupo, subgrupo)
    );

    CREATE TABLE ocorrencias_detalhadas (
        id SERIAL PRIMARY KEY,
        numero_ocorrencia VARCHAR(100),
        natureza_id INTEGER NOT NULL,
        endereco TEXT,
        bairro VARCHAR(255),
        cidade_id INTEGER NOT NULL,
        viaturas TEXT,
        veiculos_envolvidos TEXT,
        dados_vitimas TEXT,
        resumo_ocorrencia TEXT,
        data_ocorrencia DATE NOT NULL,
        horario_ocorrencia TIME,
        usuario_id INTEGER,
        criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_natureza_detalhada FOREIGN KEY(natureza_id) REFERENCES naturezas_ocorrencia(id) ON DELETE RESTRICT,
        CONSTRAINT fk_cidade_detalhada FOREIGN KEY(cidade_id) REFERENCES obms(id) ON DELETE RESTRICT,
        CONSTRAINT fk_usuario_detalhada FOREIGN KEY(usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
    );

    CREATE TABLE ocorrencia_destaque (
        id INT PRIMARY KEY DEFAULT 1,
        ocorrencia_id INT UNIQUE,
        definido_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_ocorrencia_destaque FOREIGN KEY(ocorrencia_id) REFERENCES ocorrencias_detalhadas(id) ON DELETE SET NULL
    );

    CREATE TABLE supervisor_plantao (
        id INT PRIMARY KEY DEFAULT 1,
        usuario_id INT,
        definido_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_usuario FOREIGN KEY(usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
    );

    CREATE TABLE estatisticas_diarias (
        id SERIAL PRIMARY KEY,
        data_registro DATE NOT NULL,
        obm_id INTEGER NOT NULL,
        natureza_id INTEGER NOT NULL,
        quantidade INTEGER NOT NULL DEFAULT 0,
        usuario_id INTEGER,
        criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_obm_estatistica FOREIGN KEY(obm_id) REFERENCES obms(id) ON DELETE CASCADE,
        CONSTRAINT fk_natureza_estatistica FOREIGN KEY(natureza_id) REFERENCES naturezas_ocorrencia(id) ON DELETE CASCADE,
        CONSTRAINT fk_usuario_estatistica FOREIGN KEY(usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
        CONSTRAINT uq_dia_obm_natureza UNIQUE (data_registro, obm_id, natureza_id)
    );

    CREATE TABLE obitos_registros (
        id SERIAL PRIMARY KEY,
        data_ocorrencia DATE NOT NULL,
        natureza_id INTEGER NOT NULL,
        numero_ocorrencia VARCHAR(255),
        obm_id INTEGER NOT NULL,
        quantidade_vitimas INTEGER NOT NULL DEFAULT 1,
        usuario_id INTEGER,
        criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_natureza_obito_registro FOREIGN KEY(natureza_id) REFERENCES naturezas_ocorrencia(id) ON DELETE RESTRICT,
        CONSTRAINT fk_obm_obito_registro FOREIGN KEY(obm_id) REFERENCES obms(id) ON DELETE CASCADE,
        CONSTRAINT fk_usuario_obito_registro FOREIGN KEY(usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
    );

    -- INSERÇÕES INICIAIS DE CONTROLE
    INSERT INTO ocorrencia_destaque (id, ocorrencia_id) VALUES (1, NULL) ON CONFLICT (id) DO NOTHING;
    INSERT INTO supervisor_plantao (id, usuario_id) VALUES (1, NULL) ON CONFLICT (id) DO NOTHING;
  `);
};

exports.down = pgm => {
  pgm.sql(
    '-- 1. COMANDOS DE EXCLUSÃO (DROP) \n' +
    'DROP TABLE IF EXISTS auditoria_logs CASCADE; \n' +
    'DROP TABLE IF EXISTS ocorrencia_destaque CASCADE; \n' +
    'DROP TABLE IF EXISTS supervisor_plantao CASCADE; \n' +
    'DROP TABLE IF EXISTS obitos_registros CASCADE; \n' +
    'DROP TABLE IF EXISTS estatisticas_diarias CASCADE; \n' +
    'DROP TABLE IF EXISTS ocorrencias_detalhadas CASCADE; \n' +
    'DROP TABLE IF EXISTS solicitacoes_acesso CASCADE; \n' +
    'DROP TABLE IF EXISTS usuarios CASCADE; \n' +
    'DROP TABLE IF EXISTS obms CASCADE; \n' +
    'DROP TABLE IF EXISTS crbms CASCADE; \n' +
    'DROP TABLE IF EXISTS naturezas_ocorrencia CASCADE;'
  );
};
