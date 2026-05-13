-- AppGenius Database Initialization Script (Release)
-- Usage: sqlite3 data/appgenius.db < scripts/init-db.sql
-- This script creates all required tables, indexes, and a single admin user.
-- Default admin password: 123456 (SHA256: 8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92)

-- Users & Auth
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  nickname TEXT,
  avatar TEXT,
  gender TEXT DEFAULT 'other',
  description TEXT,
  department TEXT,
  remark TEXT,
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER DEFAULT (strftime('%s', 'now'))
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'user',
  disabled INTEGER DEFAULT 0,
  profile_id TEXT,
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (profile_id) REFERENCES profiles(id)
);

CREATE TABLE IF NOT EXISTS tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Models
CREATE TABLE IF NOT EXISTS providers (
  id TEXT PRIMARY KEY,
  provider_id TEXT UNIQUE NOT NULL,
  npm TEXT DEFAULT NULL,
  builtin INTEGER DEFAULT 0,
  disabled INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER DEFAULT (strftime('%s', 'now'))
);

CREATE TABLE IF NOT EXISTS provider_options (
  id TEXT PRIMARY KEY,
  provider_id TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE,
  UNIQUE(provider_id, key)
);

CREATE TABLE IF NOT EXISTS models (
  id TEXT PRIMARY KEY,
  provider_id TEXT NOT NULL,
  model_id TEXT NOT NULL,
  disabled INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE,
  UNIQUE(provider_id, model_id)
);

CREATE TABLE IF NOT EXISTS model_options (
  id TEXT PRIMARY KEY,
  model_id TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  FOREIGN KEY (model_id) REFERENCES models(id) ON DELETE CASCADE,
  UNIQUE(model_id, key)
);

-- Projects
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  session_id TEXT,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active',
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Logs
CREATE TABLE IF NOT EXISTS log_entries (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  action TEXT NOT NULL,
  target TEXT,
  details TEXT,
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Keywords & Prompts
CREATE TABLE IF NOT EXISTS keywords (
  id TEXT PRIMARY KEY,
  keyword TEXT NOT NULL,
  description TEXT,
  disabled INTEGER DEFAULT 0,
  'order' INTEGER DEFAULT 0,
  type TEXT DEFAULT 'general',
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER DEFAULT (strftime('%s', 'now'))
);

CREATE TABLE IF NOT EXISTS prompts (
  id TEXT PRIMARY KEY,
  keyword_id TEXT NOT NULL,
  label TEXT NOT NULL,
  prompt TEXT NOT NULL,
  description TEXT,
  disabled INTEGER DEFAULT 0,
  'order' INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (keyword_id) REFERENCES keywords(id) ON DELETE CASCADE
);

-- System Config
CREATE TABLE IF NOT EXISTS system_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at INTEGER DEFAULT (strftime('%s', 'now'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_tokens_token ON tokens(token);
CREATE INDEX IF NOT EXISTS idx_tokens_user_id ON tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_provider_options_provider_id ON provider_options(provider_id);
CREATE INDEX IF NOT EXISTS idx_model_options_model_id ON model_options(model_id);
CREATE INDEX IF NOT EXISTS idx_models_provider_id ON models(provider_id);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_log_entries_user_id ON log_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_log_entries_action ON log_entries(action);
CREATE INDEX IF NOT EXISTS idx_log_entries_created_at ON log_entries(created_at);
CREATE INDEX IF NOT EXISTS idx_keywords_type ON keywords(type);
CREATE INDEX IF NOT EXISTS idx_keywords_order ON keywords('order');
CREATE INDEX IF NOT EXISTS idx_prompts_keyword_id ON prompts(keyword_id);
CREATE INDEX IF NOT EXISTS idx_prompts_order ON prompts('order');
CREATE INDEX IF NOT EXISTS idx_system_config_key ON system_config(key);

-- Seed: admin user (deterministic UUIDs, matching schema.ts logic)
INSERT OR IGNORE INTO profiles (id, user_id, name, email, nickname, gender, description, department, remark, created_at, updated_at)
VALUES ('09b89c9d-e287-56a5-a206-58e09aa84faf', 'aa73da63-e26b-50a1-bb70-1c2b4c024870', 'Administrator', 'admin@appgenius.local', 'Admin', 'other', 'System Administrator', 'IT', 'Super admin user', strftime('%s', 'now'), strftime('%s', 'now'));

INSERT OR IGNORE INTO users (id, username, password, role, disabled, profile_id, created_at, updated_at)
VALUES ('aa73da63-e26b-50a1-bb70-1c2b4c024870', 'admin', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'admin', 0, '09b89c9d-e287-56a5-a206-58e09aa84faf', strftime('%s', 'now'), strftime('%s', 'now'));

-- Seed: system defaults
INSERT OR IGNORE INTO system_config (key, value, updated_at) VALUES ('autoCleanEnabled', '0', strftime('%s', 'now'));
