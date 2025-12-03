# 🚀 Setup MongoDB Atlas - Guia Rápido

Este guia te ajuda a configurar o MongoDB Atlas e conectar o app em 5 minutos.

---

## 1️⃣ Criar Conta e Cluster no Atlas

1. Acesse [MongoDB Atlas](https://cloud.mongodb.com/) e faça login (ou crie conta gratuita)
2. Crie um novo **Cluster** (tier M0 Free é suficiente para desenvolvimento)
3. Anote o nome do cluster (exemplo: `Cluster0`)

---

## 2️⃣ Configurar Database User (usuário do banco)

1. No Atlas, vá em **Security → Database Access**
2. Clique em **Add New Database User**
3. Preencha:
   - **Username**: `odrive_app_user` (ou outro nome)
   - **Password**: gere uma senha forte (ou use Autogenerate) — **anote esta senha**
   - **Database User Privileges**:
     - Abra a seção **Specific Privileges**
     - Clique em **Add Privilege**
     - Escolha **Action**: `readWrite`
     - **Database**: `odrive_app` (nome do DB que o app vai usar)
     - Deixe **Collection** vazio (para aplicar a todas as collections)
4. Clique **Add User**

> 💡 **Alternativa simples (menos segura)**: Em vez de Specific Privileges, use Built-in Role → `Read and write to any database` (permite acesso a qualquer banco no cluster).

---

## 3️⃣ Configurar IP Access List (liberar acesso de rede)

1. No Atlas, vá em **Security → Network Access**
2. Clique em **Add IP Address**
3. Escolha uma opção:
   - **Add Current IP Address** (recomendado para desenvolvimento local)
   - **Allow Access from Anywhere** (`0.0.0.0/0`) — apenas para testes rápidos, não recomendado para produção
4. Clique **Confirm**

---

## 4️⃣ Obter a Connection String

1. No Atlas, vá para **Database** (menu lateral) → seu cluster → **Connect**
2. Escolha **Connect your application**
3. **Driver**: selecione `Node.js` (o projeto usa Node)
4. **Version**: `7.0 or later` (o projeto tem `mongodb@7.0.0` instalado)
5. Copie a connection string mostrada (exemplo):
   ```
   mongodb+srv://<username>:<password>@cluster0.abcd.mongodb.net/?retryWrites=true&w=majority
   ```

---

## 5️⃣ Preencher o `.env` do Projeto

Abra o arquivo `.env` na raiz do projeto e localize a seção **MONGODB**:

```env
# ========= MONGODB (NOVO - DATABASE) =========
MONGO_URI=mongodb+srv://<username>:<password>@<cluster-host>/<db-name>?retryWrites=true&w=majority
MONGO_DB_NAME=odrive_app
```

Substitua os placeholders:
- `<username>` → seu usuário (ex.: `odrive_app_user`)
- `<password>` → **sua senha codificada** (veja seção abaixo)
- `<cluster-host>` → host do seu cluster (ex.: `cluster0.abcd.mongodb.net`)
- `<db-name>` → nome do banco (ex.: `odrive_app`)

### 🔐 Codificar senha com caracteres especiais

Se sua senha contém caracteres como `@`, `:`, `/`, `?`, `#`, ou espaços, você **precisa codificar** (URL encoding):

**Opção rápida (Node.js)**:
```powershell
node -e "console.log(encodeURIComponent('p@ss:word#1'))"
# Saída: p%40ss%3Aword%231
```

Use a versão codificada na URI:
```env
MONGO_URI="mongodb+srv://odrive_app_user:p%40ss%3Aword%231@cluster0.abcd.mongodb.net/odrive_app?retryWrites=true&w=majority"
```

**Exemplo final (sem caracteres especiais)**:
```env
MONGO_URI="mongodb+srv://odrive_app_user:MinhaSenhaForte123@cluster0.xyz.mongodb.net/odrive_app?retryWrites=true&w=majority"
MONGO_DB_NAME=odrive_app
```

---

## 6️⃣ Testar a Conexão

Rode o script de teste no PowerShell:

```powershell
npm run test-mongo
```

**Esperado**: você verá uma mensagem como:
```
[test] ✅ Conectado ao MongoDB
[test] Collections em odrive_app : []
```

Se a lista de collections estiver vazia `[]`, está OK (o banco foi criado mas ainda não tem dados).

### ❌ Erros comuns

| Erro | Solução |
|------|---------|
| `MongoServerError: bad auth` | Confirme usuário/senha corretos; verifique se a senha foi URL-encoded |
| `MongoNetworkError` / timeout | Adicione seu IP em **Network Access** no Atlas |
| `MONGO_URI não definido` | Verifique se o `.env` está na raiz do projeto e contém `MONGO_URI` |

---

## 7� Iniciar o Backend

Com o `.env` configurado, inicie o servidor normalmente:

```powershell
npm start
# ou
npm run dev
```

O backend agora usará MongoDB como banco de dados principal.

---

## 📚 Referências

- [MongoDB Atlas Docs](https://www.mongodb.com/docs/atlas/)
- [Node.js MongoDB Driver](https://www.mongodb.com/docs/drivers/node/current/)
- [URL Encoding Reference](https://en.wikipedia.org/wiki/Percent-encoding)

---

**✅ Pronto!** O MongoDB está configurado. Se tiver problemas, verifique os logs do terminal e confirme que IP/usuário/senha estão corretos no Atlas.


