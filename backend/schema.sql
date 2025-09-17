-- Arquivo: backend/schema.sql
-- Descrição: Define a estrutura completa do banco de dados para o Sistema de Controle de Ocorrências.
-- Para usar: Execute este script em um banco de dados PostgreSQL para criar todas as tabelas necessárias.

-- Remove as tabelas e TODOS os seus objetos dependentes (constraints, views, etc.)
-- A adição do CASCADE resolve erros de dependência ao recriar o schema.
DROP TABLE IF EXISTS supervisor_plantao CASCADE;
DROP TABLE IF EXISTS ocorrencia_destaque CASCADE;
DROP TABLE IF EXISTS obitos CASCADE;
DROP TABLE IF EXISTS ocorrencias CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;
DROP TABLE IF EXISTS obms CASCADE;
DROP TABLE IF EXISTS crbms CASCADE;
DROP TABLE IF EXISTS naturezas_ocorrencia CASCADE;

-- Tabela para os Comandos Regionais de Bombeiro Militar (CRBMs)
CREATE TABLE crbms (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE
);

-- Tabela para as Organizações Bombeiro Militar (OBMs)
-- Cada OBM pertence a um CRBM.
CREATE TABLE obms (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE,
    crbm_id INTEGER NOT NULL,
    CONSTRAINT fk_crbm
        FOREIGN KEY(crbm_id) 
        REFERENCES crbms(id)
        ON DELETE RESTRICT -- Impede a exclusão de um CRBM se ele tiver OBMs associadas
);

-- Tabela para as naturezas das ocorrências (ex: Incêndio, APH)
CREATE TABLE naturezas_ocorrencia (
    id SERIAL PRIMARY KEY,
    descricao VARCHAR(255) NOT NULL UNIQUE
);

-- Tabela de usuários (para os supervisores)
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela principal de ocorrências
CREATE TABLE ocorrencias (
    id SERIAL PRIMARY KEY,
    data_ocorrencia DATE NOT NULL,
    natureza_id INTEGER NOT NULL,
    obm_id INTEGER NOT NULL,
    quantidade_obitos INTEGER NOT NULL DEFAULT 0,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_natureza
        FOREIGN KEY(natureza_id) 
        REFERENCES naturezas_ocorrencia(id),
        
    CONSTRAINT fk_obm
        FOREIGN KEY(obm_id) 
        REFERENCES obms(id)
);

-- Tabela para os registros de óbitos, associados a uma ocorrência
CREATE TABLE obitos (
    id SERIAL PRIMARY KEY,
    ocorrencia_id INTEGER NOT NULL,
    nome_vitima VARCHAR(255),
    idade_vitima INTEGER,
    genero VARCHAR(50),
    
    CONSTRAINT fk_ocorrencia
        FOREIGN KEY(ocorrencia_id) 
        REFERENCES ocorrencias(id)
        ON DELETE CASCADE -- Se uma ocorrência for deletada, seus óbitos também serão.
);

-- Tabela para armazenar a Ocorrência de Destaque
-- Terá sempre no máximo uma linha, que será atualizada.
CREATE TABLE ocorrencia_destaque (
    id INT PRIMARY KEY DEFAULT 1,
    ocorrencia_id INT UNIQUE,
    definido_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ocorrencia
        FOREIGN KEY(ocorrencia_id) 
        REFERENCES ocorrencias(id)
        ON DELETE SET NULL -- Se a ocorrência for deletada, o destaque é removido (fica NULL).
);

-- Tabela para armazenar o Supervisor de Plantão
-- Também terá no máximo uma linha.
CREATE TABLE supervisor_plantao (
    id INT PRIMARY KEY DEFAULT 1,
    usuario_id INT,
    definido_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_usuario
        FOREIGN KEY(usuario_id) 
        REFERENCES usuarios(id)
        ON DELETE SET NULL -- Se o usuário for deletado, o campo fica NULL.
);

-- Inserção das linhas de configuração padrão para as tabelas de gestão.
-- A cláusula ON CONFLICT DO NOTHING impede erros se as linhas já existirem.
INSERT INTO ocorrencia_destaque (id, ocorrencia_id) VALUES (1, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO supervisor_plantao (id, usuario_id) VALUES (1, NULL) ON CONFLICT (id) DO NOTHING;
