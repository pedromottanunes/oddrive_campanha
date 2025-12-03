# ODrive Admin + Apps

Este repositório contém o backend (Node/Express) e o frontend (arquivos estáticos) da plataforma ODrive.

Rápido — como publicar no GitHub e habilitar deploy automático (recomendado com Render):

1. Inicializar git e enviar ao GitHub (exemplo mínimo):

```bash
git init
git add .
git commit -m "Initial commit"
# opcional: usar GitHub CLI (recomendado)
# gh repo create meu-usuario/odrive-admin --public --source=. --remote=origin --push
# ou criar repo no GitHub via web e seguir as instruções de push
git remote add origin git@github.com:SEU_USUARIO/SEU_REPO.git
git branch -M main
git push -u origin main
```

2. Conectar repositório ao Render (deploy automático):
   - Crie conta em https://render.com e conecte ao GitHub.
   - Crie um **Web Service** apontando para este repositório (branch `main`).
   - Build command: `npm install`
   - Start command: `npm start` (ou `node backend/server.js`)
   - Defina variáveis de ambiente no painel do Render: `DB_TYPE`, `MONGO_URI`, `MONGO_DB_NAME`, credenciais do Google Drive se necessário.
   - Habilite deploy automático (por push) no painel do Render.

3. Frontend
   - Pode ser servido pelo próprio backend (serve static da pasta `frontend`) ou criar um Static Site separado no Render apontando para a pasta `frontend`.

4. Domínio customizado
   - No Render, adicione domínio (ex.: `admin.oddrive.com.br`) e siga instruções para criar `CNAME` no provedor de DNS.

5. Variáveis de ambiente
   - Nunca comite `.env` com senhas. Use o painel do provedor (Render) para configurar.

6. CI
   - Um workflow GitHub Actions está incluído em `.github/workflows/ci.yml` que instala dependências e executa lint/testes se existirem.

---
Se quiser, eu posso gerar também um script PowerShell para facilitar a criação do `.env` local e os comandos de deploy. Quer que eu gere esse script agora?
# OD Drive - Admin

## Requisitos

- Node.js 18 ou superior instalado
- Credenciais de uma Service Account com acesso ao Google Sheets (compartilhe as planilhas com o e-mail da conta de servico)

## Variaveis de ambiente

Edite o arquivo `.env` na raiz e configure:

```
PORT=5173
GOOGLE_CLIENT_EMAIL=seu-service-account@projeto.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
MONGO_URI=mongodb+srv://<usuario>:<senha>@<cluster>/<db>?retryWrites=true&w=majority
MONGO_DB_NAME=odrive_app
MONGO_TLS_ALLOW_INVALID_CERTS=0     # 1 para ignorar erros de certificado (uso apenas se você controla o cluster)
MONGO_TLS_CA_FILE=                  # caminho opcional para CA customizada (ex: ./certs/mongo-ca.pem)
```

> Importante: mantenha as quebras `\n` dentro da chave privada e use URL encoding se a senha do Mongo tiver caracteres especiais.

## Instalacao

```bash
npm install
```

## Execucao

Servidor (backend) e frontend (admin) juntos:

```bash
npm start
```

O painel do administrador fica disponivel em `http://localhost:5173`.

## Banco de dados (MongoDB + GridFS)

- O backend usa somente MongoDB para sincronizar campanhas, motoristas, evidencias e dados da grafica.
- O arquivo `backend/services/mongo.js` tambem salva as imagens no GridFS (bucket `media`) e cria a arvore `campanha-*/driver-*/*/AAAA-MM-DD/arquivo` usada na aba **Acompanhe**.
- Cada upload retorna um `storageFileId`; o administrador pode abrir a imagem pela rota `/api/storage/:id` (a UI ja faz isso automaticamente).
- O cache local `backend/data/db.json` continua sendo usado para operar offline, mas qualquer inclusao/alteracao e refletida no Mongo em background.
- O botao **Vincular Banco** apenas atualiza as colecoes do MongoDB (nenhum provedor externo de armazenamento e suportado).
