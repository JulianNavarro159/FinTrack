import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

const backendApp = require('./Backend/src/server.js');
const { conn } = require('./Backend/src/db.js');

const PORT = 3000;

async function start() {
  try {
    await conn.authenticate();
  } catch (err) {
    console.warn('[AI Studio] DB init warning:', err.message);
  }

  const isProduction = process.env.NODE_ENV === 'production';
  const distPath = path.resolve(__dirname, 'Frontend/dist');

  if (isProduction && fs.existsSync(distPath)) {
    console.log('[AI Studio] Serving production build from Frontend/dist');
    backendApp.use(express.static(distPath));
    backendApp.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    console.log('[AI Studio] Mounting Vite dev middleware...');
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port: PORT,
        allowedHosts: true
      },
      appType: 'spa',
      root: path.resolve(__dirname, 'Frontend')
    });
    backendApp.use(vite.middlewares);

    // Fallback for HTML routing in SPA
    backendApp.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      try {
        let template = fs.readFileSync(path.resolve(__dirname, 'Frontend/index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  }

  backendApp.listen(PORT, '0.0.0.0', () => {
    console.log(`[FinTrack] Server listening on http://0.0.0.0:${PORT}`);
  });
}

start().catch((err) => {
  console.error('[FinTrack] Startup error:', err);
  process.exit(1);
});
