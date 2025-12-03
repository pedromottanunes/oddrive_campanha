/**
 * Middleware de validação de entrada para prevenir injeções e dados maliciosos
 */

const SPREADSHEET_ID_PATTERN = /^[a-zA-Z0-9_-]{20,}$/;
const CAMPAIGN_CODE_PATTERN = /^[a-zA-Z0-9_-]{1,50}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\d{10,15}$/;
const CPF_PATTERN = /^\d{11}$/;
const PLATE_PATTERN = /^[A-Z]{3}\d{1}[A-Z0-9]{1}\d{2}$/i;
const MONGO_OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;

/**
 * Valida ID de planilha do Google Sheets
 */
export function validateSpreadsheetId(req, res, next) {
  const { spreadsheetId } = req.body || req.query || {};
  
  if (!spreadsheetId) {
    return res.status(400).json({ error: 'spreadsheetId é obrigatório' });
  }
  
  if (!SPREADSHEET_ID_PATTERN.test(spreadsheetId)) {
    return res.status(400).json({ error: 'spreadsheetId inválido' });
  }
  
  next();
}

/**
 * Valida código de campanha
 */
export function validateCampaignCode(req, res, next) {
  const { campaignCode } = req.body || req.query || {};
  
  if (!campaignCode) {
    return res.status(400).json({ error: 'campaignCode é obrigatório' });
  }
  
  if (!CAMPAIGN_CODE_PATTERN.test(campaignCode)) {
    return res.status(400).json({ error: 'Código de campanha inválido' });
  }
  
  next();
}

/**
 * Valida campos de login de motorista
 */
export function validateDriverLogin(req, res, next) {
  const { name, phone, cpf, plate, email } = req.body || {};
  
  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return res.status(400).json({ error: 'Nome inválido (mínimo 2 caracteres)' });
  }
  
  if (!phone || !/^\d{10,15}$/.test(String(phone).replace(/\D/g, ''))) {
    return res.status(400).json({ error: 'Telefone inválido (10-15 dígitos)' });
  }
  
  if (cpf && !/^\d{11}$/.test(String(cpf).replace(/\D/g, ''))) {
    return res.status(400).json({ error: 'CPF inválido (11 dígitos)' });
  }
  
  if (email && !EMAIL_PATTERN.test(email)) {
    return res.status(400).json({ error: 'Email inválido' });
  }
  
  if (plate && !PLATE_PATTERN.test(plate)) {
    return res.status(400).json({ error: 'Placa inválida (formato ABC1D23)' });
  }
  
  // Sanitiza strings para prevenir XSS
  req.body.name = sanitizeString(name);
  if (email) req.body.email = sanitizeString(email);
  
  next();
}

/**
 * Valida campos de login de gráfica
 */
export function validateGraphicLogin(req, res, next) {
  const { identifier, campaignCode } = req.body || {};
  
  if (!identifier || typeof identifier !== 'string' || identifier.trim().length < 3) {
    return res.status(400).json({ error: 'Identificador inválido (mínimo 3 caracteres)' });
  }
  
  if (!campaignCode || !CAMPAIGN_CODE_PATTERN.test(campaignCode)) {
    return res.status(400).json({ error: 'Código de campanha inválido' });
  }
  
  req.body.identifier = sanitizeString(identifier);
  req.body.campaignCode = sanitizeString(campaignCode);
  
  next();
}

/**
 * Valida ID de objeto MongoDB
 */
export function validateMongoId(paramName = 'id') {
  return (req, res, next) => {
    const id = req.params[paramName] || req.query[paramName] || req.body[paramName];
    
    if (!id) {
      return res.status(400).json({ error: `${paramName} é obrigatório` });
    }
    
    if (!MONGO_OBJECT_ID_PATTERN.test(id)) {
      return res.status(400).json({ error: `${paramName} inválido` });
    }
    
    next();
  };
}

/**
 * Valida credenciais de admin
 */
export function validateAdminCredentials(req, res, next) {
  const { username, password } = req.body || {};
  
  if (!username || typeof username !== 'string' || username.trim().length < 3) {
    return res.status(400).json({ error: 'Username inválido (mínimo 3 caracteres)' });
  }
  
  if (!password || typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ error: 'Senha inválida (mínimo 8 caracteres)' });
  }
  
  // Previne username injection
  if (!/^[a-zA-Z0-9_.-]+$/.test(username)) {
    return res.status(400).json({ error: 'Username contém caracteres inválidos' });
  }
  
  req.body.username = username.trim().toLowerCase();
  
  next();
}

/**
 * Valida imagem base64
 */
export function validateBase64Image(req, res, next) {
  const { imageBase64 } = req.body || {};
  
  if (!imageBase64 || typeof imageBase64 !== 'string') {
    return res.status(400).json({ error: 'Imagem inválida' });
  }
  
  // Verifica formato base64 data URL
  if (!imageBase64.startsWith('data:image/')) {
    return res.status(400).json({ error: 'Formato de imagem inválido' });
  }
  
  // Limite de tamanho: 10MB em base64 (~7.5MB arquivo real)
  const sizeInBytes = (imageBase64.length * 3) / 4;
  if (sizeInBytes > 10 * 1024 * 1024) {
    return res.status(400).json({ error: 'Imagem muito grande (máximo 10MB)' });
  }
  
  next();
}

/**
 * Sanitiza string removendo caracteres perigosos
 */
function sanitizeString(str) {
  if (typeof str !== 'string') return '';
  
  return str
    .trim()
    .replace(/[<>]/g, '') // Remove < > para prevenir XSS básico
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove caracteres de controle
    .slice(0, 500); // Limita tamanho
}

/**
 * Middleware genérico para validar presença de campos obrigatórios
 */
export function requireFields(...fields) {
  return (req, res, next) => {
    const data = { ...req.body, ...req.query, ...req.params };
    const missing = fields.filter(field => !data[field]);
    
    if (missing.length > 0) {
      return res.status(400).json({
        error: `Campos obrigatórios ausentes: ${missing.join(', ')}`
      });
    }
    
    next();
  };
}

/**
 * Middleware para sanitizar todos os campos de string do body
 */
export function sanitizeBody(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = sanitizeString(req.body[key]);
      }
    }
  }
  next();
}
