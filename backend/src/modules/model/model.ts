import db from '../../utils/db';
import { v4 as uuidv4 } from 'uuid';

export interface ProviderRow {
  id: string;
  name: string;
  description: string | null;
  created_at: number;
}

export interface ModelRow {
  id: string;
  provider_id: string;
  name: string;
  description: string | null;
  context_size: number | null;
  created_at: number;
}

export interface CreateProviderData {
  name: string;
  description?: string;
}

export interface CreateModelData {
  provider_id: string;
  name: string;
  description?: string;
  context_size?: number;
}

export interface ModelModel {
  listProviders(): ProviderRow[];
  findProviderById(id: string): ProviderRow | undefined;
  findProviderByName(name: string): ProviderRow | undefined;
  createProvider(data: CreateProviderData): ProviderRow;
  deleteProvider(id: string): boolean;

  listModels(providerId?: string): ModelRow[];
  findModelById(id: string): ModelRow | undefined;
  createModel(data: CreateModelData): ModelRow;
  deleteModel(id: string): boolean;
  deleteModelsByProvider(providerId: string): number;
}

const modelModel: ModelModel = {
  listProviders(): ProviderRow[] {
    const stmt = db.prepare('SELECT * FROM providers ORDER BY created_at ASC');
    return stmt.all() as ProviderRow[];
  },

  findProviderById(id: string): ProviderRow | undefined {
    const stmt = db.prepare('SELECT * FROM providers WHERE id = ?');
    return stmt.get(id) as ProviderRow | undefined;
  },

  findProviderByName(name: string): ProviderRow | undefined {
    const stmt = db.prepare('SELECT * FROM providers WHERE name = ?');
    return stmt.get(name) as ProviderRow | undefined;
  },

  createProvider(data: CreateProviderData): ProviderRow {
    const id = uuidv4();
    const stmt = db.prepare(
      'INSERT INTO providers (id, name, description) VALUES (?, ?, ?)'
    );
    stmt.run(id, data.name, data.description || null);
    const provider = this.findProviderById(id);
    if (!provider) {
      throw new Error('Failed to create provider');
    }
    return provider;
  },

  deleteProvider(id: string): boolean {
    const stmt = db.prepare('DELETE FROM providers WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  },

  listModels(providerId?: string): ModelRow[] {
    if (providerId) {
      const stmt = db.prepare('SELECT * FROM models WHERE provider_id = ? ORDER BY created_at ASC');
      return stmt.all(providerId) as ModelRow[];
    }
    const stmt = db.prepare('SELECT * FROM models ORDER BY created_at ASC');
    return stmt.all() as ModelRow[];
  },

  findModelById(id: string): ModelRow | undefined {
    const stmt = db.prepare('SELECT * FROM models WHERE id = ?');
    return stmt.get(id) as ModelRow | undefined;
  },

  createModel(data: CreateModelData): ModelRow {
    const id = uuidv4();
    const stmt = db.prepare(
      'INSERT INTO models (id, provider_id, name, description, context_size) VALUES (?, ?, ?, ?, ?)'
    );
    stmt.run(id, data.provider_id, data.name, data.description || null, data.context_size || null);
    const model = this.findModelById(id);
    if (!model) {
      throw new Error('Failed to create model');
    }
    return model;
  },

  deleteModel(id: string): boolean {
    const stmt = db.prepare('DELETE FROM models WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  },

  deleteModelsByProvider(providerId: string): number {
    const stmt = db.prepare('DELETE FROM models WHERE provider_id = ?');
    const result = stmt.run(providerId);
    return result.changes;
  },
};

export default modelModel;
