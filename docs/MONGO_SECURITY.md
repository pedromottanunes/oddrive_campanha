# Segurança do MongoDB Atlas

Este documento explica como configurar permissões no MongoDB Atlas para limitar acessos e proteger seus dados.

## Por que isso é importante?

Atualmente, você usa apenas um usuário com acesso total ao banco de dados. Se a senha desse usuário vazar, qualquer pessoa pode:
- Ler todos os dados das campanhas
- Modificar ou apagar informações
- Criar novos registros falsos

A solução é criar **usuários diferentes com permissões específicas** para cada parte do sistema.

## Estrutura de Permissões Recomendada

### 1. Usuário Admin (uso atual)
- **Nome sugerido**: `admin-backend`
- **Permissão**: `readWrite` no banco `oddrive`
- **Uso**: Backend admin (importações, configurações)
- **Quando usar**: Apenas em rotas protegidas por `authenticateAdmin`

### 2. Usuário Público (NOVO - a criar)
- **Nome sugerido**: `public-api`
- **Permissão**: `read` (apenas leitura) nas coleções:
  - `campaigns`
  - `drivers`
  - `graphics`
- **Uso**: APIs públicas que motoristas e artes acessam
- **Quando usar**: Rotas de sessão de motorista/arte

### 3. Usuário de Auditoria (NOVO - opcional)
- **Nome sugerido**: `audit-logger`
- **Permissão**: `readWrite` apenas na coleção `admin_audit_log`
- **Uso**: Gravar logs de auditoria
- **Quando usar**: Sistema de logging

## Como Criar Usuários no MongoDB Atlas

### Passo 1: Acessar o MongoDB Atlas
1. Entre em https://cloud.mongodb.com
2. Selecione seu cluster `oddrive`
3. Clique em **Database Access** no menu lateral

### Passo 2: Criar Usuário Público (apenas leitura)
1. Clique em **Add New Database User**
2. Preencha:
   - **Username**: `public-api`
   - **Password**: Gere uma senha forte (guarde com segurança)
   - **Authentication Method**: Escolha "Password"
3. Em **Database User Privileges**, selecione:
   - **Built-in Role**: `read`
   - **Database**: `oddrive` (seu banco de dados)
4. Clique em **Add User**

### Passo 3: Configurar Variáveis de Ambiente

Após criar os usuários, você terá **duas conexões MongoDB**:

**Arquivo `.env.production` (backend admin):**
```env
# Conexão admin com permissão de escrita
MONGODB_URI=mongodb+srv://admin-backend:SENHA_ADMIN@cluster.mongodb.net/oddrive?retryWrites=true&w=majority

# Conexão pública apenas leitura (opcional, para futuro)
MONGODB_URI_PUBLIC=mongodb+srv://public-api:SENHA_PUBLIC@cluster.mongodb.net/oddrive?retryWrites=true&w=majority
```

**No Render.com (ou servidor de produção):**
- Configure as variáveis de ambiente `MONGODB_URI` e `MONGODB_URI_PUBLIC`
- **Nunca** coloque essas senhas no código ou no GitHub

### Passo 4: Atualizar o Backend (futuro)

Quando quiser usar o usuário público nas rotas de motorista/arte:

```javascript
// backend/services/mongo.js
const adminClient = new MongoClient(process.env.MONGODB_URI);
const publicClient = new MongoClient(process.env.MONGODB_URI_PUBLIC);

// Use adminClient nas rotas protegidas
// Use publicClient nas rotas públicas (driver/graphic)
```

## Restrições de Rede

Além de permissões de usuário, você pode limitar de onde o banco aceita conexões:

### Network Access no Atlas
1. Vá em **Network Access** no MongoDB Atlas
2. Você verá a lista de IPs permitidos
3. **Recomendação**: Em vez de "0.0.0.0/0" (qualquer IP), adicione apenas:
   - IP do servidor Render.com onde sua aplicação roda
   - Seu IP local (para desenvolvimento)

### Como descobrir o IP do Render
1. Faça deploy da aplicação no Render
2. No dashboard do Render, vá em **Settings** > **Outbound IPs**
3. Copie os IPs de saída
4. Adicione esses IPs na lista de **Network Access** do Atlas

## Checklist de Segurança MongoDB

- [ ] Criar usuário `public-api` com permissão apenas `read`
- [ ] Configurar `MONGODB_URI` e `MONGODB_URI_PUBLIC` no Render
- [ ] Remover acesso "0.0.0.0/0" (qualquer IP) do Network Access
- [ ] Adicionar apenas IPs específicos do servidor de produção
- [ ] Trocar senha do usuário admin a cada 3 meses
- [ ] Ativar auditoria no MongoDB Atlas (plano M10+)

## Quando Fazer Essas Mudanças?

**Agora (antes do deploy):**
- ✅ Criar usuário `public-api` com leitura
- ✅ Configurar `MONGODB_URI` no Render com o usuário admin

**Depois (melhoria futura):**
- Separar conexões admin/público no código
- Configurar restrições de IP (quando tiver servidor fixo)
- Ativar auditoria no Atlas (se contratar plano pago)

## Dúvidas Comuns

**P: Se eu criar o usuário público agora, vai quebrar algo?**
R: Não. Você pode criar e guardar a senha. Só usará quando modificar o código.

**P: O que acontece se eu não fizer isso?**
R: Se a senha do usuário admin vazar, alguém pode ler/modificar/apagar todos os dados.

**P: Preciso pagar mais no MongoDB Atlas?**
R: Não. Criar usuários e configurar permissões é gratuito no plano Free.

**P: E se eu esquecer a senha do usuário?**
R: No MongoDB Atlas, você pode resetar a senha a qualquer momento em "Database Access".
