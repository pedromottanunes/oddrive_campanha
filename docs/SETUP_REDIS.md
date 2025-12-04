# Configuração Redis para Sessões

## Por que Redis?

O armazenamento de sessões em memória (Map) funciona apenas em um processo Node.js. Em produção com múltiplas instâncias (escalonamento horizontal) ou durante deploys/restarts, as sessões se perdem.

**Redis resolve:**
- ✅ Sessões compartilhadas entre múltiplas instâncias
- ✅ Persistência entre reinícios
- ✅ TTL nativo (expiração automática)
- ✅ Alta performance (sub-milissegundo)
- ✅ Suporte a autenticação e TLS

## Setup Local (Desenvolvimento)

### Opção 1: Docker Compose (Recomendado)

```powershell
# Iniciar Redis
docker compose up -d

# Verificar status
docker compose ps

# Ver logs
docker compose logs redis

# Parar
docker compose down
```

### Opção 2: Docker run direto

```powershell
docker run -d --name odrive-redis -p 6379:6379 redis:7-alpine
```

### Opção 3: Redis instalado localmente

- Windows: baixe MSI do https://github.com/tporadowski/redis/releases
- Linux: `sudo apt install redis-server`
- macOS: `brew install redis`

## Configuração

### Variáveis de Ambiente

Adicione ao seu `.env`:

```env
# Redis connection string
REDIS_URL=redis://localhost:6379

# Habilitar Redis (default: true)
USE_REDIS=true
```

### Produção (Render, Heroku, AWS)

**Render:**
1. Crie um Redis service no Render Dashboard
2. Copie a `REDIS_URL` (internal ou external)
3. Adicione como variável de ambiente no Web Service

**Heroku:**
```powershell
heroku addons:create heroku-redis:mini
# Heroku adiciona REDIS_URL automaticamente
```

**AWS ElastiCache:**
- Crie cluster Redis no ElastiCache
- Conecte via VPC endpoint
- Configure TLS se necessário: `rediss://endpoint:6380`

**Redis Cloud (managed):**
- Crie database no Redis Cloud (free tier disponível)
- Use connection string fornecida

## Segurança

### Autenticação

Se seu Redis exige senha:

```env
REDIS_URL=redis://:SENHA@localhost:6379
```

### TLS

Para conexões seguras (produção):

```env
REDIS_URL=rediss://user:password@host:6380
```

No código já está configurado para suportar TLS via `rediss://`.

### Network Security

- **Local:** Redis escuta apenas em localhost (seguro)
- **Produção:** 
  - Use VPC/private network
  - Habilite autenticação
  - Configure Security Groups (AWS) / Firewall rules
  - Nunca exponha porta 6379 publicamente

## Testes

### Verificar conexão

```powershell
# Via docker
docker exec -it odrive-redis redis-cli ping
# Deve retornar: PONG

# Listar chaves de sessão
docker exec -it odrive-redis redis-cli keys "session:*"

# Ver uma sessão específica
docker exec -it odrive-redis redis-cli get "session:admin:SEU_TOKEN"
```

### Testar app com Redis

1. Inicie Redis: `docker compose up -d`
2. Configure `.env`: `USE_REDIS=true` e `REDIS_URL=redis://localhost:6379`
3. Inicie a app: `npm start`
4. Faça login no admin
5. Verifique no Redis:

```powershell
docker exec -it odrive-redis redis-cli keys "session:admin:*"
```

### Fallback para memória

Se Redis não estiver disponível, a aplicação **faz fallback automático** para armazenamento em memória (comportamento anterior). Logs informarão:

```
[sessionStore] Redis connection failed after 3 retries
[sessionStore] Using memory fallback
```

## Monitoramento

### Logs da aplicação

O sessionStore logará eventos importantes:

```
[sessionStore] Redis connected
[sessionStore] Redis error: Connection timeout
[sessionStore] Using memory fallback
```

### Redis CLI - comandos úteis

```bash
# Info geral
redis-cli INFO

# Memória usada
redis-cli INFO memory

# Número de chaves
redis-cli DBSIZE

# Ver TTL de uma chave
redis-cli TTL session:admin:abc123

# Monitor operações em tempo real
redis-cli MONITOR
```

## Alta Disponibilidade (Produção)

Para ambientes críticos:

- **Redis Sentinel:** Failover automático (3+ instâncias)
- **Redis Cluster:** Sharding automático para grandes volumes
- **Managed Services:** Redis Cloud, AWS ElastiCache, Azure Cache for Redis
  - Backups automáticos
  - Patching gerenciado
  - Monitoramento incluído

## Troubleshooting

### Erro: "ECONNREFUSED 127.0.0.1:6379"

Redis não está rodando. Soluções:
```powershell
docker compose up -d
# ou
docker start odrive-redis
```

### Erro: "Redis connection timeout"

- Verifique firewall/security groups
- Confirme `REDIS_URL` correto
- Teste conectividade: `telnet host 6379`

### Sessões não persistem entre instâncias

- Verifique se todas as instâncias apontam para o **mesmo** Redis
- Confirme `USE_REDIS=true` em todas
- Verifique logs por erros de conexão

### Performance degradada

- Monitor latência Redis: `redis-cli --latency`
- Verifique uso de memória: `redis-cli INFO memory`
- Considere aumentar recursos ou usar cluster

## Migração de In-Memory para Redis

### Deploy sem downtime

1. **Deploy novo código** (com Redis habilitado)
2. Usuários logados com sessões antigas (memória) **perderão sessão** no deploy
3. Novos logins criarão sessões no Redis
4. Sessões antigas expirarão naturalmente (TTL)

### Preservar sessões existentes (opcional)

Se quiser evitar logout forçado:

1. Antes do deploy, exporte sessões ativas
2. No startup, importe para Redis
3. Exige código customizado (não incluído por padrão)

**Recomendação:** Aceite que usuários façam novo login no deploy (mais simples e seguro).

## Custos

- **Local/Dev:** Grátis (Docker)
- **Redis Cloud:** Free tier 30MB (suficiente para ~10k sessões)
- **Render Redis:** $7/mês (256MB)
- **AWS ElastiCache:** ~$15/mês (cache.t3.micro)
- **Heroku Redis Mini:** $3/mês (25MB)

## Referências

- [ioredis docs](https://github.com/redis/ioredis)
- [Redis commands](https://redis.io/commands)
- [Redis security](https://redis.io/docs/management/security/)
