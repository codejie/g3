import { FastifyRequest, FastifyReply } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import db from '../utils/db';

export type AuthMode = 'none' | 'user' | 'admin' | 'any';

const TOKEN_PREFIX = {
  admin: 'adm_',
  user: 'usr_',
} as const;

export function createToken(role: string): string {
  const prefix = role === 'admin' ? TOKEN_PREFIX.admin : TOKEN_PREFIX.user;
  return prefix + uuidv4();
}

export function getTokenPrefix(role: string): string {
  return role === 'admin' ? TOKEN_PREFIX.admin : TOKEN_PREFIX.user;
}

export function saveToken(userId: string, token: string, expiresAt: number): void {
  const id = uuidv4();
  const stmt = db.prepare(
    'INSERT INTO tokens (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)'
  );
  stmt.run(id, userId, token, expiresAt);
}

export function deleteToken(token: string): void {
  const stmt = db.prepare('DELETE FROM tokens WHERE token = ?');
  stmt.run(token);
}

interface UserInfo {
  userId: string;
  role: string;
}

function findToken(token: string): any | null {
  const now = Math.floor(Date.now() / 1000);
  const stmt = db.prepare(
    'SELECT t.*, u.role FROM tokens t JOIN users u ON t.user_id = u.id WHERE t.token = ? AND t.expires_at > ?'
  );
  return stmt.get(token, now) as any || null;
}

function validateTokenForMode(token: string, mode: AuthMode): UserInfo | null {
  if (mode === 'none') return null;

  const tokenRow = findToken(token);
  if (!tokenRow) return null;

  const role = tokenRow.role;
  const userId = tokenRow.user_id;

  if (mode === 'any') return { userId, role };
  if (mode === 'admin' && role === 'admin') return { userId, role };
  if (mode === 'user' && (role === 'user' || role === 'admin')) return { userId, role };

  return null;
}

export function createAuthMiddleware(mode: AuthMode) {
  return async function authenticate(request: FastifyRequest, reply: FastifyReply) {
    if (mode === 'none') return;

    const authHeader = request.headers.authorization;
    if (!authHeader) {
      return reply.status(401).send({ code: -3, message: 'Unauthorized: No token provided' });
    }

    const token = authHeader.replace('Bearer ', '');
    const userInfo = validateTokenForMode(token, mode);

    if (!userInfo) {
      if (mode === 'admin') {
        return reply.status(403).send({ code: -4, message: 'Forbidden: Admin access required' });
      }
      return reply.status(401).send({ code: -3, message: 'Unauthorized: Invalid or expired token' });
    }

    (request as any).userId = userInfo.userId;
    (request as any).userRole = userInfo.role;
  };
}

export const authenticate = createAuthMiddleware('any');
export const authenticateUser = createAuthMiddleware('user');
export const authenticateAdmin = createAuthMiddleware('admin');
