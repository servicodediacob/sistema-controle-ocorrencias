-- CreateEnum
CREATE TYPE "Role" AS ENUM ('user', 'admin');

-- CreateEnum
CREATE TYPE "SolicitacaoStatus" AS ENUM ('pendente', 'aprovado', 'recusado');

-- CreateTable
CREATE TABLE "crbms" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(100) NOT NULL,

    CONSTRAINT "crbms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "obms" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "crbm_id" INTEGER NOT NULL,

    CONSTRAINT "obms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "senha_hash" VARCHAR(255) NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'user',
    "obm_id" INTEGER,
    "criado_em" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "solicitacoes_acesso" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "senha_hash" VARCHAR(255) NOT NULL,
    "obm_id" INTEGER NOT NULL,
    "status" "SolicitacaoStatus" NOT NULL DEFAULT 'pendente',
    "data_solicitacao" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "data_aprovacao" TIMESTAMPTZ,
    "aprovador_id" INTEGER,

    CONSTRAINT "solicitacoes_acesso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "naturezas_ocorrencia" (
    "id" SERIAL NOT NULL,
    "grupo" VARCHAR(255) NOT NULL,
    "subgrupo" VARCHAR(255) NOT NULL,
    "abreviacao" VARCHAR(20),

    CONSTRAINT "naturezas_ocorrencia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ocorrencias_detalhadas" (
    "id" SERIAL NOT NULL,
    "numero_ocorrencia" VARCHAR(100),
    "natureza_id" INTEGER NOT NULL,
    "endereco" TEXT,
    "bairro" VARCHAR(255),
    "cidade_id" INTEGER NOT NULL,
    "viaturas" TEXT,
    "veiculos_envolvidos" TEXT,
    "dados_vitimas" TEXT,
    "resumo_ocorrencia" TEXT,
    "data_ocorrencia" DATE NOT NULL,
    "horario_ocorrencia" TIME,
    "usuario_id" INTEGER,
    "criado_em" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ocorrencias_detalhadas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ocorrencia_destaque" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "ocorrencia_id" INTEGER,
    "definido_em" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ocorrencia_destaque_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supervisor_plantao" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "usuario_id" INTEGER,
    "definido_em" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "supervisor_plantao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estatisticas_diarias" (
    "id" SERIAL NOT NULL,
    "data_registro" DATE NOT NULL,
    "obm_id" INTEGER NOT NULL,
    "natureza_id" INTEGER NOT NULL,
    "quantidade" INTEGER NOT NULL DEFAULT 0,
    "usuario_id" INTEGER,
    "criado_em" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "estatisticas_diarias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "obitos_registros" (
    "id" SERIAL NOT NULL,
    "data_ocorrencia" DATE NOT NULL,
    "natureza_id" INTEGER NOT NULL,
    "numero_ocorrencia" VARCHAR(255),
    "obm_id" INTEGER NOT NULL,
    "quantidade_vitimas" INTEGER NOT NULL DEFAULT 1,
    "usuario_id" INTEGER,
    "criado_em" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "obitos_registros_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "crbms_nome_key" ON "crbms"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "obms_nome_key" ON "obms"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "solicitacoes_acesso_email_key" ON "solicitacoes_acesso"("email");

-- CreateIndex
CREATE UNIQUE INDEX "naturezas_ocorrencia_grupo_subgrupo_key" ON "naturezas_ocorrencia"("grupo", "subgrupo");

-- CreateIndex
CREATE UNIQUE INDEX "ocorrencia_destaque_ocorrencia_id_key" ON "ocorrencia_destaque"("ocorrencia_id");

-- CreateIndex
CREATE UNIQUE INDEX "supervisor_plantao_usuario_id_key" ON "supervisor_plantao"("usuario_id");

-- CreateIndex
CREATE UNIQUE INDEX "estatisticas_diarias_data_registro_obm_id_natureza_id_key" ON "estatisticas_diarias"("data_registro", "obm_id", "natureza_id");

-- AddForeignKey
ALTER TABLE "obms" ADD CONSTRAINT "obms_crbm_id_fkey" FOREIGN KEY ("crbm_id") REFERENCES "crbms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_obm_id_fkey" FOREIGN KEY ("obm_id") REFERENCES "obms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitacoes_acesso" ADD CONSTRAINT "solicitacoes_acesso_obm_id_fkey" FOREIGN KEY ("obm_id") REFERENCES "obms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitacoes_acesso" ADD CONSTRAINT "solicitacoes_acesso_aprovador_id_fkey" FOREIGN KEY ("aprovador_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ocorrencias_detalhadas" ADD CONSTRAINT "ocorrencias_detalhadas_natureza_id_fkey" FOREIGN KEY ("natureza_id") REFERENCES "naturezas_ocorrencia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ocorrencias_detalhadas" ADD CONSTRAINT "ocorrencias_detalhadas_cidade_id_fkey" FOREIGN KEY ("cidade_id") REFERENCES "obms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ocorrencias_detalhadas" ADD CONSTRAINT "ocorrencias_detalhadas_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ocorrencia_destaque" ADD CONSTRAINT "ocorrencia_destaque_ocorrencia_id_fkey" FOREIGN KEY ("ocorrencia_id") REFERENCES "ocorrencias_detalhadas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supervisor_plantao" ADD CONSTRAINT "supervisor_plantao_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estatisticas_diarias" ADD CONSTRAINT "estatisticas_diarias_obm_id_fkey" FOREIGN KEY ("obm_id") REFERENCES "obms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estatisticas_diarias" ADD CONSTRAINT "estatisticas_diarias_natureza_id_fkey" FOREIGN KEY ("natureza_id") REFERENCES "naturezas_ocorrencia"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estatisticas_diarias" ADD CONSTRAINT "estatisticas_diarias_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "obitos_registros" ADD CONSTRAINT "obitos_registros_natureza_id_fkey" FOREIGN KEY ("natureza_id") REFERENCES "naturezas_ocorrencia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "obitos_registros" ADD CONSTRAINT "obitos_registros_obm_id_fkey" FOREIGN KEY ("obm_id") REFERENCES "obms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "obitos_registros" ADD CONSTRAINT "obitos_registros_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
