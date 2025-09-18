-- Arquivo: backend/schema.sql
-- Descrição: Define a estrutura completa do banco de dados para o Sistema de Controle de Ocorrências.
-- Versão 3.0: Remove a tabela OBMs, simplificando a hierarquia para CRBM -> Cidade.

-- Remove as tabelas na ordem correta de dependência
DROP TABLE IF EXISTS supervisor_plantao CASCADE;
DROP TABLE IF EXISTS ocorrencia_destaque CASCADE;
DROP TABLE IF EXISTS obitos CASCADE;
DROP TABLE IF EXISTS ocorrencias CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;
DROP TABLE IF EXISTS obms CASCADE; -- Mantido aqui para garantir a limpeza na primeira execução
DROP TABLE IF EXISTS cidades CASCADE;
DROP TABLE IF EXISTS crbms CASCADE;
DROP TABLE IF EXISTS naturezas_ocorrencia CASCADE;

-- Tabela para os Comandos Regionais de Bombeiro Militar (CRBMs)
CREATE TABLE crbms (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE
);

-- Tabela de Cidades
-- Cada cidade pertence a um CRBM. A cidade agora é a unidade principal.
CREATE TABLE cidades (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE,
    crbm_id INTEGER NOT NULL,
    CONSTRAINT fk_crbm_cidade
        FOREIGN KEY(crbm_id) 
        REFERENCES crbms(id)
        ON DELETE RESTRICT
);

-- Tabela para as naturezas das ocorrências
CREATE TABLE naturezas_ocorrencia (
    id SERIAL PRIMARY KEY,
    descricao VARCHAR(255) NOT NULL UNIQUE
);

-- Tabela de usuários
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela principal de ocorrências
-- MODIFICADA: Agora se relaciona com 'cidade_id' em vez de 'obm_id'.
CREATE TABLE ocorrencias (
    id SERIAL PRIMARY KEY,
    data_ocorrencia DATE NOT NULL,
    natureza_id INTEGER NOT NULL,
    cidade_id INTEGER NOT NULL, -- Alterado de obm_id para cidade_id
    quantidade_obitos INTEGER NOT NULL DEFAULT 0,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_natureza
        FOREIGN KEY(natureza_id) 
        REFERENCES naturezas_ocorrencia(id),
        
    CONSTRAINT fk_cidade -- Constraint renomeada
        FOREIGN KEY(cidade_id) 
        REFERENCES cidades(id)
);

-- Tabela para os registros de óbitos (sem alterações)
CREATE TABLE obitos (
    id SERIAL PRIMARY KEY,
    ocorrencia_id INTEGER NOT NULL,
    nome_vitima VARCHAR(255),
    idade_vitima INTEGER,
    genero VARCHAR(50),
    
    CONSTRAINT fk_ocorrencia
        FOREIGN KEY(ocorrencia_id) 
        REFERENCES ocorrencias(id)
        ON DELETE CASCADE
);

-- Tabela para armazenar a Ocorrência de Destaque (sem alterações na estrutura)
CREATE TABLE ocorrencia_destaque (
    id INT PRIMARY KEY DEFAULT 1,
    ocorrencia_id INT UNIQUE,
    definido_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ocorrencia
        FOREIGN KEY(ocorrencia_id) 
        REFERENCES ocorrencias(id)
        ON DELETE SET NULL
);

-- Tabela para armazenar o Supervisor de Plantão (sem alterações)
CREATE TABLE supervisor_plantao (
    id INT PRIMARY KEY DEFAULT 1,
    usuario_id INT,
    definido_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_usuario
        FOREIGN KEY(usuario_id) 
        REFERENCES usuarios(id)
        ON DELETE SET NULL
);

-- Inserção das linhas de configuração padrão
INSERT INTO ocorrencia_destaque (id, ocorrencia_id) VALUES (1, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO supervisor_plantao (id, usuario_id) VALUES (1, NULL) ON CONFLICT (id) DO NOTHING;
