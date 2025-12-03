# 🚗 OD Drive - Plataforma de Gestão de Campanhas

Sistema completo para gerenciar campanhas de motoristas e gráficas, com importação automática do Google Sheets, upload de evidências e acompanhamento em tempo real.

## 📋 Índice

- [Requisitos](#-requisitos)
- [Instalação Rápida](#-instalação-rápida)
- [Configuração](#-configuração)
- [Deploy em Produção](#-deploy-em-produção)
- [Segurança](#-segurança)
- [Documentação Completa](#-documentação-completa)

---

## 🔧 Requisitos

- **Node.js 18+** instalado
- **MongoDB Atlas** (conta gratuita em https://mongodb.com/cloud)
- **Google Cloud** com API do Sheets/Drive ativada
- **Git** instalado

---

## ⚡ Instalação Rápida

### 1. Clone o repositório

```bash
git clone https://github.com/pedromottanunes/oddrive_campanha.git
cd oddrive_campanha
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

Copie o exemplo e edite com suas credenciais:

```bash
cp .env.example .env
```

Edite `.env`:

```env
# Banco de dados
MONGODB_URI=mongodb+srv://usuario:senha@cluster.mongodb.net/oddrive?retryWrites=true&w=majority
DB_TYPE=mongo
USE_MONGO=true

# Servidor
PORT=5173
NODE_ENV=development

# Google Sheets/Drive (cole suas credenciais)
GOOGLE_CLIENT_ID=seu_client_id
GOOGLE_CLIENT_SECRET=seu_client_secret
GOOGLE_REDIRECT_URI=http://localhost:5173/callback
```

### 4. Crie um usuário admin

```bash
npm run create-admin
```

Siga as instruções no terminal.

### 5. Inicie o servidor

```bash
npm start
```

Acesse: **http://localhost:5173**

---

## 📦 Estrutura do Projeto

```
app_oficial_odrive/
├── backend/
│   ├── middleware/       # Autenticação, validação
│   ├── routes/           # Endpoints da API
│   ├── services/         # MongoDB, Sheets, Drive
│   ├── lib/              # Lógica de negócio
│   └── server.js         # Servidor Express
├── frontend/
│   ├── index.html        # Admin dashboard
│   ├── driver.html       # App do motorista
│   ├── graphic.html      # App da gráfica
│   ├── assets/           # CSS, imagens
│   └── js/               # JavaScript frontend
├── docs/
│   ├── SECURITY_AND_DEPLOY.md  # Guia completo de deploy
│   └── MONGO_SECURITY.md       # Configuração MongoDB
├── .github/
│   ├── workflows/        # CI/CD automático
│   └── dependabot.yml    # Atualização de dependências
└── package.json
```

---

## 🔒 Segurança

Este projeto implementa **10 camadas de segurança**:

✅ Sessões em memória (sem gravação em disco)  
✅ Rotas administrativas protegidas com autenticação  
✅ Helmet + HSTS + CSP configurados  
✅ Rate limiting (anti força bruta)  
✅ Validação de entrada em todas as rotas  
✅ Logs de auditoria no MongoDB  
✅ Pre-commit hooks (Husky)  
✅ GitHub Actions com Gitleaks (detecta segredos)  
✅ Dependabot (atualização automática)  
✅ .gitignore reforçado (bloqueia .env, secrets)

**📖 Leia mais:** [docs/SECURITY_AND_DEPLOY.md](docs/SECURITY_AND_DEPLOY.md)

---

## 🚀 Deploy em Produção

### Opção 1: Render.com (Recomendado - Grátis)

1. **Fork este repositório** no seu GitHub

2. **Crie conta no Render**: https://render.com

3. **Novo Web Service**:
   - Conecte ao repositório GitHub
   - Build command: `npm install`
   - Start command: `npm start`
   - Branch: `main`

4. **Configure variáveis de ambiente** no dashboard do Render (ver seção [Configuração](#-configuração))

5. **Deploy automático**: A cada push na branch `main`, o Render faz deploy automaticamente

### Opção 2: Servidor próprio (VPS, AWS, etc.)

```bash
# No servidor
git clone https://github.com/pedromottanunes/oddrive_campanha.git
cd oddrive_campanha
npm install
npm start

# Usar PM2 para manter rodando
npm install -g pm2
pm2 start backend/server.js --name oddrive
pm2 save
pm2 startup
```

**📖 Guia completo:** [docs/SECURITY_AND_DEPLOY.md](docs/SECURITY_AND_DEPLOY.md)

---

## 🔑 Configuração

### MongoDB Atlas

1. Criar cluster gratuito em https://mongodb.com/cloud
2. Criar usuário admin com permissão `readWrite`
3. Adicionar IP do servidor no **Network Access** (ou `0.0.0.0/0` temporariamente)
4. Copiar connection string para `MONGODB_URI`

**📖 Guia detalhado:** [docs/MONGO_SECURITY.md](docs/MONGO_SECURITY.md)

### Google Sheets/Drive API

1. Criar projeto no https://console.cloud.google.com
2. Ativar APIs: Google Sheets API e Google Drive API
3. Criar credenciais OAuth 2.0
4. Adicionar `http://localhost:5173/callback` nas URLs de redirecionamento
5. Copiar Client ID e Client Secret para `.env`

---

## 📚 Documentação Completa

- **[Guia de Segurança e Deploy](docs/SECURITY_AND_DEPLOY.md)** - Deploy, monitoramento, manutenção
- **[Segurança do MongoDB](docs/MONGO_SECURITY.md)** - Configuração de permissões e usuários

---

## 🛠️ Scripts Disponíveis

```bash
npm start               # Inicia o servidor (produção)
npm run dev             # Modo desenvolvimento (hot reload)
npm run create-admin    # Cria usuário administrador
npm run test-mongo      # Testa conexão com MongoDB
```

---

## 🔄 Fluxo de Uso

### Admin
1. Login em `/index.html`
2. Importar campanha do Google Sheets
3. Acompanhar progresso dos motoristas
4. Revisar evidências enviadas

### Motorista
1. Acesso em `/driver.html`
2. Login com nome + telefone
3. Upload de fotos do veículo
4. Visualização de tarefas pendentes

### Gráfica
1. Acesso em `/graphic.html`
2. Login com email/identificador
3. Upload de comprovantes de aplicação
4. Confirmação de conclusão

---

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch: `git checkout -b feature/nova-funcionalidade`
3. Commit suas mudanças: `git commit -m 'feat: adiciona nova funcionalidade'`
4. Push para a branch: `git push origin feature/nova-funcionalidade`
5. Abra um Pull Request

**Nota:** Pre-commit hooks vão validar seu código automaticamente.

---

## 📄 Licença

Este projeto é privado. Todos os direitos reservados.

---

## 📞 Suporte

**Problemas?**
- Revisar documentação em `/docs`
- Verificar logs: `/api/admin/audit-logs` (após login)
- Testar conexão MongoDB: `npm run test-mongo`

**Em caso de emergência:**
1. Verificar status do Render/MongoDB
2. Revisar últimos commits
3. Fazer rollback se necessário: `git revert HEAD`

---

## 🎯 Roadmap

- [ ] Autenticação OAuth2 social
- [ ] Cache Redis para sessões
- [ ] Compressão automática de imagens
- [ ] Dashboard de métricas em tempo real
- [ ] Notificações push
- [ ] API GraphQL

---

**Desenvolvido com ❤️ para gestão eficiente de campanhas**
