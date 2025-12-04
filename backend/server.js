import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import campaignsRouter from './routes/campaigns.js';
import importsRouter from './routes/imports.js';
import configRouter from './routes/config.js';
import sessionRouter from './routes/sessions.js';
import storageRouter from './routes/storage.js';
import adminAuthRouter from './routes/admin-auth.js';
import os from 'os';

const app = express();

// Configuração de segurança HTTP com Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Necessário para apps legados
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000, // 1 ano
    includeSubDomains: true,
    preload: true,
  },
}));

// Rate limiting para prevenir ataques de força bruta
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // Máximo 10 tentativas (relaxado para ambientes móveis/carrier NAT)
  message: { error: 'Muitas tentativas de login. Tente novamente em 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Máximo 100 requisições
  message: { error: 'Muitas requisições. Tente novamente mais tarde.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(cors());
// increase body limit to handle base64 images from mobile capture
app.use(express.json({ limit: '20mb' }));

// API com rate limiting
app.use('/api/admin/login', loginLimiter); // Limite estrito para login
app.use('/api/session/driver', loginLimiter); // Limite para login de motorista
app.use('/api/session/graphic', loginLimiter); // Limite para login de gráfica
app.use('/api', apiLimiter); // Limite geral para todas as APIs

app.use('/api/campaigns', campaignsRouter);
app.use('/api/imports', importsRouter);
app.use('/api/config', configRouter);
app.use('/api/session', sessionRouter);
app.use('/api/storage', storageRouter);
app.use('/api/admin', adminAuthRouter);

// servir o frontend estatico (desktop-first)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/', express.static(path.join(__dirname, '..', 'frontend')));

const PORT = process.env.PORT || 5173;
app.listen(PORT, () => {
  console.log(`Admin rodando em http://localhost:${PORT}`);
  // Auto-ensure DB schema on startup (delegado ao service `db.js`)
  (async () => {
    try {
      const { ensureDatabaseSchema } = await import('./services/db.js');
      const out = await ensureDatabaseSchema();
      if (out?.created) console.log('[db] Schema criado/garantido.');
      else console.log('[db] Schema OK.');
    } catch (e) {
      console.warn('[db] Falha ao garantir schema:', e?.message || e);
    }
  })();
  try {
    const nets = os.networkInterfaces();
    const addrs = Object.values(nets)
      .flat()
      .filter(Boolean)
      .filter(n => (n.family === 'IPv4' || n.family === 4) && !n.internal)
      .map(n => n.address);
    if (addrs.length) {
      console.log('Acesse pela rede local:');
      for (const ip of addrs) {
        console.log(`- Admin:    http://${ip}:${PORT}/`);
        console.log(`- Motorista: http://${ip}:${PORT}/driver.html`);
        console.log(`- Gráfica:   http://${ip}:${PORT}/graphic.html`);
      }
    }
  } catch (e) {
    // ignore network listing errors
  }
});
