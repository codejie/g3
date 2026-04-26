import Fastify from 'fastify';
import cors from '@fastify/cors';
import { readFile } from 'fs/promises';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const fastify = Fastify({
  logger: true
});

await fastify.register(cors, {
  origin: true,
  credentials: true
});

async function loadEnv() {
  const envPath = resolve(__dirname, '.env');
  const envContent = await readFile(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      process.env[key.trim()] = value.trim();
    }
  });

  if (!process.env.VITE_BACKEND_PORT) {
    throw new Error('VITE_BACKEND_PORT is not configured in .env');
  }
}

await loadEnv();

await import('./src/config/schema.js');
console.log('Database initialized');

const { default: userRoutes } = await import('./src/modules/user/routes.js');
fastify.register(userRoutes);
console.log('User routes loaded');

const { default: modelRoutes } = await import('./src/modules/model/routes.js');
fastify.register(modelRoutes);
console.log('Model routes loaded');

const { default: projectRoutes } = await import('./src/modules/project/routes.js');
fastify.register(projectRoutes);
console.log('Project routes loaded');

await fastify.register(import('@fastify/multipart'), {
  limits: {
    fileSize: 100 * 1024 * 1024,
  },
});

const { default: fileRoutes } = await import('./src/modules/file/routes.js');
fastify.register(fileRoutes);
console.log('File routes loaded');

fastify.get('/', async () => {
  return { status: 'ok', service: 'G3 Backend' };
});

  const start = async () => {
  try {
    const port = parseInt(process.env.VITE_BACKEND_PORT!);
    await fastify.listen({ port, host: '0.0.0.0' });
    console.log(`Server running on port ${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

const gracefulShutdown = async (signal: string) => {
  console.log(`Received ${signal}, shutting down gracefully...`);
  await fastify.close();
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

start();
