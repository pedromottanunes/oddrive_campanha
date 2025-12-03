# Gerenciamento de Logs de Auditoria (Desenvolvedor)

## 📊 Estrutura do Log no MongoDB

Os logs de auditoria são salvos na collection `admin_audit_log` com a seguinte estrutura:

```javascript
{
  _id: ObjectId("..."),
  userId: "user_id_aqui",
  username: "pedro",
  name: "Pedro Motta Nunes",
  action: "campaign:create",           // Tipo da ação
  entityType: "campaign",              // Tipo de entidade afetada
  entityId: "campaign_id_aqui",        // ID da entidade
  details: {                           // Detalhes específicos da ação
    campaignName: "Campanha X",
    status: "ativa",
    // ... outros campos relevantes
  },
  ipAddress: "192.168.1.100",
  userAgent: "Mozilla/5.0 ...",
  timestamp: ISODate("2025-11-19T10:30:00.000Z"),
  success: true
}
```

## 🔐 Acesso ao MongoDB

### Opção 1: MongoDB Atlas (Interface Web)
1. Acesse: https://cloud.mongodb.com/
2. Login com suas credenciais
3. Selecione o cluster `Cluster0`
4. Clique em "Browse Collections"
5. Navegue até o database `odrive_app`
6. Abra a collection `admin_audit_log`

### Opção 2: MongoDB Compass (Desktop)
1. Baixe: https://www.mongodb.com/try/download/compass
2. Conecte usando a URI:
   ```
   mongodb+srv://pedromottanunes:Calango3488@cluster0.gsd0urm.mongodb.net/odrive_app
   ```
3. Navegue até `odrive_app` > `admin_audit_log`

### Opção 3: Via Código (Node.js)
```javascript
import { getMongoDb } from './backend/services/mongo.js';

const db = await getMongoDb();
const auditLogs = db.collection('admin_audit_log');

// Listar últimos 10 logs
const logs = await auditLogs
  .find()
  .sort({ timestamp: -1 })
  .limit(10)
  .toArray();

console.log(logs);

// Deletar um log específico
await auditLogs.deleteOne({ _id: ObjectId('...') });

// Deletar logs de um usuário específico
await auditLogs.deleteMany({ username: 'pedro' });

// Deletar logs mais antigos que 90 dias
const ninetyDaysAgo = new Date();
ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
await auditLogs.deleteMany({ timestamp: { $lt: ninetyDaysAgo } });
```

## 🗑️ Deletar Logs

### ⚠️ IMPORTANTE
- **Administradores NÃO podem deletar logs pelo sistema**
- Apenas você, desenvolvedor, com acesso direto ao MongoDB
- Logs são permanentes por padrão para garantir rastreabilidade

### Cenários Comuns

**1. Deletar um log específico (via Atlas/Compass):**
- Abra a collection
- Encontre o documento
- Clique no ícone de lixeira
- Confirme a exclusão

**2. Deletar logs de teste (via código):**
```javascript
// Exemplo: deletar todos os logs de uma campanha de teste
await auditLogs.deleteMany({ 
  'details.campaignName': 'Teste - Deletar' 
});
```

**3. Rotina de limpeza automática (opcional):**
Se quiser limpar logs antigos automaticamente, crie um script:
```javascript
// scripts/cleanup-old-logs.js
import { getMongoDb } from '../backend/services/mongo.js';

const db = await getMongoDb();
const auditLogs = db.collection('admin_audit_log');

const sixMonthsAgo = new Date();
sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

const result = await auditLogs.deleteMany({ 
  timestamp: { $lt: sixMonthsAgo } 
});

console.log(`${result.deletedCount} logs antigos removidos`);
process.exit(0);
```

## 📈 Consultas Úteis

### Listar ações de um usuário específico
```javascript
await auditLogs.find({ username: 'pedro' }).toArray();
```

### Contar quantas campanhas foram criadas
```javascript
await auditLogs.countDocuments({ action: 'campaign:create' });
```

### Buscar quem deletou uma campanha específica
```javascript
await auditLogs.findOne({ 
  action: 'campaign:delete',
  entityId: 'campaign_id_aqui'
});
```

### Listar todas as ações de um dia específico
```javascript
const startDate = new Date('2025-11-19T00:00:00.000Z');
const endDate = new Date('2025-11-19T23:59:59.999Z');

await auditLogs.find({
  timestamp: {
    $gte: startDate,
    $lte: endDate
  }
}).toArray();
```

## 🔒 Segurança

- Logs são **imutáveis** via interface web
- Apenas desenvolvedores com credenciais do MongoDB podem alterar
- Collection não tem índice TTL (Time To Live) para deleção automática
- Considere configurar backup automático do MongoDB Atlas

## 📝 Tipos de Ações Registradas

Atualmente o sistema registra:
- `campaign:create` - Criação de campanha
- `campaign:update` - Atualização de campanha
- `campaign:delete` - Exclusão de campanha
- `evidence:verify` - Verificação de evidência
- `driver:create` - Criação de motorista
- `driver:update` - Atualização de motorista
- `driver:delete` - Exclusão de motorista
- `graphic:create` - Criação de gráfica
- `graphic:update` - Atualização de gráfica
- `graphic:delete` - Exclusão de gráfica

*Outros tipos de ações podem ser adicionados no futuro conforme necessário.*
