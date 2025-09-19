#!/bin/bash

# --- Configurações ---
PROD_DB_URL="postgresql://neondb_owner:npg_xyjXd1JtgDz5@ep-misty-credit-adgd7d5b-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"
LOCAL_DB_USER="postgres"
LOCAL_DB_PASS="22091975"
LOCAL_DB_HOST="localhost"
LOCAL_DB_NAME="sistema_ocorrencias_dev"
BACKUP_FILE="producao_backup.sql"

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# --- Início do Script ---

echo -e "${YELLOW}--- INICIANDO SCRIPT DE SINCRONIZAÇÃO DE BANCO DE DADOS ---${NC}"
echo "Este script irá substituir o banco de dados local (${LOCAL_DB_NAME}) com os dados do banco de produção."
echo ""

read -p "Você tem certeza que deseja continuar? (s/n): " confirm
if [[ "$confirm" != "s" && "$confirm" != "S" ]]; then
    echo -e "${RED}Operação cancelada pelo usuário.${NC}"
    exit 1
fi

# --- Etapa 1: Backup do Banco de Dados de Produção ---
echo ""
echo -e "${GREEN}==> PASSO 1: Criando backup do banco de dados de PRODUÇÃO...${NC}"
echo "Isso pode levar alguns minutos."

pg_dump "$PROD_DB_URL" -F c -b -v -f "$BACKUP_FILE"
if [ $? -ne 0 ]; then
    echo -e "${RED}ERRO: Falha ao criar o backup do banco de produção. Abortando.${NC}"
    exit 1
fi
echo -e "${GREEN}Backup '$BACKUP_FILE' criado com sucesso!${NC}"

# --- Etapa 2: Apagar e Recriar o Banco de Dados Local ---
echo ""
echo -e "${GREEN}==> PASSO 2: Apagando e recriando o banco de dados LOCAL (${LOCAL_DB_NAME})...${NC}"

export PGPASSWORD=$LOCAL_DB_PASS
dropdb -h $LOCAL_DB_HOST -U $LOCAL_DB_USER $LOCAL_DB_NAME --if-exists
createdb -h $LOCAL_DB_HOST -U $LOCAL_DB_USER -O $LOCAL_DB_USER $LOCAL_DB_NAME
if [ $? -ne 0 ]; then
    echo -e "${RED}ERRO: Falha ao criar o banco de dados local. Abortando.${NC}"
    unset PGPASSWORD
    exit 1
fi
echo -e "${GREEN}Banco de dados local recriado com sucesso.${NC}"

# --- Etapa 3: Restaurar o Backup no Banco Local (LÓGICA APRIMORADA) ---
echo ""
echo -e "${GREEN}==> PASSO 3: Restaurando os dados no banco local...${NC}"

# Captura a saída de erro (stderr) do pg_restore para uma variável
restore_output=$(pg_restore --verbose --clean --no-acl --no-owner -h $LOCAL_DB_HOST -U $LOCAL_DB_USER -d $LOCAL_DB_NAME "$BACKUP_FILE" 2>&1)

# Exibe a saída para o usuário
echo "$restore_output"

# Verifica se a saída contém erros CRÍTICOS (excluindo os erros inofensivos de "não existe")
# O comando `grep -v` filtra as linhas que NÃO contêm "não existe"
# O comando `grep -E` procura por padrões de erro real
if echo "$restore_output" | grep -v "não existe" | grep -E -q "ERRO|FATAL|PANIC"; then
    echo -e "${RED}ERRO CRÍTICO: A restauração falhou com um erro inesperado. Verifique os logs acima.${NC}"
    unset PGPASSWORD
    exit 1
fi

# Limpeza final
unset PGPASSWORD
rm "$BACKUP_FILE"

echo ""
echo -e "${GREEN}--- SINCRONIZAÇÃO CONCLUÍDA COM SUCESSO! ---${NC}"
echo "O banco de dados local '${LOCAL_DB_NAME}' agora é um espelho da produção."
echo "O arquivo de backup temporário foi removido."

exit 0
