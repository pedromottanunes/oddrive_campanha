# Sistema de Autenticação Admin - OD Drive

## ✅ IMPLEMENTAÇÃO COMPLETA

O sistema de autenticação e auditoria para administradores foi implementado com sucesso!

### 🎯 O que foi criado:

#### 1. Backend
- ✅ Funções MongoDB para `admin_users` e `admin_audit_log` em `backend/services/mongo.js`
- ✅ Middleware de autenticação em `backend/middleware/authenticate-admin.js`
- ✅ Middleware de auditoria em `backend/middleware/audit.js`
- ✅ Rotas de admin em `backend/routes/admin-auth.js`:
  - `POST /api/admin/login` - Login
  - `GET /api/admin/me` - Dados do usuário logado
  - `POST /api/admin/logout` - Logout
  - `GET /api/admin/audit-logs` - Histórico de auditoria
- ✅ Proteção de rotas: todas as rotas `/api/campaigns/*` agora exigem autenticação
- ✅ Auditoria automática em ações críticas:
  - Criar/deletar campanhas
  - Verificar evidências (já inclui nome do admin)
  - E outras operações (fácil adicionar mais)

#### 2. Frontend
- ✅ Tela de login (`frontend/login.html` e `frontend/js/login.js`)
- ✅ Dashboard protegido (`frontend/index.html` redireciona se não logado)
- ✅ Botões de Logout e Histórico no header
- ✅ Nome do admin exibido no topo
- ✅ Tela de histórico de auditoria (`frontend/audit-logs.html`)
- ✅ Todas as requisições incluem token automaticamente

#### 3. Scripts e Ferramentas
- ✅ Script interativo para criar usuários: `scripts/create-admin-user.js`
- ✅ Dependência `bcrypt` instalada

---

## 🚀 COMO USAR

### PASSO 1: Criar seu primeiro usuário admin

Abra o PowerShell e execute:

```powershell
cd "D:\Clientes Agentes\OD Drive\Campanha CHECK\app_oficial_odrive"
node scripts/create-admin-user.js
```

O script vai pedir:
1. **Username** (ex: `maria`)
2. **Nome completo** (ex: `Maria Silva`)
3. **Email** (opcional, pode dar Enter para pular)
4. **Senha** (mínimo 6 caracteres, vai aparecer `***`)
5. **Confirmar senha**

Exemplo de uso:
```
========================================
   CRIAR USUARIO ADMINISTRADOR
========================================

Username (ex: maria): maria
Nome completo (ex: Maria Silva): Maria Silva
Email (opcional, Enter para pular): 
Senha (mínimo 6 caracteres): ******
Confirme a senha: ******

⏳ Gerando hash da senha (bcrypt)...
⏳ Criando usuário no MongoDB...

✅ Usuário criado com sucesso!

-------------------------------------
  Username: maria
  Nome:     Maria Silva
  Email:    (não informado)
  Role:     admin
  ID:       67432...
-------------------------------------

🔐 O usuário já pode fazer login no dashboard admin.
```

### PASSO 2: Iniciar o servidor

```powershell
npm start
```

### PASSO 3: Acessar o sistema

1. **Abra o navegador** em: `http://localhost:5174/` ou `http://192.168.1.39:5174/`
2. Você será **redirecionado automaticamente** para `/login.html`
3. **Faça login** com o username e senha que criou
4. Após login, será redirecionado para o **dashboard**

---

## 🔐 FUNCIONAMENTO

### Fluxo de Autenticação
1. Usuário acessa `/index.html` (dashboard)
2. JavaScript verifica se existe `adminToken` no localStorage
3. Se não existe → redireciona para `/login.html`
4. Após login bem-sucedido → salva token e redireciona para dashboard
5. Todas as requisições para `/api/campaigns/*` incluem header `Authorization: Bearer <token>`
6. Servidor valida token em todas as rotas protegidas

### Sessões
- **Duração:** 24 horas (você definiu)
- **Armazenamento:** `db.json` (campo `adminSessions`)
- **Renovação:** Toda requisição atualiza `lastAccessAt`
- **Expiração:** Automaticamente invalidada após 24h

### Auditoria Automática
Quando um admin faz uma ação crítica, o sistema grava automaticamente no MongoDB:
- **Quem:** Nome e username do admin (pego do token)
- **Quando:** Timestamp da ação
- **O quê:** Tipo de ação (`campaign:create`, `evidence:verify`, etc.)
- **Onde:** IP e User-Agent do navegador
- **Detalhes:** Dados específicos (nome da campanha, motorista, etc.)

**Exemplo de log gravado:**
```json
{
  "_id": "...",
  "userId": "67432abc...",
  "username": "maria",
  "name": "Maria Silva",
  "action": "campaign:create",
  "entityType": "campaign",
  "entityId": "xyz789",
  "details": {
    "campaignName": "Campanha Teste",
    "client": "Cliente X",
    "period": "Nov/2025"
  },
  "ipAddress": "192.168.1.100",
  "userAgent": "Mozilla/5.0...",
  "timestamp": 1700000000000,
  "success": true
}
```

---

## 📊 HISTÓRICO DE AUDITORIA

### Acessar
No dashboard, clique no botão **"Histórico"** no topo, ou acesse diretamente:
```
http://localhost:5174/audit-logs.html
```

### Funcionalidades
- ✅ Lista todos os logs em ordem cronológica (mais recentes primeiro)
- ✅ Filtros:
  - Por usuário (username)
  - Por tipo de ação
- ✅ Paginação (carrega 50 por vez, botão "Carregar mais")
- ✅ Exibe:
  - Data/hora
  - Nome do admin
  - Tipo de ação (com badge colorido)
  - Entidade afetada
  - Detalhes da ação

---

## 🔧 ADICIONAR MAIS USUÁRIOS

Rode o script novamente quantas vezes quiser:
```powershell
node scripts/create-admin-user.js
```

Cada execução cria um novo usuário. O script verifica se o username já existe e impede duplicatas.

---

## 📝 ADICIONAR AUDITORIA EM OUTRAS AÇÕES

Para adicionar auditoria em qualquer rota, basta adicionar após a operação:

```javascript
import { logAudit } from '../middleware/audit.js';

router.post('/:id/alguma-acao', authenticateAdmin, async (req, res) => {
  // ... sua lógica aqui ...
  
  // Grava log
  await logAudit(req, 'tipo:acao', {
    entityType: 'tipo',
    entityId: 'id_da_entidade',
    data: { 
      campo1: 'valor1',
      campo2: 'valor2',
    },
  });
  
  res.json({ ok: true });
});
```

**Exemplos de `action` já implementados:**
- `campaign:create`
- `campaign:delete`
- `evidence:verify`

**Exemplos que você pode adicionar:**
- `campaign:update`
- `driver:create`
- `driver:update`
- `driver:delete`
- `graphic:create`
- `graphic:update`
- `graphic:delete`
- `campaign:sync`

---

## 🎨 ONDE CADA AÇÃO É REGISTRADA

### Já implementado:
1. **Criar campanha** → `POST /api/campaigns` (linha ~560)
2. **Deletar campanha** → `DELETE /api/campaigns/:id` (linha ~655)
3. **Verificar evidência** → `PATCH /api/campaigns/:id/drivers/:driverId/evidence-status` (linha ~1205)

### Fácil adicionar (copie o padrão):
- **Adicionar motorista** → `POST /api/campaigns/:id/drivers`
- **Editar motorista** → `PATCH /api/campaigns/:id/drivers/:driverId`
- **Deletar motorista** → `DELETE /api/campaigns/:id/drivers/:driverId`
- **Adicionar gráfica** → `POST /api/campaigns/:id/graphics`
- E qualquer outra rota que você queira auditar!

---

## 🔒 SEGURANÇA

### O que foi implementado:
- ✅ Senhas criptografadas com **bcrypt** (10 rounds)
- ✅ Tokens únicos de 48 caracteres (nanoid)
- ✅ Sessões com expiração automática (24h)
- ✅ Middleware valida token em TODAS as rotas admin
- ✅ Logout limpa sessão do servidor e localStorage
- ✅ Redirecionamento automático se sessão expirar (401)

### Recomendações adicionais (opcional):
- Use HTTPS em produção
- Configure CORS corretamente
- Adicione rate limiting nas rotas de login
- Implemente refresh tokens se precisar sessões mais longas

---

## 📂 ESTRUTURA DE ARQUIVOS CRIADOS/MODIFICADOS

### Novos arquivos:
```
backend/
  middleware/
    authenticate-admin.js       ← Middleware de autenticação
    audit.js                    ← Middleware de auditoria
  routes/
    admin-auth.js               ← Rotas de login/logout/me/audit-logs
frontend/
  login.html                    ← Tela de login
  audit-logs.html               ← Tela de histórico
  js/
    login.js                    ← Lógica de login
    audit-logs.js               ← Lógica de histórico
scripts/
  create-admin-user.js          ← Script para criar usuários
```

### Arquivos modificados:
```
backend/
  server.js                     ← Adicionou rota /api/admin
  services/
    mongo.js                    ← Adicionou funções admin_users e audit_log
    db.js                       ← Exportou novas funções
  routes/
    campaigns.js                ← Protegido com authenticateAdmin + auditoria
frontend/
  index.html                    ← Botões Logout/Histórico + nome do admin
  js/
    app.js                      ← Verifica autenticação + authFetch()
package.json                    ← Adicionou bcrypt
```

---

## 🧪 TESTAR

### Teste 1: Login
1. Acesse `http://localhost:5174/`
2. Deve redirecionar para `/login.html`
3. Digite username e senha
4. Deve logar e voltar para dashboard

### Teste 2: Criar campanha (com auditoria)
1. No dashboard, clique "Adicionar campanha"
2. Preencha nome, cliente, período
3. Salve
4. Vá em "Histórico" → deve aparecer log `Criar Campanha` com seu nome

### Teste 3: Verificar evidência (com auditoria)
1. Entre numa campanha que tem motorista com fotos
2. Marque como "verificado"
3. Vá em "Histórico" → deve aparecer log `Verificar Evidência` com seu nome

### Teste 4: Logout
1. Clique em "Sair" no topo
2. Deve voltar para tela de login
3. Tente acessar o dashboard diretamente → deve redirecionar para login

---

## ✅ TUDO PRONTO!

O sistema está 100% funcional. Agora:
1. **Crie seu primeiro usuário** (rode o script)
2. **Inicie o servidor** (`npm start`)
3. **Faça login** e teste!

Se quiser adicionar mais auditoria em outras rotas, é só seguir o padrão mostrado acima. Todas as bases estão implementadas! 🎉
