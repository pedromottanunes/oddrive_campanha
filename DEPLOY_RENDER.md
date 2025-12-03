Guia rápido para deploy no Render (passo a passo simples)

1) Criar conta
- Acesse https://render.com e crie uma conta (pode usar login via GitHub)

2) Conectar repositório
- No painel do Render, clique em "New" → "Web Service" → escolha GitHub e selecione o repositório deste projeto.

3) Configurar o serviço (backend)
- Branch: `main`
- Root: deixe em branco (raiz do repo)
- Build Command: `npm install`
- Start Command: `npm start` (ou `node backend/server.js`)
- Environment: `Node 18`

4) Variáveis de ambiente
- No painel do serviço em Render, vá em "Environment" e adicione:
  - `DB_TYPE` = `mongo`
  - `MONGO_URI` = `mongodb+srv://USUARIO:SENHA@cluster.../odrive_app?retryWrites=true&w=majority`
  - `MONGO_DB_NAME` = `odrive_app` (opcional)
  - Outras chaves que o app requer (GOOGLE_CLIENT_EMAIL, etc.)

5) Deploy automático
- Habilite "Automatic deploys" para que cada push ao `main` dispare um deploy.

6) Frontend (opcional)
- Se preferir separar frontend estático, crie um "Static Site" no Render apontando para a pasta `frontend`.
  - Build command: deixar vazio
  - Publish directory: `frontend`

7) Domínio
- No Render, adicione domínio customizado (ex.: `admin.oddrive.com.br`) e siga instruções para criar `CNAME` em seu provedor de DNS.

8) Teste
- Acesse a URL gerada pelo Render e verifique se o admin e as rotas de API estão funcionando.
