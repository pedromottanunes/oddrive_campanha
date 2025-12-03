import { Router } from 'express';
import bcrypt from 'bcrypt';
import { nanoid } from 'nanoid';
import { findAdminUserByUsername, listAuditLogs } from '../services/db.js';
import { authenticateAdmin } from '../middleware/authenticate-admin.js';
import { ensureLegacyStoreReady, loadLegacyDb, saveLegacyDb } from '../services/legacyStore.js';

await ensureLegacyStoreReady();

const router = Router();
const ADMIN_SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 horas

function loadDB() {
  const db = loadLegacyDb();
  db.adminSessions = Array.isArray(db.adminSessions) ? db.adminSessions : [];
  return db;
}

function saveDB(db) {
  if (!Array.isArray(db.adminSessions)) db.adminSessions = [];
  saveLegacyDb(db);
}

function createAdminSession(db, user) {
  const token = nanoid(48);
  const now = Date.now();
  const session = {
    id: nanoid(12),
    token,
    role: 'admin',
    userId: String(user._id),
    username: user.username,
    name: user.name,
    createdAt: now,
    lastAccessAt: now,
    expiresAt: now + ADMIN_SESSION_TTL_MS,
  };
  db.adminSessions.push(session);
  return session;
}

// POST /api/admin/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ error: 'Username e senha sao obrigatorios' });
  }

  try {
    const user = await findAdminUserByUsername(username);

    if (!user) {
      return res.status(401).json({ error: 'Credenciais invalidas' });
    }

    if (!user.active) {
      return res.status(403).json({ error: 'Usuario desativado' });
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Credenciais invalidas' });
    }

    const db = loadDB();
    const session = createAdminSession(db, user);
    saveDB(db);

    res.json({
      token: session.token,
      role: 'admin',
      expiresAt: session.expiresAt,
      user: {
        id: String(user._id),
        username: user.username,
        name: user.name,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('[admin-auth] Erro no login:', err);
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

// GET /api/admin/me
router.get('/me', authenticateAdmin, (req, res) => {
  res.json({
    user: {
      id: req.adminUser.id,
      username: req.adminUser.username,
      name: req.adminUser.name,
      role: req.adminUser.role,
    },
  });
});

// POST /api/admin/logout
router.post('/logout', authenticateAdmin, (req, res) => {
  const token = req.adminUser.sessionToken;
  const db = loadDB();
  db.adminSessions = db.adminSessions.filter(s => s.token !== token);
  saveDB(db);
  res.json({ ok: true });
});

// GET /api/admin/audit-logs
router.get('/audit-logs', authenticateAdmin, async (req, res) => {
  try {
    const { username, action, entityType, limit = 100, skip = 0 } = req.query;
    
    const filters = {};
    if (username) filters.username = username;
    if (action) filters.action = action;
    if (entityType) filters.entityType = entityType;
    
    const logs = await listAuditLogs(filters, {
      limit: parseInt(limit, 10) || 100,
      skip: parseInt(skip, 10) || 0,
    });

    res.json({ logs });
  } catch (err) {
    console.error('[admin-auth] Erro ao buscar logs:', err);
    res.status(500).json({ error: 'Erro ao buscar logs de auditoria' });
  }
});

export default router;
