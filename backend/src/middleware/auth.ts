import { FastifyRequest, FastifyReply } from 'fastify';
import { readFile } from 'fs/promises';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TOKEN_FILE = resolve(__dirname, '../../data/tokens.json');

interface TokenData {
  token: string;
  userId: string;
  expires: number;
}

export async function loadTokens(): Promise<TokenData[]> {
  try {
    const data = await readFile(TOKEN_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  const authHeader = request.headers.authorization;
  if (!authHeader) {
    return reply.status(401).send({ code: -3, message: 'Unauthorized: No token provided' });
  }

  const token = authHeader.replace('Bearer ', '');
  const tokens = await loadTokens();
  const tokenData = tokens.find(t => t.token === token && t.expires > Date.now());

  if (!tokenData) {
    return reply.status(401).send({ code: -3, message: 'Unauthorized: Invalid or expired token' });
  }

  (request as any).userId = tokenData.userId;
}