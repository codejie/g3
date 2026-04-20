import Database from 'better-sqlite3'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { mkdirSync } from 'fs'
import { createHash } from 'crypto'
import { v4 as uuidv4 } from 'uuid'

const __dirname = dirname(fileURLToPath(import.meta.url))

const dbPath = resolve(process.cwd(), process.env.DB_PATH || './data/g3.db')
const dbDir = resolve(dbPath, '..')
mkdirSync(dbDir, { recursive: true })

const db = new Database(dbPath)

function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex')
}

db.exec(`
-- 用户资料表
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

-- 用户表
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

-- 认证令牌表
CREATE TABLE IF NOT EXISTS tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 模型提供者/供应商表
CREATE TABLE IF NOT EXISTS providers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at INTEGER DEFAULT (strftime('%s', 'now'))
);

-- 模型表
CREATE TABLE IF NOT EXISTS models (
  id TEXT PRIMARY KEY,
  provider_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (provider_id) REFERENCES providers(id)
);

-- 项目表
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

-- 日志表
CREATE TABLE IF NOT EXISTS log_entries (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  action TEXT NOT NULL,
  target TEXT,
  details TEXT,
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_tokens_token ON tokens(token);
CREATE INDEX IF NOT EXISTS idx_tokens_user_id ON tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_models_provider_id ON models(provider_id);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_log_entries_user_id ON log_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_log_entries_action ON log_entries(action);
CREATE INDEX IF NOT EXISTS idx_log_entries_created_at ON log_entries(created_at);
`)

const currentTime = Math.floor(Date.now() / 1000)
const hashedPassword = hashPassword('123456')

const adminUserId = uuidv4()
const adminProfileId = uuidv4()
const testerUserId = uuidv4()
const testerProfileId = uuidv4()

db.exec(`
-- 插入管理员用户
INSERT OR IGNORE INTO profiles (id, user_id, name, email, nickname, avatar, gender, description, department, remark, created_at, updated_at)
VALUES
('${adminProfileId}', '${adminUserId}', 'Administrator', 'admin@g3.local', 'Admin', NULL, 'other', 'System Administrator', 'IT', 'Super admin user', ${currentTime}, ${currentTime}),
('${testerProfileId}', '${testerUserId}', 'Test User', 'tester@g3.local', 'Tester', NULL, 'male', 'Test account for testing', 'QA', 'Test user', ${currentTime}, ${currentTime});

INSERT OR IGNORE INTO users (id, username, password, role, disabled, profile_id, created_at, updated_at)
VALUES
('${adminUserId}', 'admin', '${hashedPassword}', 'admin', 0, '${adminProfileId}', ${currentTime}, ${currentTime}),
('${testerUserId}', 'tester', '${hashedPassword}', 'user', 0, '${testerProfileId}', ${currentTime}, ${currentTime});
`)

export default db