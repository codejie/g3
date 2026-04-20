import type { FastifyRequest, FastifyReply } from 'fastify';
import userModel from './model';
import { v4 as uuidv4 } from 'uuid';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import db from '../../utils/db';
import type { LoginRequest, RegisterRequest, Profile } from '../../apis/extension/types/user';

const RESPONSE_CODES = {
  SUCCESS: 0,
  INVALID_REQUEST: -1,
  UNAUTHORIZED: -3,
  NOT_FOUND: -5,
  CONFLICT: -6,
};

const __dirname = dirname(fileURLToPath(import.meta.url));
const TOKEN_FILE = resolve(__dirname, '../../../data/tokens.json');

interface TokenData {
  token: string;
  userId: string;
  expires: number;
}

async function loadTokens(): Promise<TokenData[]> {
  try {
    const data = await readFile(TOKEN_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function saveTokens(tokens: TokenData[]): Promise<void> {
  await mkdir(dirname(TOKEN_FILE), { recursive: true });
  await writeFile(TOKEN_FILE, JSON.stringify(tokens, null, 2));
}

import { createHash } from 'crypto';

function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

export async function loginHandler(request: FastifyRequest, reply: FastifyReply) {
  const { username, password } = request.body as LoginRequest;

  if (!username || !password) {
    return reply.send({
      code: RESPONSE_CODES.INVALID_REQUEST,
      message: 'Username and password required'
    });
  }

  const user = userModel.findByUsername(username);
  if (!user) {
    return reply.send({
      code: RESPONSE_CODES.UNAUTHORIZED,
      message: 'Invalid credentials'
    });
  }

  if (!verifyPassword(password, user.password)) {
    return reply.send({
      code: RESPONSE_CODES.UNAUTHORIZED,
      message: 'Invalid credentials'
    });
  }

  const token = uuidv4();
  const expires = Date.now() + 7 * 24 * 60 * 60 * 1000;

  const tokens = await loadTokens();
  tokens.push({ token, userId: user.id, expires });
  await saveTokens(tokens);

  return reply.send({
    code: RESPONSE_CODES.SUCCESS,
    data: {
      token: { token, expires_at: expires },
      profile: {
        id: user.profile_id || '',
        user_id: user.id,
        name: user.username,
        gender: 'other',
        description: '',
        department: '',
        remark: ''
      }
    }
  });
}

export async function registerHandler(request: FastifyRequest, reply: FastifyReply) {
  const { username, password, role } = request.body as RegisterRequest;

  if (!username || !password) {
    return reply.send({
      code: RESPONSE_CODES.INVALID_REQUEST,
      message: 'Username and password required'
    });
  }

  const existing = userModel.findByUsername(username);
  if (existing) {
    return reply.send({
      code: RESPONSE_CODES.CONFLICT,
      message: 'Username already exists'
    });
  }

  const profileId = uuidv4();
  const currentTime = Math.floor(Date.now() / 1000);
  
  const insertProfile = db.prepare(
    'INSERT INTO profiles (id, user_id, name, gender, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
  );
  insertProfile.run(profileId, '', username, 'other', currentTime, currentTime);

  const user = userModel.create({
    username,
    password: hashPassword(password),
    role,
    profileId
  });

  return reply.status(201).send({
    code: RESPONSE_CODES.SUCCESS,
    data: { id: user.id }
  });
}

export async function logoutHandler(request: FastifyRequest, reply: FastifyReply) {
  const authHeader = request.headers.authorization;
  if (!authHeader) {
    return reply.send({
      code: RESPONSE_CODES.UNAUTHORIZED,
      message: 'No token provided'
    });
  }

  const token = authHeader.replace('Bearer ', '');
  const tokens = await loadTokens();
  const filtered = tokens.filter(t => t.token !== token);
  await saveTokens(filtered);

  return reply.send({ code: RESPONSE_CODES.SUCCESS });
}

export async function profileHandler(request: FastifyRequest, reply: FastifyReply) {
  const userId = (request as any).userId;
  if (!userId) {
    return reply.send({
      code: RESPONSE_CODES.UNAUTHORIZED,
      message: 'Unauthorized'
    });
  }

  const user = userModel.findById(userId);
  if (!user) {
    return reply.send({
      code: RESPONSE_CODES.NOT_FOUND,
      message: 'User not found'
    });
  }

  return reply.send({
    code: RESPONSE_CODES.SUCCESS,
    data: {
      profile: {
        id: user.profile_id || '',
        user_id: user.id,
        name: user.username,
        gender: 'other',
        description: '',
        department: '',
        remark: ''
      }
    }
  });
}