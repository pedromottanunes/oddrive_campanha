# ✅ Checklist de Deploy - OD Drive

## 🔒 SEGURANÇA - AÇÃO OBRIGATÓRIA ANTES DO DEPLOY

### ⚠️ ROTACIONAR SENHA DO MONGODB (URGENTE)

A senha do MongoDB foi exposta em documentos. **Troque imediatamente:**

1. Acesse MongoDB Atlas: https://cloud.mongodb.com/
2. Database Access → Editar usuário `pedromottanunes`
3. **Edit Password** → Gere nova senha forte
4. Copie a nova senha
5. Atualize no serviço de deploy (Render/Heroku) a variável `MONGO_URI`
   - Exemplo: `mongodb+srv://pedromottanunes:SENHA_NOVA@cluster0.gsd0urm.mongodb.net/odrive_app?retryWrites=true&w=majority`
6. **NÃO** coloque a senha nova no código ou arquivo .env local

---

## 📋 Variáveis de Ambiente Necessárias

Configure estas variáveis no seu serviço de deploy (Render, Heroku, etc.):

```bash
# Porta (Render define automaticamente)
PORT=10000

# Google Service Account (obtenha no console do Google Cloud)
GOOGLE_CLIENT_EMAIL=seu-service-account@projeto.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nSUA_CHAVE_AQUI\n-----END PRIVATE KEY-----\n"

# MongoDB Atlas (use a NOVA senha após rotação)
MONGO_URI=mongodb+srv://usuario:SENHA_NOVA@cluster0.gsd0urm.mongodb.net/odrive_app?retryWrites=true&w=majority
MONGO_DB_NAME=odrive_app
DB_TYPE=mongo

# Redis (recomendado para produção)
REDIS_URL=redis://seu-redis-host:6379
USE_REDIS=true

# Node.js
NODE_ENV=production

# Validação de fotos (ajuste conforme necessário)
CAPTURE_MAX_AGE_MINUTES=15
```

---

## 🚀 Deploy no Render (Recomendado)

### 1. Criar Web Service

1. Acesse https://dashboard.render.com/
2. **New** → **Web Service**
3. Conecte seu repositório: `pedromottanunes/oddrive_campanha`
4. Configurações:
   - **Name**: `odrive-app`
   - **Branch**: `main`
   - **Root Directory**: deixe vazio
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free (ou Starter para produção)

### 2. Adicionar Variáveis de Ambiente

No painel do Render, vá em **Environment** e adicione cada variável listada acima.

**IMPORTANTE**: Cole o `GOOGLE_PRIVATE_KEY` com as quebras de linha (`\n`) preservadas.

### 3. Adicionar Redis (Opcional mas Recomendado)

1. No Render, crie um **Redis** service
2. Copie a **Internal Redis URL**
3. Cole em `REDIS_URL` nas variáveis do Web Service

### 4. Deploy

1. Clique em **Create Web Service**
2. Aguarde o build (5-10 minutos)
3. Acesse a URL fornecida: `https://odrive-app.onrender.com`

---

## 🧪 Testar Após Deploy

1. **Acesse a URL do deploy**
2. **Login Admin**: Use as credenciais criadas via script
   ```bash
   npm run create-admin
   ```
3. **Teste funcionalidades**:
   - Login motorista/gráfica
   - Upload de evidência
   - Visualização de logs de auditoria
4. **Monitore logs**: No painel do Render, aba **Logs**

---

## 📊 Monitoramento

- **Logs**: Render Dashboard → Logs
- **MongoDB**: MongoDB Atlas → Metrics
- **Redis**: Render Redis Dashboard → Metrics

---

## 🔐 Segurança Pós-Deploy

- ✅ Senha do MongoDB rotacionada
- ✅ Variáveis em environment secrets (não no código)
- ✅ `.env` local nunca comitado
- ✅ HTTPS automático (Render fornece)
- ✅ Rate limiting ativo
- ✅ Helmet + CSP configurados

---

## 🆘 Problemas Comuns

| Erro | Solução |
|------|---------|
| `MONGO_URI não definido` | Adicione variável `MONGO_URI` no Render |
| `Cannot connect to Redis` | Verifique `REDIS_URL` ou desative com `USE_REDIS=false` |
| `Google API error` | Verifique `GOOGLE_PRIVATE_KEY` (preservar `\n`) |
| `Port already in use` | Render define PORT automaticamente, não force |

---

## 📞 Suporte

- MongoDB Atlas: https://www.mongodb.com/docs/atlas/
- Render: https://render.com/docs
- Redis: https://redis.io/docs/

**Repositório**: https://github.com/pedromottanunes/oddrive_campanha
