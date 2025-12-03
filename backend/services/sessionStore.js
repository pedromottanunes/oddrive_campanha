/**
 * Armazenamento seguro de sessões em memória com expiração automática.
 * Substitui o armazenamento em db.json para evitar vazamento de tokens.
 */

const adminSessions = new Map(); // token → session
const userSessions = new Map();   // token → session

const CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // 1 hora
const ADMIN_SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 horas
const USER_SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias

/**
 * Limpa sessões expiradas periodicamente
 */
function cleanupExpiredSessions() {
  const now = Date.now();
  
  for (const [token, session] of adminSessions.entries()) {
    if (session.expiresAt && session.expiresAt < now) {
      adminSessions.delete(token);
    }
  }
  
  for (const [token, session] of userSessions.entries()) {
    if (session.expiresAt && session.expiresAt < now) {
      userSessions.delete(token);
    }
  }
}

// Inicia limpeza automática
setInterval(cleanupExpiredSessions, CLEANUP_INTERVAL_MS);

/**
 * Cria uma nova sessão de administrador
 */
export function createAdminSession(token, userData) {
  const session = {
    token,
    userId: userData.userId || userData.id,
    username: userData.username,
    name: userData.name,
    role: userData.role || 'admin',
    createdAt: Date.now(),
    lastAccessAt: Date.now(),
    expiresAt: Date.now() + ADMIN_SESSION_TTL_MS,
  };
  
  adminSessions.set(token, session);
  return session;
}

/**
 * Busca sessão de administrador
 */
export function getAdminSession(token) {
  if (!token) return null;
  
  const session = adminSessions.get(token);
  if (!session) return null;
  
  // Verifica expiração
  if (session.expiresAt && session.expiresAt < Date.now()) {
    adminSessions.delete(token);
    return null;
  }
  
  // Atualiza último acesso
  session.lastAccessAt = Date.now();
  return session;
}

/**
 * Remove sessão de administrador
 */
export function deleteAdminSession(token) {
  return adminSessions.delete(token);
}

/**
 * Lista todas as sessões de administrador ativas
 */
export function listAdminSessions() {
  const now = Date.now();
  return Array.from(adminSessions.values()).filter(
    s => !s.expiresAt || s.expiresAt >= now
  );
}

/**
 * Cria uma nova sessão de usuário (motorista/arte)
 */
export function createUserSession(token, userData) {
  const session = {
    token,
    userId: userData.userId || userData.id,
    name: userData.name,
    type: userData.type, // 'driver' ou 'graphic'
    role: userData.type, // Compatibilidade com código legado
    driverId: userData.type === 'driver' ? userData.userId : null, // Compatibilidade
    campaignId: userData.campaignId,
    identity: userData.identity, // CPF, placa, etc
    meta: {
      graphicId: userData.type === 'graphic' ? userData.userId : null,
      graphicName: userData.type === 'graphic' ? userData.name : null,
      responsibleName: userData.type === 'graphic' ? userData.name : null,
    },
    createdAt: Date.now(),
    lastAccessAt: Date.now(),
    expiresAt: Date.now() + USER_SESSION_TTL_MS,
  };
  
  userSessions.set(token, session);
  return session;
}

/**
 * Busca sessão de usuário
 */
export function getUserSession(token) {
  if (!token) return null;
  
  const session = userSessions.get(token);
  if (!session) return null;
  
  // Verifica expiração
  if (session.expiresAt && session.expiresAt < Date.now()) {
    userSessions.delete(token);
    return null;
  }
  
  // Atualiza último acesso
  session.lastAccessAt = Date.now();
  return session;
}

/**
 * Remove sessão de usuário
 */
export function deleteUserSession(token) {
  return userSessions.delete(token);
}

/**
 * Lista todas as sessões de usuário ativas
 */
export function listUserSessions() {
  const now = Date.now();
  return Array.from(userSessions.values()).filter(
    s => !s.expiresAt || s.expiresAt >= now
  );
}

/**
 * Remove todas as sessões (usado em testes/manutenção)
 */
export function clearAllSessions() {
  adminSessions.clear();
  userSessions.clear();
}

/**
 * Estatísticas do armazenamento de sessões
 */
export function getSessionStats() {
  return {
    adminSessions: adminSessions.size,
    userSessions: userSessions.size,
    total: adminSessions.size + userSessions.size,
  };
}
