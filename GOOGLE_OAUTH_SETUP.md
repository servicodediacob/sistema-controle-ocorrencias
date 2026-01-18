# 🔐 Configuração do Google OAuth no Supabase

Este guia explica como configurar o login com Google (OAuth) no seu projeto Supabase.

## 📋 Pré-requisitos

- Projeto Supabase ativo
- Acesso ao Google Cloud Console
- Google Client ID já criado (você já tem: `586618968427-cmoc0rmu973i1v77t99t90g95l9i4s27.apps.googleusercontent.com`)

---

## 🚀 Passo a Passo

### 1️⃣ **Configurar credenciais OAuth no Google Cloud Console**

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/)
2. Selecione seu projeto ou crie um novo
3. Vá em **APIs & Services** → **Credentials**
4. Encontre seu OAuth 2.0 Client ID existente ou crie um novo
5. **IMPORTANTE:** Adicione os seguintes **Authorized redirect URIs**:

```
https://rqhzudbbmsximjfvndyd.supabase.co/auth/v1/callback
http://localhost:5173/
```

> **Nota:** O primeiro URI é para produção (Supabase), o segundo é para desenvolvimento local.

6. Copie o **Client ID** e **Client Secret**

---

### 2️⃣ **Configurar Google OAuth no Supabase Dashboard**

1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto: `rqhzudbbmsximjfvndyd`
3. No menu lateral, vá em **Authentication** → **Providers**
4. Encontre **Google** na lista de providers
5. Ative o provider clicando no toggle
6. Preencha os campos:
   - **Client ID**: Cole o Client ID do Google
   - **Client Secret**: Cole o Client Secret do Google
   - **Authorized Client IDs** (opcional): Deixe vazio ou adicione o Client ID novamente
7. Clique em **Save**

---

### 3️⃣ **Configurar políticas RLS (Row Level Security)**

Quando um usuário faz login com Google pela primeira vez, o Supabase cria automaticamente o registro no **auth.users**, mas você precisa garantir que o registro seja criado também na tabela **usuarios**.

#### Opção A: Trigger automático (Recomendado)

Execute este SQL no Supabase SQL Editor:

```sql
-- Function para criar usuário na tabela usuarios após login OAuth
CREATE OR REPLACE FUNCTION public.handle_new_oauth_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Verifica se o usuário já existe na tabela usuarios
  IF NOT EXISTS (SELECT 1 FROM public.usuarios WHERE email = NEW.email) THEN
    -- Insere o novo usuário
    INSERT INTO public.usuarios (email, nome, perfil, ativo)
    VALUES (
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'nome', NEW.raw_user_meta_data->>'name', 'Usuário'),
      'user', -- perfil padrão
      false   -- usuário inativo até aprovação de admin
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para executar a função após inserção em auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_oauth_user();
```

#### Opção B: Criar manualmente via script

Se preferir controlar manualmente, você pode usar o script `create-user.mjs`:

```bash
node create-user.mjs email@usuario.com senha123 "Nome do Usuário" admin
```

---

### 4️⃣ **Testar o login**

1. Acesse a página de login: `http://localhost:5173/login`
2. Clique no botão **"Continuar com Google"**
3. Você será redirecionado para a página de login do Google
4. Após autenticar, será redirecionado de volta para `http://localhost:5173/`
5. O sistema deve:
   - Criar/atualizar o registro em `auth.users`
   - Criar o registro em `usuarios` (via trigger ou manualmente)
   - Logar o usuário automaticamente

---

## 🔍 Verificar se funcionou

### No Supabase Dashboard:

1. Vá em **Authentication** → **Users**
2. Você deve ver o usuário com provider "Google"

### No SQL Editor:

```sql
-- Ver usuários autenticados via Google
SELECT * FROM auth.users WHERE raw_app_meta_data->>'provider' = 'google';

-- Ver usuários na tabela usuarios
SELECT * FROM public.usuarios WHERE email = 'seu-email@gmail.com';
```

---

## ⚠️ Troubleshooting

### Erro: "redirect_uri_mismatch"
- **Causa:** O redirect URI não está configurado no Google Cloud Console
- **Solução:** Adicione `https://rqhzudbbmsximjfvndyd.supabase.co/auth/v1/callback` nos Authorized redirect URIs

### Erro: "Usuário autenticado, mas perfil não encontrado"
- **Causa:** O registro não foi criado na tabela `usuarios`
- **Solução:** 
  1. Verifique se o trigger está ativo
  2. Ou crie o usuário manualmente com o script

### Erro: "Invalid login credentials"
- **Causa:** OAuth pode estar desabilitado ou mal configurado
- **Solução:** Verifique se o provider Google está ativo no Supabase Dashboard

---

## 📝 Variáveis de Ambiente

Certifique-se de que estas variáveis estão no arquivo `.env`:

### Frontend (`frontend/.env`):
```env
VITE_SUPABASE_URL=https://rqhzudbbmsximjfvndyd.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_GOOGLE_CLIENT_ID=586618968427-cmoc0rmu973i1v77t99t90g95l9i4s27.apps.googleusercontent.com
```

### Backend (`api/.env`):
```env
SUPABASE_URL=https://rqhzudbbmsximjfvndyd.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## ✅ Checklist Final

- [ ] Google OAuth Client criado no Google Cloud Console
- [ ] Redirect URIs configurados no Google Cloud Console
- [ ] Provider Google habilitado no Supabase Dashboard
- [ ] Client ID e Secret configurados no Supabase
- [ ] Trigger automático criado para novos usuários OAuth
- [ ] Código do frontend atualizado com botão de login Google
- [ ] Testado login com conta Google
- [ ] Usuário aparece em `auth.users` e `usuarios`

---

## 🎉 Pronto!

Agora seus usuários podem fazer login com Google de forma segura e integrada ao Supabase!
