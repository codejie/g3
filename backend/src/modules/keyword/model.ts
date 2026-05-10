import db from '../../utils/db.js';
import { v4 as uuidv4 } from 'uuid';
import type { KeywordRow, PromptRow } from '../../apis/extension/types/keyword';

export interface CreateKeywordData {
  keyword: string;
  description?: string;
  order?: number;
  type?: string;
}

export interface CreatePromptData {
  keyword_id: string;
  label: string;
  prompt: string;
  description?: string;
  order?: number;
}

export interface KeywordModel {
  listKeywords(type?: string): KeywordRow[];
  findKeywordById(id: string): KeywordRow | undefined;
  findKeywordByKeyword(keyword: string): KeywordRow | undefined;
  createKeyword(data: CreateKeywordData): KeywordRow;
  deleteKeyword(id: string): boolean;
  updateKeyword(id: string, fields: Record<string, unknown>): void;
  listPrompts(keywordId: string): PromptRow[];
  findPromptById(id: string): PromptRow | undefined;
  createPrompt(data: CreatePromptData): PromptRow;
  deletePrompt(id: string): boolean;
  updatePrompt(id: string, fields: Record<string, unknown>): void;
}

const keywordModel: KeywordModel = {
  listKeywords(type?: string): KeywordRow[] {
    if (type) {
      const stmt = db.prepare("SELECT * FROM keywords WHERE disabled = 0 AND type = ? ORDER BY 'order' DESC, created_at ASC");
      return stmt.all(type) as KeywordRow[];
    }
    const stmt = db.prepare("SELECT * FROM keywords WHERE disabled = 0 ORDER BY 'order' DESC, created_at ASC");
    return stmt.all() as KeywordRow[];
  },

  findKeywordById(id: string): KeywordRow | undefined {
    const stmt = db.prepare('SELECT * FROM keywords WHERE id = ?');
    return stmt.get(id) as KeywordRow | undefined;
  },

  findKeywordByKeyword(keyword: string): KeywordRow | undefined {
    const stmt = db.prepare('SELECT * FROM keywords WHERE keyword = ?');
    return stmt.get(keyword) as KeywordRow | undefined;
  },

  createKeyword(data: CreateKeywordData): KeywordRow {
    const id = uuidv4();
    const now = Math.floor(Date.now() / 1000);
    const order = data.order ?? 0;
    const type = data.type ?? 'general';
    const description = data.description ?? null;
    const stmt = db.prepare(
      "INSERT INTO keywords (id, keyword, description, disabled, 'order', type, created_at, updated_at) VALUES (?, ?, ?, 0, ?, ?, ?, ?)"
    );
    stmt.run(id, data.keyword, description, order, type, now, now);

    const keyword = this.findKeywordById(id);
    if (!keyword) {
      throw new Error('Failed to create keyword');
    }
    return keyword;
  },

  deleteKeyword(id: string): boolean {
    const delPrompts = db.prepare('DELETE FROM prompts WHERE keyword_id = ?');
    delPrompts.run(id);
    const stmt = db.prepare('DELETE FROM keywords WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  },

  updateKeyword(id: string, fields: Record<string, unknown>): void {
    const now = Math.floor(Date.now() / 1000);
    const sets: string[] = [];
    const values: unknown[] = [];

    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) {
        sets.push(key === 'order' ? "\"order\" = ?" : `${key} = ?`);
        values.push(value);
      }
    }

    if (sets.length === 0) return;

    sets.push('updated_at = ?');
    values.push(now);
    values.push(id);

    const sql = `UPDATE keywords SET ${sets.join(', ')} WHERE id = ?`;
    db.prepare(sql).run(...values);
  },

  listPrompts(keywordId: string): PromptRow[] {
    const stmt = db.prepare("SELECT * FROM prompts WHERE keyword_id = ? AND disabled = 0 ORDER BY 'order' DESC, created_at ASC");
    return stmt.all(keywordId) as PromptRow[];
  },

  findPromptById(id: string): PromptRow | undefined {
    const stmt = db.prepare('SELECT * FROM prompts WHERE id = ?');
    return stmt.get(id) as PromptRow | undefined;
  },

  createPrompt(data: CreatePromptData): PromptRow {
    const id = uuidv4();
    const now = Math.floor(Date.now() / 1000);
    const order = data.order ?? 0;
    const description = data.description ?? null;
    const stmt = db.prepare(
      "INSERT INTO prompts (id, keyword_id, label, prompt, description, disabled, 'order', created_at, updated_at) VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?)"
    );
    stmt.run(id, data.keyword_id, data.label, data.prompt, description, order, now, now);

    const prompt = this.findPromptById(id);
    if (!prompt) {
      throw new Error('Failed to create prompt');
    }
    return prompt;
  },

  deletePrompt(id: string): boolean {
    const stmt = db.prepare('DELETE FROM prompts WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  },

  updatePrompt(id: string, fields: Record<string, unknown>): void {
    const now = Math.floor(Date.now() / 1000);
    const sets: string[] = [];
    const values: unknown[] = [];

    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) {
        sets.push(key === 'order' ? "\"order\" = ?" : `${key} = ?`);
        values.push(value);
      }
    }

    if (sets.length === 0) return;

    sets.push('updated_at = ?');
    values.push(now);
    values.push(id);

    const sql = `UPDATE prompts SET ${sets.join(', ')} WHERE id = ?`;
    db.prepare(sql).run(...values);
  },
};

export default keywordModel;
