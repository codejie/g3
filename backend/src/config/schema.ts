import Database from 'better-sqlite3'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { mkdirSync } from 'fs'
import { createHash } from 'crypto'

const __dirname = dirname(fileURLToPath(import.meta.url))

const dbPath = resolve(process.cwd(), process.env.VITE_DATABASE_FILE || './data/appgenius.db')
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
  provider_id TEXT UNIQUE NOT NULL,
  npm TEXT DEFAULT NULL,
  builtin INTEGER DEFAULT 0,
  disabled INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER DEFAULT (strftime('%s', 'now'))
);

-- 提供者选项表
CREATE TABLE IF NOT EXISTS provider_options (
id TEXT PRIMARY KEY,
provider_id TEXT NOT NULL,
key TEXT NOT NULL,
value TEXT NOT NULL,
FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE,
UNIQUE(provider_id, key)
);

-- 模型表
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

-- 模型选项表
CREATE TABLE IF NOT EXISTS model_options (
id TEXT PRIMARY KEY,
model_id TEXT NOT NULL,
key TEXT NOT NULL,
value TEXT NOT NULL,
FOREIGN KEY (model_id) REFERENCES models(id) ON DELETE CASCADE,
UNIQUE(model_id, key)
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
CREATE INDEX IF NOT EXISTS idx_provider_options_provider_id ON provider_options(provider_id);
CREATE INDEX IF NOT EXISTS idx_model_options_model_id ON model_options(model_id);
CREATE INDEX IF NOT EXISTS idx_models_provider_id ON models(provider_id);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_log_entries_user_id ON log_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_log_entries_action ON log_entries(action);
CREATE INDEX IF NOT EXISTS idx_log_entries_created_at ON log_entries(created_at);
`)

const currentTime = Math.floor(Date.now() / 1000)
const hashedPassword = hashPassword('123456')

function deterministicUUID(namespace: string, name: string): string {
  const hash = createHash('sha256').update(`${namespace}:${name}`).digest('hex')
  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    '5' + hash.slice(13, 16),
    ((parseInt(hash.slice(16, 18), 16) & 0x3f) | 0x80).toString(16).padStart(2, '0') + hash.slice(18, 20),
    hash.slice(20, 32),
  ].join('-')
}

const adminUserId = deterministicUUID('user', 'admin')
const adminProfileId = deterministicUUID('profile', 'admin')
const testerUserId = deterministicUUID('user', 'tester')
const testerProfileId = deterministicUUID('profile', 'tester')

const ollamaProviderId = deterministicUUID('provider', 'ollama')
const nvidiaProviderId = deterministicUUID('provider', 'nvidia')
const deepseekProviderId = deterministicUUID('provider', 'deepseek')
const qwen3ModelId = deterministicUUID('model', 'ollama:qwen3-7b')
const gemma4ModelId = deterministicUUID('model', 'ollama:gemma4-26b')
const glm5ModelId = deterministicUUID('model', 'nvidia:glm5')
const gemma4NvidiaModelId = deterministicUUID('model', 'nvidia:gemma4')
const deepseekChatModelId = deterministicUUID('model', 'deepseek:deepseek-chat')
const deepseekV4FlashModelId = deterministicUUID('model', 'deepseek:deepseek-v4-flash')

function deterministicOptionUUID(parentId: string, key: string): string {
  return deterministicUUID(`option:${parentId}`, key)
}

db.exec(`
-- 插入管理员用户
INSERT OR IGNORE INTO profiles (id, user_id, name, email, nickname, avatar, gender, description, department, remark, created_at, updated_at)
VALUES
('${adminProfileId}', '${adminUserId}', 'Administrator', 'admin@appgenius.local', 'Admin', NULL, 'other', 'System Administrator', 'IT', 'Super admin user', ${currentTime}, ${currentTime}),
('${testerProfileId}', '${testerUserId}', 'Test User', 'tester@appgenius.local', 'Tester', NULL, 'male', 'Test account for testing', 'QA', 'Test user', ${currentTime}, ${currentTime});

INSERT OR IGNORE INTO users (id, username, password, role, disabled, profile_id, created_at, updated_at)
VALUES
('${adminUserId}', 'admin', '${hashedPassword}', 'admin', 0, '${adminProfileId}', ${currentTime}, ${currentTime}),
('${testerUserId}', 'tester', '${hashedPassword}', 'user', 0, '${testerProfileId}', ${currentTime}, ${currentTime});

INSERT OR IGNORE INTO providers (id, provider_id, npm, builtin, disabled, created_at, updated_at)
VALUES
  ('${ollamaProviderId}', 'ollama', 'ollama-ai-provider', 0, 0, ${currentTime}, ${currentTime}),
  ('${nvidiaProviderId}', 'nvidia', NULL, 1, 0, ${currentTime}, ${currentTime}),
  ('${deepseekProviderId}', 'deepseek', '@ai-sdk/openai-compatible', 0, 0, ${currentTime}, ${currentTime});

INSERT OR IGNORE INTO provider_options (id, provider_id, key, value)
VALUES
('${deterministicOptionUUID('ollama', 'name')}', '${ollamaProviderId}', 'name', 'Ollama'),
('${deterministicOptionUUID('ollama', 'baseURL')}', '${ollamaProviderId}', 'baseURL', 'http://localhost:11434'),
('${deterministicOptionUUID('nvidia', 'name')}', '${nvidiaProviderId}', 'name', 'NVIDIA Builder'),
('${deterministicOptionUUID('nvidia', 'baseURL')}', '${nvidiaProviderId}', 'baseURL', 'https://build.nvidia.ai'),
('${deterministicOptionUUID('deepseek', 'name')}', '${deepseekProviderId}', 'name', 'DeepSeek'),
('${deterministicOptionUUID('deepseek', 'baseURL')}', '${deepseekProviderId}', 'baseURL', 'https://api.deepseek.com');

INSERT OR IGNORE INTO models (id, provider_id, model_id, disabled, created_at, updated_at)
VALUES
('${qwen3ModelId}', '${ollamaProviderId}', 'qwen3-7b', 0, ${currentTime}, ${currentTime}),
('${gemma4ModelId}', '${ollamaProviderId}', 'gemma4-26b', 0, ${currentTime}, ${currentTime}),
('${glm5ModelId}', '${nvidiaProviderId}', 'z-ai/glm5', 0, ${currentTime}, ${currentTime}),
('${gemma4NvidiaModelId}', '${nvidiaProviderId}', 'google/gemma-4-31b-it', 0, ${currentTime}, ${currentTime}),
('${deepseekChatModelId}', '${deepseekProviderId}', 'deepseek-chat', 0, ${currentTime}, ${currentTime}),
('${deepseekV4FlashModelId}', '${deepseekProviderId}', 'deepseek-v4-flash', 0, ${currentTime}, ${currentTime});

INSERT OR IGNORE INTO model_options (id, model_id, key, value)
VALUES
('${deterministicOptionUUID('qwen3-7b', 'name')}', '${qwen3ModelId}', 'name', 'Qwen3 7B'),
('${deterministicOptionUUID('qwen3-7b', 'description')}', '${qwen3ModelId}', 'description', 'qwen3'),
('${deterministicOptionUUID('qwen3-7b', 'context_size')}', '${qwen3ModelId}', 'context_size', '32768'),
('${deterministicOptionUUID('gemma4-26b', 'name')}', '${gemma4ModelId}', 'name', 'Gemma4 26B'),
('${deterministicOptionUUID('gemma4-26b', 'description')}', '${gemma4ModelId}', 'description', 'good'),
('${deterministicOptionUUID('gemma4-26b', 'context_size')}', '${gemma4ModelId}', 'context_size', '131072'),
('${deterministicOptionUUID('glm5', 'name')}', '${glm5ModelId}', 'name', 'GLM 5'),
('${deterministicOptionUUID('glm5', 'description')}', '${glm5ModelId}', 'description', 'free'),
('${deterministicOptionUUID('glm5', 'context_size')}', '${glm5ModelId}', 'context_size', '128000'),
('${deterministicOptionUUID('nvidia-gemma4', 'name')}', '${gemma4NvidiaModelId}', 'name', 'Gemma 4 31B IT'),
('${deterministicOptionUUID('nvidia-gemma4', 'description')}', '${gemma4NvidiaModelId}', 'description', 'free'),
('${deterministicOptionUUID('nvidia-gemma4', 'context_size')}', '${gemma4NvidiaModelId}', 'context_size', '32768'),
('${deterministicOptionUUID('deepseek-chat', 'name')}', '${deepseekChatModelId}', 'name', 'DeepSeek Chat'),
('${deterministicOptionUUID('deepseek-chat', 'description')}', '${deepseekChatModelId}', 'description', 'DeepSeek Chat'),
('${deterministicOptionUUID('deepseek-chat', 'context_size')}', '${deepseekChatModelId}', 'context_size', '65536'),
('${deterministicOptionUUID('deepseek-v4-flash', 'name')}', '${deepseekV4FlashModelId}', 'name', 'DeepSeek V4 Flash'),
('${deterministicOptionUUID('deepseek-v4-flash', 'description')}', '${deepseekV4FlashModelId}', 'description', 'DeepSeek V4 Flash'),
('${deterministicOptionUUID('deepseek-v4-flash', 'context_size')}', '${deepseekV4FlashModelId}', 'context_size', '65536');
`)

export default db