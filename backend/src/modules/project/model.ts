import db from '../../utils/db';
import { v4 as uuidv4 } from 'uuid';

export interface ProjectRow {
  id: string;
  user_id: string;
  session_id: string | null;
  name: string;
  type: string;
  description: string | null;
  status: string;
  created_at: number;
  updated_at: number;
}

export interface CreateProjectData {
  user_id: string;
  session_id: string;
  name: string;
  type: string;
  description?: string;
}

export interface UpdateProjectData {
  id: string;
  name?: string;
  type?: string;
  description?: string;
}

export interface ProjectModel {
  listByUserId(userId: string): ProjectRow[];
  findById(id: string): ProjectRow | undefined;
  create(data: CreateProjectData): ProjectRow;
  update(data: UpdateProjectData): boolean;
  setStatus(id: string, status: string): boolean;
  resetSession(id: string, sessionId: string): void;
}

const projectModel: ProjectModel = {
  listByUserId(userId: string): ProjectRow[] {
    const stmt = db.prepare('SELECT * FROM projects WHERE user_id = ? ORDER BY updated_at DESC');
    return stmt.all(userId) as ProjectRow[];
  },

  findById(id: string): ProjectRow | undefined {
    const stmt = db.prepare('SELECT * FROM projects WHERE id = ?');
    return stmt.get(id) as ProjectRow | undefined;
  },

  create(data: CreateProjectData): ProjectRow {
    const id = uuidv4();
    const currentTime = Math.floor(Date.now() / 1000);
    const stmt = db.prepare(
      'INSERT INTO projects (id, user_id, session_id, name, type, description, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    stmt.run(id, data.user_id, data.session_id, data.name, data.type, data.description || null, 'active', currentTime, currentTime);
    const project = this.findById(id);
    if (!project) {
      throw new Error('Failed to create project');
    }
    return project;
  },

  update(data: UpdateProjectData): boolean {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
    if (data.type !== undefined) { fields.push('type = ?'); values.push(data.type); }
    if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description); }

    if (fields.length === 0) return false;

    fields.push('updated_at = ?');
    values.push(Math.floor(Date.now() / 1000));
    values.push(data.id);

    const stmt = db.prepare(`UPDATE projects SET ${fields.join(', ')} WHERE id = ?`);
    const result = stmt.run(...values);
    return result.changes > 0;
  },

  setStatus(id: string, status: string): boolean {
    const currentTime = Math.floor(Date.now() / 1000);
    const stmt = db.prepare('UPDATE projects SET status = ?, updated_at = ? WHERE id = ?');
    const result = stmt.run(status, currentTime, id);
    return result.changes > 0;
  },

  resetSession(id: string, sessionId: string): void {
    const currentTime = Math.floor(Date.now() / 1000);
    const stmt = db.prepare('UPDATE projects SET session_id = ?, updated_at = ? WHERE id = ?');
    stmt.run(sessionId, currentTime, id);
  },
};

export default projectModel;
