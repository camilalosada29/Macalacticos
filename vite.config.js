import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import handler from './api/calendar.js';

function apiCalendarMiddleware(env) {
  return {
    name: 'api-calendar-middleware',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url.startsWith('/api/calendar')) {
          // Asignar variables de entorno a process.env para desarrollo local
          Object.assign(process.env, env);

          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', async () => {
            try {
              if (body) {
                req.body = JSON.parse(body);
              }
            } catch {
              req.body = {};
            }

            const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
            req.query = Object.fromEntries(urlObj.searchParams.entries());

            res.status = (code) => {
              res.statusCode = code;
              return res;
            };
            res.json = (data) => {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(data));
            };

            try {
              await handler(req, res);
            } catch (err) {
              console.error('Error en middleware API local:', err);
              if (!res.headersSent) {
                res.statusCode = 500;
                res.end(JSON.stringify({ success: false, error: err.message }));
              }
            }
          });
          return;
        }
        next();
      });
    }
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), apiCalendarMiddleware(env)],
  };
});
