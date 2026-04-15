import Fastify from 'fastify';
import { readFile } from 'fs/promises';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const fastify = Fastify({
  logger: true
});

async function loadEnv() {
  try {
    const envPath = resolve(__dirname, 'env');
    const envContent = await readFile(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) {
        process.env[key.trim()] = value.trim();
      }
    });
  } catch (err) {
    console.log('No env file found, using defaults');
  }
}

await loadEnv();

fastify.get('/', async () => {
  return { status: 'ok', service: 'G3 Backend' };
});

const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '3000');
    await fastify.listen({ port, host: '0.0.0.0' });
    console.log(`Server running on port ${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
