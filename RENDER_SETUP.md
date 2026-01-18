# 🚀 Configuração do Backend no Render.com

## 📋 Variáveis de Ambiente Necessárias

Configure as seguintes variáveis no painel do Render.com (Dashboard → Service Settings → Environment):

### 🔐 Banco de Dados (Supabase)

```bash
# Connection Pooler (para a aplicação)
DATABASE_URL=<VER_NO_ARQUIVO_.ENV_DO_BACKEND>

# Conexão Direta (para migrations)
DIRECT_DATABASE_URL=<VER_NO_ARQUIVO_.ENV_DO_BACKEND>
```

### 🔑 Supabase API

```bash
SUPABASE_URL=<VER_NO_ARQUIVO_.ENV_DO_BACKEND>
SUPABASE_ANON_KEY=<VER_NO_ARQUIVO_.ENV_DO_BACKEND>
SUPABASE_SERVICE_ROLE_KEY=<VER_NO_ARQUIVO_.ENV_DO_BACKEND>
```

### 🔐 Autenticação

```bash
# JWT Secret (para tokens)
JWT_SECRET=<VER_NO_ARQUIVO_.ENV_DO_BACKEND>

# Google OAuth
GOOGLE_CLIENT_ID=<VER_NO_ARQUIVO_.ENV_DO_BACKEND>
GOOGLE_CLIENT_SECRET=<VER_NO_ARQUIVO_.ENV_DO_BACKEND>
```

### ⚙️ Configurações do Sistema

```bash
# Ambiente
NODE_ENV=production
LOG_LEVEL=info

# Segurança
ALLOW_SCHEMA_RESET=false

# Migrations (IMPORTANTE!)
MIGRATE_USE_DIRECT=true
```

### 🔗 Integração SISGPO (se aplicável)

```bash
SISGPO_API_URL=<SEU_SISGPO_URL>
SSO_SHARED_SECRET=<SEU_SSO_SECRET>
```

---

## 🎯 Passos para Configurar

### 1️⃣ No Render.com:

1. Acesse: https://dashboard.render.com
2. Selecione o serviço `api-siscob`
3. Vá em **Environment** → **Environment Variables**
4. Adicione cada variável acima (cole o valor exatamente como mostrado)
5. Clique em **Save Changes**
6. O Render irá fazer o redeploy automaticamente

### 2️⃣ No Vercel (Frontend):

**⚠️ IMPORTANTE: Corrigir variável errada!**

A variável `VITE_API_BASE_URL` está apontando para o Supabase. Precisa ser corrigida para:

```bash
VITE_API_BASE_URL=https://siscob.onrender.com/api
```

**Como corrigir:**
1. Acesse: https://vercel.com/dashboard
2. Selecione o projeto do frontend
3. Vá em **Settings** → **Environment Variables**
4. Encontre `VITE_API_BASE_URL`
5. Clique em **Edit** e altere para: `https://siscob.onrender.com/api`
6. Salve e faça redeploy

---

## 🔍 Verificação

### Backend (Render):
```bash
# Deve retornar status OK
curl https://siscob.onrender.com/api/diag
```

### Frontend (Vercel):
```bash
# Deve retornar a página de login
curl https://[SEU-DOMINIO-VERCEL].vercel.app
```

---

## 🐛 Troubleshooting

### Migration travando no deploy:

**Sintoma:** Build fica travado em `prisma migrate deploy`

**Solução:**
1. Certifique-se de que `DIRECT_DATABASE_URL` está configurado
2. Verifique que `MIGRATE_USE_DIRECT=true` está setado
3. Tente fazer deploy manual novamente

### Erro 401/403 ao chamar API:

**Sintoma:** Frontend retorna erro de autenticação

**Solução:**
1. Verifique se `VITE_API_BASE_URL` no Vercel está correto
2. Confirme que `JWT_SECRET` está igual no backend e frontend
3. Teste login com usuário admin

---

## 📞 Links Úteis

- **Render Dashboard:** https://dashboard.render.com
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Supabase Dashboard:** https://supabase.com/dashboard/project/rqhzudbbmsximjfvndyd
