import Database from 'better-sqlite3'
import { resolve } from 'path'
import { mkdirSync } from 'fs'
import { createHash } from 'crypto'

const dbPath = resolve(process.cwd(), process.env.VITE_DATABASE_FILE || './data/appgenius.db')
const dbDir = resolve(dbPath, '..')
mkdirSync(dbDir, { recursive: true })

const db = new Database(dbPath)

export function hashPassword(password: string): string {
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

-- 快捷关键词表
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

-- 快捷提示词内容表
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
CREATE INDEX IF NOT EXISTS idx_keywords_type ON keywords(type);
CREATE INDEX IF NOT EXISTS idx_keywords_order ON keywords('order');
CREATE INDEX IF NOT EXISTS idx_prompts_keyword_id ON prompts(keyword_id);
CREATE INDEX IF NOT EXISTS idx_prompts_order ON prompts('order');
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

// Keyword seed UUIDs
const kwPageId = deterministicUUID('keyword', 'page')
const kwAppId = deterministicUUID('keyword', 'app')
const kwWritingId = deterministicUUID('keyword', 'writing')
const kwExcelId = deterministicUUID('keyword', 'excel')
const kwDebugId = deterministicUUID('keyword', 'debug')
const kwRefactorId = deterministicUUID('keyword', 'refactor')
const kwApiId = deterministicUUID('keyword', 'api')
const kwExplainId = deterministicUUID('keyword', 'explain')

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

INSERT OR IGNORE INTO keywords (id, keyword, description, disabled, 'order', type, created_at, updated_at)
VALUES
  ('${kwPageId}', '页面', '创建Web页面', 0, 80, 'general', ${currentTime}, ${currentTime}),
  ('${kwAppId}', '应用', '开发应用程序', 0, 70, 'general', ${currentTime}, ${currentTime}),
  ('${kwWritingId}', '写作', '撰写技术文档', 0, 60, 'general', ${currentTime}, ${currentTime}),
  ('${kwExcelId}', '表格', '处理数据表格', 0, 50, 'general', ${currentTime}, ${currentTime}),
  ('${kwDebugId}', '调试', '分析和修复代码问题', 0, 40, 'general', ${currentTime}, ${currentTime}),
  ('${kwRefactorId}', '重构', '优化和重构代码', 0, 30, 'general', ${currentTime}, ${currentTime}),
  ('${kwApiId}', '接口', '设计和实现API接口', 0, 20, 'general', ${currentTime}, ${currentTime}),
  ('${kwExplainId}', '解读', '解读代码实现逻辑', 0, 10, 'general', ${currentTime}, ${currentTime});

INSERT OR IGNORE INTO prompts (id, keyword_id, label, prompt, description, disabled, 'order', created_at, updated_at)
VALUES
  ('${deterministicUUID('prompt', 'page-web')}', '${kwPageId}', 'Web页面', '帮我创建一个Web页面，要求现代化的UI设计风格，响应式布局，交互流畅。我需要的页面是：', '创建现代化Web页面', 0, 10, ${currentTime}, ${currentTime}),
  ('${deterministicUUID('prompt', 'page-landing')}', '${kwPageId}', '落地页', '帮我设计一个产品落地页，要求视觉冲击力强，包含Hero区域、功能介绍、用户评价和行动号召按钮。产品是：', '创建产品落地页', 0, 9, ${currentTime}, ${currentTime}),
  ('${deterministicUUID('prompt', 'page-dashboard')}', '${kwPageId}', '仪表盘', '帮我创建一个数据仪表盘页面，包含图表、统计卡片和实时数据展示。仪表盘需求是：', '创建数据仪表盘', 0, 8, ${currentTime}, ${currentTime}),
  ('${deterministicUUID('prompt', 'app-fullstack')}', '${kwAppId}', '全栈应用', '帮我开发一个应用程序，需要包含前端界面和后端功能，实现核心业务逻辑和数据管理。我的应用需求是：', '开发全栈应用', 0, 10, ${currentTime}, ${currentTime}),
  ('${deterministicUUID('prompt', 'app-mobile')}', '${kwAppId}', '移动应用', '帮我开发一个移动端应用，需要良好的用户体验和流畅的交互。应用需求是：', '开发移动端应用', 0, 9, ${currentTime}, ${currentTime}),
  ('${deterministicUUID('prompt', 'app-mini')}', '${kwAppId}', '小程序', '帮我开发一个小程序，需要简洁的界面和核心功能。小程序需求是：', '开发小程序', 0, 8, ${currentTime}, ${currentTime}),
  ('${deterministicUUID('prompt', 'writing-doc')}', '${kwWritingId}', '技术文档', '帮我撰写一篇技术文档，要求结构清晰、语言准确、格式规范。文档的主题和要点是：', '撰写技术文档', 0, 10, ${currentTime}, ${currentTime}),
  ('${deterministicUUID('prompt', 'writing-readme')}', '${kwWritingId}', 'README', '帮我编写项目的README文档，包含项目介绍、安装步骤、使用方法和贡献指南。项目信息是：', '编写README', 0, 9, ${currentTime}, ${currentTime}),
  ('${deterministicUUID('prompt', 'writing-api-doc')}', '${kwWritingId}', 'API文档', '帮我编写API接口文档，包含接口说明、参数定义、请求示例和响应格式。API信息是：', '编写API文档', 0, 8, ${currentTime}, ${currentTime}),
  ('${deterministicUUID('prompt', 'excel-analysis')}', '${kwExcelId}', '数据分析', '帮我处理数据表格，需要做数据分析、格式整理、图表生成和统计汇总。我的数据处理需求是：', '数据分析处理', 0, 10, ${currentTime}, ${currentTime}),
  ('${deterministicUUID('prompt', 'excel-report')}', '${kwExcelId}', '报表生成', '帮我生成数据报表，包含数据汇总、趋势分析和可视化图表。报表需求是：', '生成数据报表', 0, 9, ${currentTime}, ${currentTime}),
  ('${deterministicUUID('prompt', 'excel-clean')}', '${kwExcelId}', '数据清洗', '帮我清洗和整理数据，处理缺失值、重复数据和格式统一。数据清洗需求是：', '数据清洗整理', 0, 8, ${currentTime}, ${currentTime}),
  ('${deterministicUUID('prompt', 'debug-error')}', '${kwDebugId}', '错误修复', '帮我分析并修复代码问题，定位错误原因，给出修复方案。我遇到的问题是：', '分析修复代码错误', 0, 10, ${currentTime}, ${currentTime}),
  ('${deterministicUUID('prompt', 'debug-performance')}', '${kwDebugId}', '性能排查', '帮我排查性能问题，分析瓶颈并给出优化建议。性能问题是：', '排查性能问题', 0, 9, ${currentTime}, ${currentTime}),
  ('${deterministicUUID('prompt', 'debug-crash')}', '${kwDebugId}', '崩溃分析', '帮我分析程序崩溃原因，定位问题代码并提供修复方案。崩溃信息是：', '分析程序崩溃', 0, 8, ${currentTime}, ${currentTime}),
  ('${deterministicUUID('prompt', 'refactor-quality')}', '${kwRefactorId}', '质量优化', '帮我优化和重构代码，提升代码质量、可读性和可维护性。我的优化目标是：', '提升代码质量', 0, 10, ${currentTime}, ${currentTime}),
  ('${deterministicUUID('prompt', 'refactor-pattern')}', '${kwRefactorId}', '设计模式', '帮我使用设计模式重构代码，改进架构设计。重构目标是：', '应用设计模式', 0, 9, ${currentTime}, ${currentTime}),
  ('${deterministicUUID('prompt', 'refactor-migration')}', '${kwRefactorId}', '技术迁移', '帮我进行技术栈迁移和升级，确保功能兼容和平滑过渡。迁移需求是：', '技术栈迁移', 0, 8, ${currentTime}, ${currentTime}),
  ('${deterministicUUID('prompt', 'api-restful')}', '${kwApiId}', 'RESTful API', '帮我设计和实现RESTful API接口，包含参数定义、数据校验和错误处理。我的接口需求是：', '设计RESTful API', 0, 10, ${currentTime}, ${currentTime}),
  ('${deterministicUUID('prompt', 'api-graphql')}', '${kwApiId}', 'GraphQL', '帮我设计GraphQL接口，定义Schema、Resolver和查询优化。接口需求是：', '设计GraphQL接口', 0, 9, ${currentTime}, ${currentTime}),
  ('${deterministicUUID('prompt', 'api-websocket')}', '${kwApiId}', 'WebSocket', '帮我实现WebSocket实时通信接口，处理连接管理和消息推送。通信需求是：', '实现WebSocket接口', 0, 8, ${currentTime}, ${currentTime}),
  ('${deterministicUUID('prompt', 'explain-code')}', '${kwExplainId}', '代码解读', '帮我解读这段代码的实现逻辑、架构设计和技术细节。我想了解的代码是：', '解读代码逻辑', 0, 10, ${currentTime}, ${currentTime}),
  ('${deterministicUUID('prompt', 'explain-arch')}', '${kwExplainId}', '架构分析', '帮我分析项目的架构设计，包括模块划分、数据流和技术选型。项目信息是：', '分析项目架构', 0, 9, ${currentTime}, ${currentTime}),
  ('${deterministicUUID('prompt', 'explain-algo')}', '${kwExplainId}', '算法讲解', '帮我讲解算法的实现原理、时间复杂度和优化思路。算法是：', '讲解算法原理', 0, 8, ${currentTime}, ${currentTime});
`)

export default db