import db from '../../utils/db.js';
import { v4 as uuidv4 } from 'uuid';
import type { ProviderRow, ModelRow, ProviderOptionRow, ModelOptionRow, Options } from '../../apis/extension/types/model';

export interface CreateProviderData {
  provider_id: string;
  npm?: string;
  builtin?: boolean;
  options: Options[];
}

export interface CreateModelData {
  provider_id: string;
  model_id: string;
  options: Options[];
}

export interface ModelModel {
  listProviders(): ProviderRow[];
  findProviderById(id: string): ProviderRow | undefined;
  findProviderByProviderId(providerId: string): ProviderRow | undefined;
  createProvider(data: CreateProviderData): ProviderRow;
  deleteProvider(id: string): boolean;
  getProviderOptions(providerId: string): ProviderOptionRow[];
  setProviderOptions(providerId: string, options: Options[]): void;
  updateProviderOptions(providerId: string, options: Options[]): void;
  updateProviderNpm(providerId: string, npm: string | null): void;
  updateProviderBuiltin(providerId: string, builtin: number): void;

  listModels(providerId?: string): ModelRow[];
  findModelById(id: string): ModelRow | undefined;
  findModelByModelId(providerId: string, modelId: string): ModelRow | undefined;
  createModel(data: CreateModelData): ModelRow;
  deleteModel(id: string): boolean;
  deleteModelsByProvider(providerId: string): number;
  getModelOptions(modelId: string): ModelOptionRow[];
  setModelOptions(modelId: string, options: Options[]): void;
  updateModelOptions(modelId: string, options: Options[]): void;
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

  findProviderByProviderId(providerId: string): ProviderRow | undefined {
    const stmt = db.prepare('SELECT * FROM providers WHERE provider_id = ?');
    return stmt.get(providerId) as ProviderRow | undefined;
  },

  createProvider(data: CreateProviderData): ProviderRow {
    const id = uuidv4();
    const now = Math.floor(Date.now() / 1000);
    const npmValue = data.npm || null;
    const builtinValue = data.builtin ? 1 : 0;
    const stmt = db.prepare(
      'INSERT INTO providers (id, provider_id, npm, builtin, disabled, created_at, updated_at) VALUES (?, ?, ?, ?, 0, ?, ?)'
    );
    stmt.run(id, data.provider_id, npmValue, builtinValue, now, now);

    this.setProviderOptions(id, data.options);

    const provider = this.findProviderById(id);
    if (!provider) {
      throw new Error('Failed to create provider');
    }
    return provider;
  },

  deleteProvider(id: string): boolean {
    const delOpts = db.prepare('DELETE FROM provider_options WHERE provider_id = ?');
    delOpts.run(id);
    const stmt = db.prepare('DELETE FROM providers WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  },

  getProviderOptions(providerId: string): ProviderOptionRow[] {
    const stmt = db.prepare('SELECT * FROM provider_options WHERE provider_id = ?');
    return stmt.all(providerId) as ProviderOptionRow[];
  },

  setProviderOptions(providerId: string, options: Options[]): void {
    const insertStmt = db.prepare(
      'INSERT OR REPLACE INTO provider_options (id, provider_id, key, value) VALUES (?, ?, ?, ?)'
    );
    for (const opt of options) {
      const optId = uuidv4();
      insertStmt.run(optId, providerId, opt.key, opt.value);
    }
  },

  updateProviderOptions(providerId: string, options: Options[]): void {
    const existing = this.getProviderOptions(providerId);
    const existingKeys = new Set(existing.map(o => o.key));
    const newKeys = new Set(options.map(o => o.key));

    const deleteStmt = db.prepare('DELETE FROM provider_options WHERE provider_id = ? AND key = ?');
    for (const key of existingKeys) {
      if (!newKeys.has(key)) {
        deleteStmt.run(providerId, key);
      }
    }

    const upsertStmt = db.prepare(
      'INSERT OR REPLACE INTO provider_options (id, provider_id, key, value) VALUES (?, ?, ?, ?)'
    );
    for (const opt of options) {
      const existingOpt = existing.find(o => o.key === opt.key);
      const optId = existingOpt ? existingOpt.id : uuidv4();
      upsertStmt.run(optId, providerId, opt.key, opt.value);
    }
  },

  updateProviderNpm(providerId: string, npm: string | null): void {
    const stmt = db.prepare('UPDATE providers SET npm = ? WHERE id = ?');
    stmt.run(npm, providerId);
  },

  updateProviderBuiltin(providerId: string, builtin: number): void {
    const stmt = db.prepare('UPDATE providers SET builtin = ? WHERE id = ?');
    stmt.run(builtin, providerId);
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

  findModelByModelId(providerId: string, modelId: string): ModelRow | undefined {
    const stmt = db.prepare('SELECT * FROM models WHERE provider_id = ? AND model_id = ?');
    return stmt.get(providerId, modelId) as ModelRow | undefined;
  },

  createModel(data: CreateModelData): ModelRow {
    const id = uuidv4();
    const now = Math.floor(Date.now() / 1000);
    const stmt = db.prepare(
      'INSERT INTO models (id, provider_id, model_id, disabled, created_at, updated_at) VALUES (?, ?, ?, 0, ?, ?)'
    );
    stmt.run(id, data.provider_id, data.model_id, now, now);

    this.setModelOptions(id, data.options);

    const model = this.findModelById(id);
    if (!model) {
      throw new Error('Failed to create model');
    }
    return model;
  },

  deleteModel(id: string): boolean {
    const delOpts = db.prepare('DELETE FROM model_options WHERE model_id = ?');
    delOpts.run(id);
    const stmt = db.prepare('DELETE FROM models WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  },

  deleteModelsByProvider(providerId: string): number {
    const models = this.listModels(providerId);
    for (const model of models) {
      const delOpts = db.prepare('DELETE FROM model_options WHERE model_id = ?');
      delOpts.run(model.id);
    }
    const stmt = db.prepare('DELETE FROM models WHERE provider_id = ?');
    const result = stmt.run(providerId);
    return result.changes;
  },

  getModelOptions(modelId: string): ModelOptionRow[] {
    const stmt = db.prepare('SELECT * FROM model_options WHERE model_id = ?');
    return stmt.all(modelId) as ModelOptionRow[];
  },

  setModelOptions(modelId: string, options: Options[]): void {
    const insertStmt = db.prepare(
      'INSERT OR REPLACE INTO model_options (id, model_id, key, value) VALUES (?, ?, ?, ?)'
    );
    for (const opt of options) {
      const optId = uuidv4();
      insertStmt.run(optId, modelId, opt.key, opt.value);
    }
  },

  updateModelOptions(modelId: string, options: Options[]): void {
    const existing = this.getModelOptions(modelId);
    const existingKeys = new Set(existing.map(o => o.key));
    const newKeys = new Set(options.map(o => o.key));

    const deleteStmt = db.prepare('DELETE FROM model_options WHERE model_id = ? AND key = ?');
    for (const key of existingKeys) {
      if (!newKeys.has(key)) {
        deleteStmt.run(modelId, key);
      }
    }

    const upsertStmt = db.prepare(
      'INSERT OR REPLACE INTO model_options (id, model_id, key, value) VALUES (?, ?, ?, ?)'
    );
    for (const opt of options) {
      const existingOpt = existing.find(o => o.key === opt.key);
      const optId = existingOpt ? existingOpt.id : uuidv4();
      upsertStmt.run(optId, modelId, opt.key, opt.value);
    }
  },
};

export default modelModel;
