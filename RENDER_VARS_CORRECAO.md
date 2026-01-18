# 🔧 Correção das Variáveis do Render

## ❌ VARIÁVEIS QUE PRECISAM SER CORRIGIDAS

### 1. DIRECT_DATABASE_URL
**Status:** ❌ INCORRETO  
**Problema:** Está usando o pooler em vez da conexão direta

**Valor ATUAL (ERRADO):**
```
postgresql://postgres.rqhzudbbmsximjfvndyd:Cbmgo-Cob%402026@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?sslmode=require&connect_timeout=10
```

**Valor CORRETO:**
```
postgresql://postgres:[PASSWORD]@db.rqhzudbbmsximjfvndyd.supabase.co:5432/postgres
```

**Diferenças:**
- ❌ `postgres.rqhzudbbmsximjfvndyd` → ✅ `postgres` (remove prefixo)
- ❌ `aws-1-sa-east-1.pooler.supabase.com:6543` → ✅ `db.rqhzudbbmsximjfvndyd.supabase.co:5432`
- ❌ Remove `?sslmode=require&connect_timeout=10` (não precisa desses params na direta)

---

### 2. MIGRATE_USE_DIRECT
**Status:** ❌ INCORRETO  
**Valor ATUAL:** `false`  
**Valor CORRETO:** `true`

---

## ➕ VARIÁVEIS QUE PRECISAM SER ADICIONADAS

### 3. SUPABASE_URL
**Status:** ❌ FALTANDO  
**Valor:**
```
https://rqhzudbbmsximjfvndyd.supabase.co
```

### 4. SUPABASE_ANON_KEY
**Status:** ❌ FALTANDO  
**Valor:**
```
<VER_NO_PAINEL_DO_SUPABASE_OU_NO_.ENV_LOCAL>
```

### 5. SUPABASE_SERVICE_ROLE_KEY
**Status:** ❌ FALTANDO  
**Valor:**
```
<VER_NO_PAINEL_DO_SUPABASE_OU_NO_.ENV_LOCAL>
```

---

## ⚠️ VARIÁVEL COM VALOR DIFERENTE DO LOCAL

### 6. JWT_SECRET
**No Render:** `Cbmgoa193`  
**No .env local:** `cbmgo-sistema-ocorrencias-secret-key-2026-super-secure`

**Recomendação:** Manter como está no Render OU padronizar para o valor local (mais seguro).  
Se alterado, precisa redeployar frontend também.

---

## ✅ VARIÁVEIS CORRETAS (NÃO MEXER)

- ✅ ALLOW_SCHEMA_RESET = false
- ✅ CORS_ORIGINS = (múltiplos domínios corretos)
- ✅ DATABASE_URL = (pooler correto para runtime)
- ✅ GOOGLE_CLIENT_ID = <VER_NO_.ENV_OU_GOOGLE_CLOUD_CONSOLE>
- ✅ GOOGLE_CLIENT_SECRET = (oculto, provavelmente correto)
- ✅ LOG_LEVEL = info
- ✅ NODE_ENV = production
- ✅ PORT = 3001
- ✅ SISGPO_API_URL = https://sisgpo-api.onrender.com
- ✅ SISGPO_HEALTH_URL = https://sisgpo-api.onrender.com/health
- ✅ SSO_SHARED_SECRET = <VER_NO_.ENV_LOCAL>

---

## 📋 CHECKLIST DE CORREÇÃO

No painel do Render (https://dashboard.render.com/web/srv-xxx):

### Passo 1: Editar Variáveis Existentes
- [ ] Editar `DIRECT_DATABASE_URL` → Trocar para conexão direta (db.xxx.supabase.co:5432)
- [ ] Editar `MIGRATE_USE_DIRECT` → Mudar de `false` para `true`

### Passo 2: Adicionar Variáveis Novas
- [ ] Adicionar `SUPABASE_URL`
- [ ] Adicionar `SUPABASE_ANON_KEY`
- [ ] Adicionar `SUPABASE_SERVICE_ROLE_KEY`

### Passo 3: Salvar e Redesploy
- [ ] Clicar em "Save Changes"
- [ ] Aguardar redeploy automático
- [ ] Verificar logs (deve completar as migrations agora)

---

## 🎯 POR QUE ESTAVA TRAVANDO?

O problema principal era:

1. **DIRECT_DATABASE_URL** apontando para o **pooler** (porta 6543)
2. **Poolers têm timeout agressivo** para operações longas
3. **Migrations precisam de conexão direta** (porta 5432) para evitar timeout
4. **MIGRATE_USE_DIRECT=false** impedia o uso da URL direta mesmo se corrigida

Com as correções acima, as migrations devem completar em ~5-10 segundos.

---

## 📞 Após Correção

Teste o endpoint:
```bash
curl https://siscob.onrender.com/api/diag
```

Deve retornar:
```json
{
  "status": "ok",
  "timestamp": "...",
  "database": "connected"
}
```
