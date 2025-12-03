# 🔒 Guia de Segurança e Deploy - OD Drive

## ✅ O que já foi implementado

Seu sistema agora tem **10 camadas de segurança ativas**:

### 1. Proteção de Dados Sensíveis
- ✅ **db.json não grava mais no disco** quando usa MongoDB
- ✅ **Sessões em memória** com expiração automática (24h admin, 7 dias usuários)
- ✅ **.gitignore reforçado** bloqueia segredos, `.env`, certificados

### 2. Autenticação e Autorização
- ✅ **Rotas administrativas protegidas** (`/imports`, `/config`, `/storage`)
- ✅ **Tokens validados** em todos os endpoints sensíveis
- ✅ **Middleware de autenticação** separa admin de usuários

### 3. Segurança HTTP
- ✅ **Helmet configurado** (CSP, HSTS, X-Frame-Options)
- ✅ **Rate limiting**:
  - Login: máximo 5 tentativas em 15 minutos
  - APIs gerais: 100 requisições em 15 minutos
- ✅ **CORS controlado**

### 4. Validação de Entrada
- ✅ **Validadores em todas as rotas críticas**:
  - IDs de planilha do Sheets
  - Credenciais de login
  - Dados de motoristas/artes
  - Imagens base64 (máximo 10MB)
- ✅ **Sanitização** automática de strings (remove XSS)

### 5. Auditoria
- ✅ **Logs de auditoria** registram:
  - Logins (sucesso e falha)
  - Acessos não autorizados
  - Mudanças de configuração
  - Uploads de evidências
- ✅ **Armazenamento no MongoDB** (`admin_audit_log`)

### 6. Automação e Controle de Qualidade
- ✅ **Pre-commit hooks** (Husky + lint-staged)
- ✅ **GitHub Actions**:
  - CI: verifica build do projeto
  - Gitleaks: detecta segredos vazados
  - Dependabot: atualiza dependências vulneráveis

---

## 🚀 Checklist de Deploy

### Antes de fazer deploy pela primeira vez

#### 1. Configurar MongoDB Atlas (15 min)
- [ ] Criar usuário `public-api` com permissão `read` (ver `docs/MONGO_SECURITY.md`)
- [ ] Trocar senha do usuário admin
- [ ] Ativar **Network Access** com IPs específicos (remover `0.0.0.0/0`)
- [ ] Anotar as duas connection strings:
  - `MONGODB_URI` (admin - readWrite)
  - `MONGODB_URI_PUBLIC` (público - read) *(futuro)*

#### 2. Preparar Google Drive API (10 min)
- [ ] Verificar se `credentials.json` está no servidor (ou usar variáveis de ambiente)
- [ ] Testar acesso às planilhas no ambiente de produção
- [ ] Garantir que a conta de serviço tem permissão nas pastas

#### 3. Configurar Render.com (recomendado) ou servidor
- [ ] Criar novo Web Service
- [ ] Conectar ao repositório GitHub `pedromottanunes/oddrive_campanha`
- [ ] Configurar variáveis de ambiente (ver seção abaixo)
- [ ] Definir comando de build: `npm install`
- [ ] Definir comando de start: `npm start`
- [ ] Deploy automático ao push na branch `main`

#### 4. Variáveis de Ambiente (CRÍTICO - nunca commitar!)

**No Render.com ou servidor de produção, configure:**

```env
# Banco de dados
MONGODB_URI=mongodb+srv://admin-backend:SENHA_ADMIN@cluster.mongodb.net/oddrive?retryWrites=true&w=majority
DB_TYPE=mongo
USE_MONGO=true

# Servidor
PORT=5173
NODE_ENV=production

# Google Sheets (copie do seu .env local)
GOOGLE_CLIENT_ID=seu_client_id_aqui
GOOGLE_CLIENT_SECRET=seu_client_secret_aqui
GOOGLE_REDIRECT_URI=seu_redirect_uri_aqui

# Drive (copie do seu .env local)
DRIVE_FOLDER_ID=seu_folder_id_aqui

# Segurança
SESSION_SECRET=gere_uma_senha_aleatoria_de_32_caracteres
ADMIN_JWT_SECRET=gere_outra_senha_aleatoria_de_32_caracteres
```

**Como gerar senhas seguras:**
```bash
# No terminal (PowerShell):
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

#### 5. Testar Deploy
- [ ] Acessar URL do Render: `https://seu-app.onrender.com`
- [ ] Fazer login no admin
- [ ] Importar uma campanha de teste
- [ ] Fazer login como motorista
- [ ] Enviar uma evidência
- [ ] Verificar logs de auditoria em `/api/admin/audit-logs`

---

## 🛡️ Manutenção de Segurança

### Mensal
- [ ] Revisar logs de auditoria (`/api/admin/audit-logs`)
- [ ] Verificar tentativas de login falhadas
- [ ] Atualizar dependências: `npm audit` e `npm update`

### Trimestral (a cada 3 meses)
- [ ] Trocar senha do usuário admin do MongoDB
- [ ] Revisar IPs permitidos no Network Access
- [ ] Verificar usuários inativos no sistema

### Anual
- [ ] Renovar certificados SSL (Render faz automaticamente)
- [ ] Revisar e atualizar política de segredos
- [ ] Backup completo do MongoDB Atlas

---

## 🚨 O que fazer em caso de problema

### "Erro ao conectar ao MongoDB"
1. Verificar se `MONGODB_URI` está configurado
2. Checar se IP do servidor está no Network Access do Atlas
3. Testar conexão manual: `npm run test-mongo`

### "Sessão expirada" frequentemente
- Sessões de admin duram 24h
- Sessões de motorista/arte duram 7 dias
- Se expirar muito rápido, verificar se servidor está reiniciando (Render free tier hiberna após inatividade)

### "Rate limit exceeded"
- Normal se houver muitas requisições simultâneas
- Ajustar limites em `backend/server.js` se necessário:
  ```javascript
  max: 100, // Aumentar para 200 se necessário
  ```

### "Segredo vazado no GitHub"
1. **IMEDIATAMENTE** trocar a senha/token vazado
2. Remover do histórico do Git:
   ```bash
   git filter-branch --force --index-filter \
   "git rm --cached --ignore-unmatch caminho/do/arquivo" \
   --prune-empty --tag-name-filter cat -- --all
   ```
3. Force push: `git push origin --force --all`
4. Notificar todos os desenvolvedores

---

## 📊 Monitoramento

### Métricas importantes
- **Logs de login**: Quantas tentativas falhadas?
- **Tempo de resposta**: APIs respondendo em < 2s?
- **Taxa de erro**: Menos de 1% de erros 5xx?
- **Uso de memória**: Sessões não estourando RAM?

### Ferramentas recomendadas (futuro)
- **Sentry**: Captura erros em produção
- **LogTail**: Centraliza logs do servidor
- **UptimeRobot**: Alerta se o site cair

---

## 🔐 Segurança Avançada (Opcional)

### Se contratar plano pago do MongoDB Atlas
- [ ] Ativar **Database Auditing**
- [ ] Configurar **Performance Advisor**
- [ ] Habilitar **Encryption at Rest**

### Se tiver equipe maior
- [ ] Implementar autenticação 2FA para admin
- [ ] Criar roles diferentes (admin, editor, visualizador)
- [ ] Adicionar VPC peering entre servidor e MongoDB

---

## 📝 Comandos Úteis

```bash
# Criar novo usuário admin
npm run create-admin

# Testar conexão MongoDB
npm run test-mongo

# Ver logs em produção (Render)
render logs -t <nome-do-servico>

# Fazer backup manual do MongoDB
mongodump --uri="MONGODB_URI" --out=backup/

# Restaurar backup
mongorestore --uri="MONGODB_URI" backup/
```

---

## 🎯 Próximos Passos (Melhoria Contínua)

### Curto Prazo (próximos 30 dias)
- [ ] Implementar alertas de erro via email
- [ ] Adicionar dashboard de métricas no admin
- [ ] Testar recuperação de desastres

### Médio Prazo (próximos 3 meses)
- [ ] Separar conexões MongoDB (admin vs público)
- [ ] Implementar cache Redis para sessões
- [ ] Adicionar compressão de imagens automática

### Longo Prazo (próximos 6 meses)
- [ ] Migrar para autenticação OAuth2
- [ ] Implementar API GraphQL
- [ ] Containerizar com Docker

---

## ✅ Checklist Final Antes do Deploy

**CRÍTICO - Verificar TUDO antes de subir:**

- [ ] `.env` **NÃO** está no repositório Git
- [ ] `backend/data/` **NÃO** está no repositório
- [ ] Todos os testes passam: `npm test` (se houver)
- [ ] MongoDB Atlas configurado com IPs restritos
- [ ] Variáveis de ambiente configuradas no Render
- [ ] Usuário admin criado: `npm run create-admin`
- [ ] GitHub Actions passando (CI verde)
- [ ] Gitleaks não detectou segredos
- [ ] Pre-commit hooks funcionando
- [ ] README.md atualizado com instruções

---

## 📞 Suporte

**Dúvidas ou problemas?**
- Revisar este documento
- Verificar logs em `https://seu-app.onrender.com/api/admin/audit-logs`
- Consultar documentação MongoDB Atlas: https://docs.atlas.mongodb.com
- Consultar documentação Render: https://render.com/docs

**Emergência (site fora do ar):**
1. Verificar status do Render: https://status.render.com
2. Verificar status do MongoDB Atlas
3. Revisar logs no dashboard do Render
4. Fazer rollback para commit anterior se necessário

---

## 🏆 Parabéns!

Seu sistema agora tem **nível profissional de segurança**. Mantenha as práticas deste guia e seu projeto estará protegido contra as ameaças mais comuns.

**Lembre-se**: Segurança é um processo contínuo, não um estado final. Revise e atualize regularmente! 🛡️
