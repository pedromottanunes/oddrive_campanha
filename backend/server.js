import 'dotenv/config';
import express from 'express';
import cors from 'cors';
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
app.use(cors());
// increase body limit to handle base64 images from mobile capture
app.use(express.json({ limit: '20mb' }));

// API
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
