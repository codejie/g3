import type { FastifyRequest, FastifyReply } from 'fastify';
import userModel from './model.js';
import { v4 as uuidv4 } from 'uuid';
import db from '../../utils/db.js';
import { hashPassword } from '../../config/schema.js';
import type { LoginRequest, RegisterRequest, ProfileRequest, UpdateProfileRequest, Profile } from '../../apis/extension/types/user';
import { createToken, saveToken, deleteToken } from '../../middleware/auth.js';

const RESPONSE_CODES = {
  SUCCESS: 0,
  INVALID_REQUEST: -1,
  UNAUTHORIZED: -3,
  NOT_FOUND: -5,
  CONFLICT: -6,
  FORBIDDEN: -4,
  SERVER_ERROR: -7,
};

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
  const { username, password, role, name, email, nickname, gender, description, department, remark } = request.body as RegisterRequest;

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
    profileId: undefined
  });

  const profileName = name || username;
  const profileGender = gender || 'other';

  const insertProfile = db.prepare(
    'INSERT INTO profiles (id, user_id, name, email, nickname, gender, description, department, remark, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );
  insertProfile.run(profileId, user.id, profileName, email || null, nickname || null, profileGender, description || null, department || null, remark || null, currentTime, currentTime);

  db.prepare('UPDATE users SET profile_id = ? WHERE id = ?').run(profileId, user.id);

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

export async function listUsersHandler(request: FastifyRequest, reply: FastifyReply) {
  const { role } = request.body as { role?: string };

  let users: any[];
  if (role) {
    const stmt = db.prepare('SELECT id, username, role, disabled, profile_id, created_at, updated_at FROM users WHERE role = ? ORDER BY created_at DESC');
    users = stmt.all(role) as any[];
  } else {
    const stmt = db.prepare('SELECT id, username, role, disabled, profile_id, created_at, updated_at FROM users ORDER BY created_at DESC');
    users = stmt.all() as any[];
  }

  const profileStmt = db.prepare('SELECT * FROM profiles WHERE id = ?');
  const items = users.map((user: any) => {
    let profile: Profile | undefined;
    if (user.profile_id) {
      const profileRow = profileStmt.get(user.profile_id) as any;
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
    return {
      id: user.id,
      username: user.username,
      role: user.role,
      disabled: user.disabled,
      profile_id: user.profile_id,
      created_at: user.created_at,
      updated_at: user.updated_at,
      profile,
    };
  });

  return reply.send({ code: RESPONSE_CODES.SUCCESS, data: { items } });
}

export async function deleteUserHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.body as { id?: string };

  if (!id) {
    return reply.send({ code: RESPONSE_CODES.INVALID_REQUEST, message: 'User ID is required' });
  }

  const user = userModel.findById(id);
  if (!user) {
    return reply.send({ code: RESPONSE_CODES.NOT_FOUND, message: 'User not found' });
  }

  const profileId = user.profile_id;

  const deleteLogEntries = db.prepare('DELETE FROM log_entries WHERE user_id = ?');
  deleteLogEntries.run(id);

  const deleteProjects = db.prepare('DELETE FROM projects WHERE user_id = ?');
  deleteProjects.run(id);

  const deleteTokens = db.prepare('DELETE FROM tokens WHERE user_id = ?');
  deleteTokens.run(id);

  const deleted = userModel.delete(id);
  if (!deleted) {
    return reply.send({ code: RESPONSE_CODES.SERVER_ERROR, message: 'Failed to delete user' });
  }

  if (profileId) {
    db.prepare('DELETE FROM profiles WHERE id = ?').run(profileId);
  }

  return reply.send({ code: RESPONSE_CODES.SUCCESS });
}

export async function changePasswordHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id, new_password } = request.body as { id?: string; new_password?: string };

  if (!id || !new_password) {
    return reply.send({ code: RESPONSE_CODES.INVALID_REQUEST, message: 'User ID and new password are required' });
  }

  const user = userModel.findById(id);
  if (!user) {
    return reply.send({ code: RESPONSE_CODES.NOT_FOUND, message: 'User not found' });
  }

  const hashedPassword = hashPassword(new_password);
  const updated = userModel.updatePassword(id, hashedPassword);
  if (!updated) {
    return reply.send({ code: RESPONSE_CODES.SERVER_ERROR, message: 'Failed to update password' });
  }

  const deleteTokens = db.prepare('DELETE FROM tokens WHERE user_id = ?');
  deleteTokens.run(id);

  return reply.send({ code: RESPONSE_CODES.SUCCESS });
}

export async function updateProfileHandler(request: FastifyRequest, reply: FastifyReply) {
  const { user_id, name, email, nickname, gender, description, department, remark } = request.body as UpdateProfileRequest;

  const targetUserId = user_id || (request as any).userId;
  if (!targetUserId) {
    return reply.send({ code: RESPONSE_CODES.UNAUTHORIZED, message: 'User ID required' });
  }

  const user = userModel.findById(targetUserId);
  if (!user || !user.profile_id) {
    return reply.send({ code: RESPONSE_CODES.NOT_FOUND, message: 'User or profile not found' });
  }

  const profileId = user.profile_id;
  const currentTime = Math.floor(Date.now() / 1000);

  const fields: string[] = [];
  const values: any[] = [];

  if (name !== undefined) { fields.push('name = ?'); values.push(name); }
  if (email !== undefined) { fields.push('email = ?'); values.push(email || null); }
  if (nickname !== undefined) { fields.push('nickname = ?'); values.push(nickname || null); }
  if (gender !== undefined) { fields.push('gender = ?'); values.push(gender || null); }
  if (description !== undefined) { fields.push('description = ?'); values.push(description || null); }
  if (department !== undefined) { fields.push('department = ?'); values.push(department || null); }
  if (remark !== undefined) { fields.push('remark = ?'); values.push(remark || null); }

  if (fields.length === 0) {
    return reply.send({ code: RESPONSE_CODES.INVALID_REQUEST, message: 'No fields to update' });
  }

  fields.push('updated_at = ?');
  values.push(currentTime);
  values.push(profileId);

  db.prepare(`UPDATE profiles SET ${fields.join(', ')} WHERE id = ?`).run(...values);

  return reply.send({ code: RESPONSE_CODES.SUCCESS, data: { id: profileId } });
}

export async function updateUserHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id, role, disabled } = request.body as { id?: string; role?: string; disabled?: number };

  if (!id) {
    return reply.send({ code: RESPONSE_CODES.INVALID_REQUEST, message: 'User ID is required' });
  }

  const user = userModel.findById(id);
  if (!user) {
    return reply.send({ code: RESPONSE_CODES.NOT_FOUND, message: 'User not found' });
  }

  const fields: string[] = [];
  const values: any[] = [];

  if (role !== undefined) { fields.push('role = ?'); values.push(role); }
  if (disabled !== undefined) { fields.push('disabled = ?'); values.push(disabled); }

  if (fields.length === 0) {
    return reply.send({ code: RESPONSE_CODES.INVALID_REQUEST, message: 'No fields to update' });
  }

  fields.push('updated_at = ?');
  values.push(Math.floor(Date.now() / 1000));
  values.push(id);

  db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...values);

  return reply.send({ code: RESPONSE_CODES.SUCCESS, data: { id } });
}
