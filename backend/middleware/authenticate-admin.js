import fs from 'fs';

const DB_PATH = new URL('../data/db.json', import.meta.url);
const ADMIN_SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 horas

function loadDB() {
  try {
    const db = JSON.parse(fs.readFileSync(DB_PATH));
    db.adminSessions = Array.isArray(db.adminSessions) ? db.adminSessions : [];
    return db;
  } catch {
    return { adminSessions: [] };
  }
}

export function authenticateAdmin(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const [, token] = authHeader.split(' ');
  
  if (!token) {
    return res.status(401).json({ error: 'Autenticacao necessaria' });
  }

  const db = loadDB();
  const session = db.adminSessions.find(s => s.token === token);
  
  if (!session) {
    return res.status(401).json({ error: 'Sessao invalida ou expirada' });
  }
  
  if (session.expiresAt && session.expiresAt < Date.now()) {
    return res.status(401).json({ error: 'Sessao expirada' });
  }

  // Atualiza lastAccessAt
  session.lastAccessAt = Date.now();
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));

  // Adiciona dados do admin no request
  req.adminUser = {
    id: session.userId,
    username: session.username,
    name: session.name,
    role: session.role || 'admin',
    sessionToken: token,
  };

  next();
}

export function optionalAdmin(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const [, token] = authHeader.split(' ');
  
  if (!token) {
    req.adminUser = null;
    return next();
  }

  const db = loadDB();
  const session = db.adminSessions.find(s => s.token === token);
  
  if (!session || (session.expiresAt && session.expiresAt < Date.now())) {
    req.adminUser = null;
    return next();
  }

  req.adminUser = {
    id: session.userId,
    username: session.username,
    name: session.name,
    role: session.role || 'admin',
    sessionToken: token,
  };

  next();
}
