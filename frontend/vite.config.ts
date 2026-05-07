import { defineConfig, loadEnv, type Plugin } from 'vite';
import vue from '@vitejs/plugin-vue';
import fs from 'fs';
import path from 'path';

function serveEnvFile(): Plugin {
  return {
    name: 'serve-env-file',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/.env') {
          const envPath = path.resolve(process.cwd(), '.env');
          try {
            const content = fs.readFileSync(envPath, 'utf-8');
            res.setHeader('Content-Type', 'text/plain');
            res.setHeader('Cache-Control', 'no-cache');
            res.end(content);
          } catch {
            res.statusCode = 404;
            res.end('Not found');
          }
          return;
        }
        next();
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  return {
    plugins: [vue(), serveEnvFile()],
    server: {
      port: parseInt(env.VITE_FRONTEND_PORT || '10091'),
    },
  };
});
