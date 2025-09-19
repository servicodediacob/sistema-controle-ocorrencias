-- Arquivo: backend/src/db/schema.sql
-- Descrição: Define a estrutura completa do banco de dados para o Sistema de Controle de Ocorrências.
-- Versão 6.0: Adiciona a tabela de estatísticas e corrige a ordem de criação/exclusão.

-- 1. COMANDOS DE EXCLUSÃO (DROP)
-- A ordem de exclusão é o INVERSO da ordem de criação.
DROP TABLE IF EXISTS estatisticas_diarias CASCADE;
DROP TABLE IF EXISTS supervisor_plantao CASCADE;
DROP TABLE IF EXISTS ocorrencia_destaque CASCADE;
DROP TABLE IF EXISTS obitos CASCADE;
DROP TABLE IF EXISTS ocorrencias CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;
DROP TABLE IF EXISTS cidades CASCADE;
DROP TABLE IF EXISTS crbms CASCADE;
DROP TABLE IF EXISTS naturezas_ocorrencia CASCADE;

-- 2. COMANDOS DE CRIAÇÃO (CREATE)

-- Tabelas sem dependências
CREATE TABLE crbms (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE naturezas_ocorrencia (
    id SERIAL PRIMARY KEY,
    grupo VARCHAR(255) NOT NULL,
    subgrupo VARCHAR(255) NOT NULL,
    CONSTRAINT uq_grupo_subgrupo UNIQUE (grupo, subgrupo)
);

CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabelas com dependências
CREATE TABLE cidades (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE,
    crbm_id INTEGER NOT NULL,
    CONSTRAINT fk_crbm_cidade FOREIGN KEY(crbm_id) REFERENCES crbms(id) ON DELETE RESTRICT
);

CREATE TABLE ocorrencias (
    id SERIAL PRIMARY KEY,
    data_ocorrencia DATE NOT NULL,
    natureza_id INTEGER NOT NULL,
    cidade_id INTEGER NOT NULL,
    quantidade_obitos INTEGER NOT NULL DEFAULT 0,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_natureza FOREIGN KEY(natureza_id) REFERENCES naturezas_ocorrencia(id),
    CONSTRAINT fk_cidade FOREIGN KEY(cidade_id) REFERENCES cidades(id)
);

CREATE TABLE obitos (
    id SERIAL PRIMARY KEY,
    ocorrencia_id INTEGER NOT NULL,
    nome_vitima VARCHAR(255),
    idade_vitima INTEGER,
    genero VARCHAR(50),
    CONSTRAINT fk_ocorrencia FOREIGN KEY(ocorrencia_id) REFERENCES ocorrencias(id) ON DELETE CASCADE
);

CREATE TABLE ocorrencia_destaque (
    id INT PRIMARY KEY DEFAULT 1,
    ocorrencia_id INT UNIQUE,
    definido_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ocorrencia FOREIGN KEY(ocorrencia_id) REFERENCES ocorrencias(id) ON DELETE SET NULL
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
    cidade_id INTEGER NOT NULL,
    natureza_id INTEGER NOT NULL,
    quantidade INTEGER NOT NULL DEFAULT 0,
    usuario_id INTEGER,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_cidade_estatistica FOREIGN KEY(cidade_id) REFERENCES cidades(id) ON DELETE CASCADE,
    CONSTRAINT fk_natureza_estatistica FOREIGN KEY(natureza_id) REFERENCES naturezas_ocorrencia(id) ON DELETE CASCADE,
    CONSTRAINT fk_usuario_estatistica FOREIGN KEY(usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    
    CONSTRAINT uq_dia_cidade_natureza UNIQUE (data_registro, cidade_id, natureza_id)
);

-- 3. INSERÇÕES INICIAIS
INSERT INTO ocorrencia_destaque (id, ocorrencia_id) VALUES (1, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO supervisor_plantao (id, usuario_id) VALUES (1, NULL) ON CONFLICT (id) DO NOTHING;
