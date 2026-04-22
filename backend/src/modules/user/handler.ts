import type { FastifyRequest, FastifyReply } from 'fastify';
import userModel from './model';
import { v4 as uuidv4 } from 'uuid';
import db from '../../utils/db';
import { createHash } from 'crypto';
import type { LoginRequest, RegisterRequest, ProfileRequest, Profile } from '../../apis/extension/types/user';
import { createToken, saveToken, deleteToken } from '../../middleware/auth';

const RESPONSE_CODES = {
  SUCCESS: 0,
  INVALID_REQUEST: -1,
  UNAUTHORIZED: -3,
  NOT_FOUND: -5,
  CONFLICT: -6,
};

function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

export async function loginHandler(request: FastifyRequest, reply: FastifyReply) {
  const { username, password, role: requestedRole } = request.body as LoginRequest;

  if (!username || !password) {
    return reply.send({
      code: RESPONSE_CODES.INVALID_REQUEST,
      message: 'Username and password required'
    });
  }

  if (!requestedRole) {
    return reply.send({
      code: RESPONSE_CODES.INVALID_REQUEST,
      message: 'Role is required'
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

  if (requestedRole !== user.role) {
    return reply.send({
      code: RESPONSE_CODES.UNAUTHORIZED,
      message: 'Invalid role for this user'
    });
  }

  const token = createToken(user.role);
  const expiresAt = Math.floor((Date.now() + 7 * 24 * 60 * 60 * 1000) / 1000);

  saveToken(user.id, token, expiresAt);

  let profile: Profile = {
    id: user.profile_id || '',
    user_id: user.id,
    name: user.username,
  };

  if (user.profile_id) {
    const profileRow = db.prepare('SELECT * FROM profiles WHERE id = ?').get(user.profile_id) as any;
    if (profileRow) {
      profile = {
        id: profileRow.id,
        user_id: profileRow.user_id,
        name: profileRow.name,
        email: profileRow.email || undefined,
        nickname: profileRow.nickname || undefined,
        avatar: profileRow.avatar || undefined,
        gender: profileRow.gender || undefined,
        description: profileRow.description || undefined,
        department: profileRow.department || undefined,
        remark: profileRow.remark || undefined,
      };
    }
  }

  return reply.send({
    code: RESPONSE_CODES.SUCCESS,
    data: {
      token: { token, expires_at: expiresAt },
      profile
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

  const user = userModel.create({
    username,
    password: hashPassword(password),
    role,
    profileId
  });

  const insertProfile = db.prepare(
    'INSERT INTO profiles (id, user_id, name, gender, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
  );
  insertProfile.run(profileId, user.id, username, 'other', currentTime, currentTime);

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
  deleteToken(token);

  return reply.send({ code: RESPONSE_CODES.SUCCESS });
}

export async function profileHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id: profileId } = request.body as ProfileRequest;
  const userId = (request as any).userId;

  let profileRow: any;

  if (profileId) {
    profileRow = db.prepare('SELECT * FROM profiles WHERE id = ?').get(profileId) as any;
  } else {
    if (!userId) {
      return reply.send({
        code: RESPONSE_CODES.UNAUTHORIZED,
        message: 'Unauthorized'
      });
    }
    const user = userModel.findById(userId);
    if (!user || !user.profile_id) {
      return reply.send({
        code: RESPONSE_CODES.NOT_FOUND,
        message: 'User or profile not found'
      });
    }
    profileRow = db.prepare('SELECT * FROM profiles WHERE id = ?').get(user.profile_id) as any;
  }

  if (!profileRow) {
    return reply.send({
      code: RESPONSE_CODES.NOT_FOUND,
      message: 'Profile not found'
    });
  }

  const profile: Profile = {
    id: profileRow.id,
    user_id: profileRow.user_id,
    name: profileRow.name,
    email: profileRow.email || undefined,
    nickname: profileRow.nickname || undefined,
    avatar: profileRow.avatar || undefined,
    gender: profileRow.gender || undefined,
    description: profileRow.description || undefined,
    department: profileRow.department || undefined,
    remark: profileRow.remark || undefined,
  };

  return reply.send({
    code: RESPONSE_CODES.SUCCESS,
    data: { profile }
  });
}
