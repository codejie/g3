import db from '../../utils/db';
import { v4 as uuidv4 } from 'uuid';

export interface UserRow {
  id: string;
  username: string;
  password: string;
  role: string;
  disabled: number;
  profile_id: string | null;
  created_at: number;
  updated_at: number;
}

export interface CreateUserData {
  username: string;
  password: string;
  role?: string;
  profileId?: string;
}

export interface UserModel {
  findByUsername(username: string): UserRow | undefined;
  findById(id: string): UserRow | undefined;
  create(data: CreateUserData): UserRow;
  updatePassword(id: string, password: string): boolean;
  delete(id: string): boolean;
  list(limit?: number, offset?: number): UserRow[];
  count(): number;
}

const userModel: UserModel = {
  findByUsername(username: string): UserRow | undefined {
    const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
    return stmt.get(username) as UserRow | undefined;
  },

  findById(id: string): UserRow | undefined {
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    return stmt.get(id) as UserRow | undefined;
  },

  create(data: CreateUserData): UserRow {
    const userId = uuidv4();
    const profileId = data.profileId || null;
    const stmt = db.prepare(
      'INSERT INTO users (id, username, password, role, profile_id) VALUES (?, ?, ?, ?, ?)'
    );
    stmt.run(userId, data.username, data.password, data.role || 'user', profileId);
    const user = this.findById(userId);
    if (!user) {
      throw new Error('Failed to create user');
    }
    return user;
  },

  updatePassword(id: string, password: string): boolean {
    const stmt = db.prepare('UPDATE users SET password = ? WHERE id = ?');
    const result = stmt.run(password, id);
    return result.changes > 0;
  },

  delete(id: string): boolean {
    const stmt = db.prepare('DELETE FROM users WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  },

  list(limit = 50, offset = 0): UserRow[] {
    const stmt = db.prepare('SELECT id, username, role, disabled, created_at FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?');
    return stmt.all(limit, offset) as UserRow[];
  },

  count(): number {
    const stmt = db.prepare('SELECT COUNT(*) as count FROM users');
    return (stmt.get() as { count: number }).count;
  }
};

export default userModel;