# AppGenius Project 开发记录

## 2026-04-16 工程框架创建

### 完成工作

#### 1. 项目初始化
- 创建前后端工程目录结构
- 配置 TypeScript 开发环境
- 设置符号链接共享配置文件（env, apis）

#### 2. 后端服务（backend）
- 初始化 Fastify 5.8.5 项目
- 配置 better-sqlite3 12.9.0 数据库
- 创建数据库表结构：
  - users: 用户表
  - projects: 项目表
  - sessions: 会话表
  - logs: 日志表
  - files: 文件表
- 实现基础入口文件 index.ts
- 创建数据库工具模块（db.ts, logger.ts）

#### 3. 前端服务（frontend）
- 初始化 Vue 3.5.32 + Vite 8.0.8 项目
- 集成 Element Plus 2.13.7 UI组件库
- 配置 Vue Router 5.0.4 路由
- 集成 Pinia 3.0.4 状态管理
- 创建基础页面：
  - Login.vue: 登录页面
  - Home.vue: 主页面（ChatGPT风格）
  - Admin.vue: 管理页面
- 配置 i18next 26.0.5 国际化支持

#### 4. 依赖管理
- 确保所有依赖使用最新版本
- 移除冗余的 @types/uuid（uuid 自带类型）
- 安装并验证所有依赖包

#### 5. 配置优化
- 修正 tsconfig.json 配置（moduleResolution: bundler）
- 设置正确的 author 字段格式

### 技术决策

#### TypeScript 配置
- 选择 `moduleResolution: "bundler"` 适配 TypeScript 5.0+ 新标准
- 使用 ES2022 作为编译目标

#### 数据库选择
- 选择 better-sqlite3 作为数据库驱动，原因：
  - 轻量级，适合中小型应用
  - 同步API，简化开发
  - 性能优秀

#### 符号链接设计
- 通过符号链接共享 env 和 apis 目录
- 避免配置文件重复
- 方便统一管理

### 遇到的问题

#### 1. moduleResolution 弃用警告
- 问题：TypeScript 提示 `node` 模式已弃用
- 解决：改用 `bundler` 模式

#### 2. @types/uuid 冗余
- 问题：uuid 13.x 自带类型定义
- 解决：移除 @types/uuid 依赖

#### 3. author 字段格式
- 问题：npm 要求特定格式
- 解决：使用对象格式 `{name, email}`

---

## 2026-04-17 OpenCode API集成与前端功能实现

### 完成工作

#### 1. OpenCode API接口生成（apis/opencode/）
- 基于 OpenCode OpenAPI 规范生成完整的类型定义和API接口
- **types/common.ts**: 包含所有类型定义
  - HealthResponse, Config, Auth, Project, Session, SessionStatus
  - Message, AssistantMessage, Part
  - Ptysession, Provider, PermissionRequest, QuestionRequest
  - Todo, FileNode, FileContent, File, VcsInfo, Path
  - Agent, Command, Symbol, McpResource, MCPStatus
  - LSPStatus, FormatterStatus, GlobalEvent
  - 输入类型：PromptInput, CreatePtyInput, UpdatePtyInput
  - WorktreeCreateInput, WorktreeRemoveInput, WorktreeResetInput, FileDiff
- **api/request.ts**: 实现基于fetch的HTTP请求封装
  - 基础函数: `get`, `post`, `put`, `patch`, `del`
  - 配置函数: `setConfig`, `getBaseURL`
- **模块化API**:
  - `globalApi`: 健康检查、事件订阅、配置管理
  - `authApi`: 认证设置和移除
  - `projectApi`: 项目列表、当前项目、项目更新
  - `sessionApi`: 完整会话管理（创建、删除、更新、消息、prompt、fork、share、summarize等）
  - `partApi`: 消息部分管理
  - `ptyApi`: PTY会话管理
  - `configApi`: 配置获取和更新、提供商列表
  - `permissionApi`: 权限请求和回复
  - `questionApi`: 问答请求和回复
  - `providerApi`: 提供商列表、认证、OAuth
  - `toolApi`: 工具列表
  - `worktreeApi`: Worktree创建、删除、重置
  - `resourceApi`: 资源列表
  - `fileApi`: 文件列表、读取、状态
  - `findApi`: 文本搜索、文件搜索、符号搜索
  - `mcpApi`: MCP状态、添加、连接、断开
  - `pathApi`: 路径获取
  - `vcsApi`: 版本控制信息
  - `commandApi`: 命令列表
  - `agentApi`: Agent列表
  - `lspApi`: LSP状态
  - `formatterApi`: 格式化工具状态
  - `eventApi`: 事件订阅
  - `logApi`: 日志写入

#### 2. AppGenius扩展API类型定义（apis/extension/）
- **types/common.ts**: 公共类型定义
  - PageInfo: 分页信息（page, size, total）
  - SortInfo: 排序信息（field, order）
  - BaseRequest: 基础请求接口
  - BaseResponse: 基础响应接口（code, message, data）
  - RESPONSE_CODES: 响应码常量（SUCCESS=0, INVALID_REQUEST=-1等）
- **types/user.ts**: 用户相关类型定义
  - User: 用户实体（id, username, email, password, disabled, created, updated）
  - UserToken: 用户令牌实体
  - LoginRequest/LoginResponse: 登录接口
  - LogoutRequest/LogoutResponse: 登出接口
  - RegisterRequest/RegisterResponse: 注册接口
  - ProfileRequest/ProfileResponse: 用户资料接口

#### 3. 前端页面功能实现

##### Login.vue
- 实现基础登录UI（用户名、密码输入框）
- 实现登录按钮跳转到主页（待对接后端认证API）
- 渐变背景样式设计

##### Home.vue
- 实现三栏布局：菜单面板、聊天面板、工作空间面板
- 集成OpenCode API：
  - 通过环境变量 `VITE_OPENCODE_URL` 配置服务地址
  - 实现会话自动创建功能（首次发送消息时创建）
  - 实现消息发送功能（通过 sessionApi.prompt）
- 状态管理：
  - `currentSessionId`: 当前会话ID
  - `message`: 输入消息内容
- 样式设计：
  - 菜单面板：深色主题（#2c3e50）
  - 聊天面板：浅灰背景（#f5f5f5）
  - 工作空间面板：白色背景

##### Admin.vue
- 实现管理后台基础框架
- 左侧边栏：用户管理、日志查看、系统配置菜单
- 主内容区：管理面板标题

#### 4. 路由配置（frontend/src/router/index.ts）
- 配置三个主要路由：
  - `/`: 重定向到 `/login`
  - `/login`: 登录页面
  - `/home`: 主页面
  - `/admin`: 管理页面
- 使用懒加载方式导入组件

### 技术决策

#### API请求实现
- 选择原生 fetch API 而非 axios
- 原因：OpenCode API已完整实现，fetch足够使用
- axios保留用于AppGenius扩展API调用

#### 类型定义策略
- OpenCode API: 基于OpenAPI规范生成，保持一致性
- AppGenius扩展API: 手动定义，更灵活地适配业务需求

### 遇到的问题

#### 1. 符号链接问题
- 问题：前端和后端通过符号链接共享apis目录
- 解决：正确配置符号链接，确保类型导入正常工作

#### 2. 环境变量配置
- 问题：前端需要访问OpenCode服务
- 解决：使用Vite环境变量 `import.meta.env.VITE_OPENCODE_URL`

### 下一步计划
- 实现用户认证API（登录、注册、登出）
- 实现会话状态持久化（Pinia store）
- 添加消息列表显示和历史记录
- 实现WebSocket消息实时更新
- 完善Admin管理页面功能
- 添加用户数据隔离功能

---

## 2026-04-17 前端页面布局重构（参考g2项目）

### 完成工作

#### 1. Home.vue 页面重构
参考g2项目的布局设计，重构了Home.vue页面：
- **三栏布局**：
  - 左侧：Sidebar组件（会话列表侧边栏）
  - 中间：MainView区域（聊天界面）
  - 右侧：WorkspaceSidebar组件（工作空间侧边栏）
- **响应式设计**：
  - 使用CSS变量系统定义颜色主题
  - 支持侧边栏折叠/展开
  - 安全区域适配（safe-area-inset）
- **聊天功能**：
  - 空状态显示欢迎界面
  - 消息列表（用户消息和AI消息区分显示）
  - 浮动输入框（ChatInput组件）

#### 2. 创建Sidebar组件
- 左侧边栏功能：
  - Logo和品牌标识
  - 新建会话按钮
  - 会话历史列表
  - 设置入口
  - 可折叠设计（带切换按钮）

#### 3. 创建WorkspaceSidebar组件
- 右侧边栏功能：
  - 工作空间标题
  - 文件浏览器占位区域
  - 可折叠设计（带切换按钮）

#### 4. 创建ChatInput组件
- 消息输入功能：
  - 多行文本输入框
  - 快捷操作按钮（写作、页面、应用、表格）
  - Skills选择器占位
  - 模式选择器（build/plan）
  - 发送按钮（支持Ctrl+Enter快捷键）
  - 加载状态动画

#### 5. 更新全局样式（style.css）
- CSS变量定义：
  - 背景色：bg-000, bg-100, bg-200, bg-300, bg-400
  - 文本色：text-000~600
  - 强调色：accent-brand, accent-main-000/100/200
  - 状态色：success, warning, danger, info
  - 边框色：border-100~300
- Markdown渲染样式
- 安全区域变量
- 响应式滚动条样式

#### 6. 添加Vite环境变量类型声明
- 创建 `vite-env.d.ts` 文件
- 定义 `ImportMetaEnv` 接口
- 声明 `VITE_OPENCODE_URL` 环境变量

### 技术决策

#### 布局方案
- 参考g2项目的三栏布局设计
- 使用CSS变量实现主题一致性
- 使用Flexbox进行布局

#### 组件拆分
- 将页面拆分为三个主要组件：Sidebar, ChatInput, WorkspaceSidebar
- 每个组件独立管理自己的状态和样式
- 通过props和emits进行组件间通信

#### 样式系统
- 使用原生CSS变量而非CSS预处理器
- 原因：更轻量、浏览器原生支持、易于维护

### 遇到的问题

#### 1. ImportMeta类型错误
- 问题：TypeScript提示 `Property 'env' does not exist on type 'ImportMeta'`
- 解决：创建 `vite-env.d.ts` 文件，声明环境变量类型

#### 2. 组件依赖关系
- 问题：Home.vue依赖新创建的组件
- 解决：创建组件目录并实现Sidebar, WorkspaceSidebar, ChatInput组件

### 构建验证
- 执行 `npm run build` 成功
- 生成产物：
  - index.html: 0.64 kB
  - Home.css: 11.35 kB
  - Home.js: 15.75 kB
  - 总计约 1.3 MB（含依赖）

### 下一步计划
- 实现Sidebar中的会话列表功能（对接sessionApi）
- 实现消息历史加载（调用sessionApi.messages）
- 添加文件浏览器功能
- 添加用户认证状态管理
- 实现模型选择器功能

---

## 2026-04-17 SSE流式消息处理实现

### 完成工作

#### 1. 创建类型定义（types/index.ts）
- `Message`: 消息实体（info + parts）
- `MessagePart`: 消息部分（text/reasoning/agent/tool）
- `GlobalEvent`: SSE事件类型
- `EventCallbacks`: 事件回调接口
- `Session`: 会话实体
- `Model`: 模型实体
- `ConnectionInfo`: SSE连接状态

#### 2. 创建SSE连接管理（api/events.ts）
参考g2项目的单例模式实现：
- `subscribeToEvents`: 订阅SSE事件
- `reconnectSSE`: 手动重连
- `getConnectionInfo`: 获取连接状态
- 自动重连机制（延迟递增：1s, 2s, 3s, 5s, 10s, 30s）
- 心跳检测（60秒超时自动重连）
- 事件广播（message.part.delta, message.part.updated, session.status, server.heartbeat）

#### 3. 创建消息Store（store/messageStore.ts）
- `messages`: 消息列表
- `isStreaming`: 流式状态
- `addUserMessage`: 添加用户消息
- `handlePartDelta`: 处理增量内容（支持text/reasoning类型）
- `updatePartType`: 更新Part类型（锁定reasoning类型防止覆盖）

#### 4. 创建事件Store（store/eventStore.ts）
- `init`: 初始化SSE连接
- `isServerActive`: 服务器活跃状态（30秒心跳检测）
- 事件分发：onPartDelta, onPartUpdated, onSessionStatus, onServerHeartbeat

#### 5. 创建聊天Store（store/chatStore.ts）
- 会话管理：currentSession, sessionList
- 状态管理：hasSession, loading, sending
- 侧边栏状态：isSidebarCollapsed, isRightSidebarCollapsed
- 操作方法：fetchSessions, startNewSession, selectSession, resetSession

#### 6. 创建Markdown渲染工具（utils/markdownUtils.ts）
- 使用markdown-it库
- 预处理：解包markdown代码块、确保块级元素空行隔离
- 渲染：支持表格、列表、代码块、标题等

#### 7. 更新Home.vue
集成SSE流式消息处理：
- `onMounted`: 初始化SSE连接、获取会话列表
- `onUnmounted`: 断开SSE连接
- `watch`: 监听消息变化自动滚动到底部
- 消息渲染：
  - 用户消息：纯文本
  - AI消息：支持Thinking/Reasoning块、Markdown文本、Agent执行状态
- 使用`sessionApi.promptAsync`发送消息（通过SSE接收响应）

### 技术决策

#### SSE实现方案
- 采用单例模式，全局只有一个SSE连接
- 自动重连机制，网络波动时自动恢复
- 心跳检测，确保连接活跃

#### 消息渲染方案
- Thinking/Reasoning消息：独立块，左侧绿色边框，灰色斜体文本
- 普通文本：Markdown渲染
- Agent执行：状态提示块

#### Store设计
- chatStore: 会话和UI状态
- messageStore: 消息数据和流式处理
- eventStore: SSE连接和事件分发

### 遇到的问题

#### 1. TypeScript类型导入错误
- 问题：ConnectionInfo等类型导入路径错误
- 解决：在types/index.ts定义类型，正确导入

#### 2. markdown-it类型缺失
- 问题：`Could not find a declaration file for module 'markdown-it'`
- 解决：安装 `@types/markdown-it`

#### 3. 未使用的变量警告
- 问题：escapeHtml、reconnectSSE等未使用
- 解决：移除或使用这些函数

### 构建验证
- 执行 `npm run build` 成功
- 生成产物：Home.js 125.33 kB，总构建成功

### 下一步计划
- 实现会话历史消息加载
- 实现模型选择器
- 添加代码高亮（shiki集成）
- 实现文件浏览器
- 添加用户认证和会话恢复

---

## 2026-04-20 User模块实现与登录功能

### 完成工作

#### 1. User模块后端实现（backend/src/modules/user/）
- **model.ts**: 用户数据模型
  - `createUser`: 创建用户
  - `findUserByUsername`: 按用户名查找
  - `findUserById`: 按ID查找
  - `verifyPassword`: 密码验证
- **handler.ts**: 业务处理
  - `loginHandler`: 登录处理
  - `registerHandler`: 注册处理
  - `logoutHandler`: 登出处理
  - `profileHandler`: 获取用户资料
- **routes.ts**: Fastify路由定义
  - `POST /api/user/login`: 登录
  - `POST /api/user/register`: 注册
  - `POST /api/user/logout`: 登出（需认证）
  - `POST /api/user/profile`: 获取资料（需认证）

#### 2. 认证中间件（backend/src/middleware/auth.ts）
- JWT token生成和验证
- Token过期时间：7天
- 认证装饰器

#### 3. 前端API集成（apis/extension/api/userApi.ts）
- `login`: 登录
- `register`: 注册
- `logout`: 登出
- `getProfile`: 获取资料

#### 4. 前端登录页面（frontend/src/views/Login.vue）
- 用户名/密码输入
- 管理员登录选项
- 登录成功后保存token到localStorage
- 跳转路由

### 遇到的问题

#### 1. 数据库路径问题
- 问题：db.ts和schema.ts各自创建数据库连接
- 解决：统一从config/index.ts导出数据库连接

#### 2. 相对路径解析
- 问题：`resolve(__dirname, relativePath)` 相对于源文件目录
- 解决：改用 `resolve(process.cwd(), relativePath)`

#### 3. Vite .env变量展开
- 问题：`VITE_BACKEND_URL=http://127.0.0.1:${VITE_BACKEND_PORT}/api` 不会被展开
- 解决：使用固定URL值

#### 4. Fastify路由类型
- 问题：handler函数泛型与Body类型不匹配
- 解决：使用`FastifyRequest`通过类型断言访问body

#### 5. URL拼接问题
- 问题：`.env`中`VITE_BACKEND_URL=http://127.0.0.1:3001/api`缺少尾随斜杠
- 解决：改为`http://127.0.0.1:3001/api/`
- 原因：`new URL('/user/login', 'http://127.0.0.1:3001/api')`会替换路径为`/user/login`
- 正确：`new URL('user/login', 'http://127.0.0.1:3001/api/')` = `http://127.0.0.1:3001/api/user/login`

### 技术决策

#### API请求URL拼接
- 当baseURL有尾随斜杠时，path不应有前导斜杠
- 当前端传入`user/login`时，配合`http://127.0.0.1:3001/api/`可正确拼接

---

## 2026-04-20 用户状态管理与角色访问控制

### 完成工作

#### 1. 用户状态Store（frontend/src/store/userStore.ts）
- 使用Pinia定义用户状态管理
- 存储用户信息：id, username, role, token, loginTime
- 加密存储：Base64编码 + 密钥混淆 + 字符串反转
- 提供方法：saveUser, loadUser, logout, clearAll

#### 2. 路由守卫（frontend/src/router/authGuard.ts）
- 导航前检查用户登录状态
- 已登录用户访问/login自动跳转对应页面（admin->/admin, user->/home）
- user角色访问/admin自动跳转到/home
- admin角色访问/home自动跳转到/admin
- 页面刷新时自动恢复用户状态

#### 3. 路由配置更新（frontend/src/router/index.ts）
- 添加router.beforeEach全局导航守卫
- 定义页面meta.roles访问权限

#### 4. 登录页面集成（frontend/src/views/Login.vue）
- 使用useUserStore管理用户状态
- 登录成功后保存加密的用户信息
- 页面加载时检查已登录状态

### 技术决策

#### 用户数据加密方案
- 采用多层加密：Base64 -> 反转字符串 -> 添加密钥标识
- 密钥硬编码在代码中，防止直接修改localStorage
- 解码时验证密钥，确保数据完整性

---

## 2026-04-17 Thinking标签解析支持

### 完成工作

#### 1. 创建Thinking标签解析器（utils/thinkingParser.ts）
- `parseThinkingTags`: 解析文本中的 `<think>...</think>` 或 `<thinking>...</thinking>` 标签
- 将标签内容转换为 `reasoning` 类型的 part
- `processPartText`: 处理 part 文本，解析其中的 thinking 标签
- 支持混合文本：标签前后的普通文本作为 `text` 类型保留

---

## 2026-04-21 数据库Schema重构与扩展API实现

### 完成工作

#### 1. 数据库Schema重构（backend/src/config/schema.ts）
从原始的 `utils/db.ts` 迁移并重构到 `config/schema.ts`：
- **主键变更**：所有表从 `INTEGER AUTOINCREMENT` 改为 `TEXT PRIMARY KEY`（UUID格式）
- **新增表**：
- profiles: 用户资料表（id, user_id, name, email, nickname, avatar, gender, description, department, remark）
- tokens: 认证令牌表（id, user_id, token, expires_at）
- providers: 模型提供者表（id, name, description）
- models: 模型表（id, provider_id, name, description）
- log_entries: 日志条目表（id, user_id, action, target, details）
- **表结构更新**：
- users: 增加disabled字段、profile_id外键，时间戳改为INTEGER
- projects: 增加session_id、type、status字段，user_id改为TEXT UUID
- **索引优化**：为profiles、tokens、models、projects、log_entries创建索引
- **初始数据**：自动插入admin用户和tester用户（密码均为123456的SHA256哈希）
- **数据库连接统一**：通过 `config/index.ts` 导出db实例，`utils/db.ts` 仅做转发

#### 2. 后端配置模块（backend/src/config/）
- **index.ts**: 统一导出数据库连接实例
- **schema.ts**: 数据库初始化、表结构创建、索引创建、初始数据插入

#### 3. 认证中间件（backend/src/middleware/auth.ts）
- 基于文件存储的Token认证（tokens.json）
- `loadTokens`: 从文件加载Token列表
- `authenticate`: Fastify preHandler中间件，验证Bearer Token
- Token过期检测

#### 4. User模块后端实现完善（backend/src/modules/user/）
- **model.ts**: 用户数据模型重构
- UserRow接口：id(TEXT UUID), username, password, role, disabled, profile_id
- CRUD方法：findByUsername, findById, create, updatePassword, delete, list, count
- **handler.ts**: 业务处理重构
- 密码使用SHA256哈希（createHash('sha256')）
- Token管理：使用文件存储（data/tokens.json），7天有效期
- 登录返回Token和Profile信息
- 注册时同步创建Profile记录
- **routes.ts**: Fastify路由，带JSON Schema定义
- `POST /api/user/login`: 登录
- `POST /api/user/register`: 注册
- `POST /api/user/logout`: 登出（需认证）
- `POST /api/user/profile`: 获取资料（需认证）

#### 5. 后端入口更新（backend/index.ts）
- 集成 @fastify/cors 跨域支持
- 数据库初始化时导入 schema.js
- 注册User模块路由
- 健康检查接口返回 `{ status: 'ok', service: 'AppGenius Backend' }`

#### 6. 扩展API类型定义完善（apis/extension/types/）
- **user.ts**: 重构为完整类型定义
- Profile, User, Token 实体
- LoginRequest/LoginResult/LoginResponse
- LogoutResponse
- RefreshTokenRequest/RefreshTokenResponse
- RegisterRequest/RegisterResult/RegisterResponse
- ProfileRequest/ProfileResult/ProfileResponse
- UpdateProfileRequest/UpdateProfileResult/UpdateProfileResponse
- **model.ts**: 新增模型相关类型
- Model, Provider 实体
- GetModelsRequest/GetModelsResponse
- AddProviderRequest/AddProviderResponse
- AddModelRequest/AddModelResponse
- DeleteModelRequest/DeleteModelResponse
- DeleteProviderRequest/DeleteProviderResponse
- **project.ts**: 新增项目相关类型
- Project 实体（id, user_id, session_id, name, type, description, status）
- CreateProjectRequest/CreateProjectResponse
- GetProjectsResponse
- UpdateProjectRequest/UpdateProjectResponse
- SetProjectStatusRequest/SetProjectStatusResponse
- ResetProjectSessionRequest/ResetProjectSessionResponse
- **file.ts**: 新增文件相关类型
- FileNode 实体（name, type, size, created, updated）
- GetFilesRequest/GetFilesResponse
- DeleteFileRequest/DeleteFileResponse
- DownloadFileRequest/DownloadFileResponse
- UploadFileRequest/UploadFileResponse
- **log.ts**: 新增日志相关类型
- LogEntry 实体（id, user_id, action, target, details, created）
- GetLogsRequest/GetLogsResponse（含分页信息）
- **index.ts**: 统一导出所有类型

#### 7. 扩展API接口实现（apis/extension/api/）
- **request.ts**: 基于fetch的HTTP请求封装
- RequestConfig接口（baseURL, headers）
- setConfig, getBaseURL, getHeaders 配置方法
- request核心函数：处理URL拼接（支持前导斜杠和非前导斜杠两种情况）
- CRUD方法：get, post, put, patch, del
- **userApi.ts**: 用户API（login, logout, refreshToken, register, getProfile, updateProfile）
- **modelApi.ts**: 模型API（getModels, addProvider, addModel, deleteModel, deleteProvider）
- **projectApi.ts**: 项目API（create, list, update, setStatus, resetSession）
- **fileApi.ts**: 文件API（getFiles, delete, download, upload）
- **logApi.ts**: 日志API（getLogs）
- **index.ts**: 统一导出

#### 8. 扩展API设计文档（spec/extension_api.md）
新增接口设计规范文档：
- 接口规则描述（RESTful风格、POST请求、JSON格式）
- 接口安全性设计（JWT认证、角色权限控制、UUID格式ID）
- User模块接口设计（Login, Logout, Token刷新, Register, Profile, 更新Profile）
- Model模块接口设计（获取模型列表, 增加供应商, 增加模型, 删除模型, 删除供应商）
- Project模块接口设计（创建项目, 获取项目列表, 更新项目, 设置项目状态, 重置项目Session）
- File模块接口设计（获取文件列表, 删除文件, 下载文件, 上传文件）
- Logs模块接口设计（获取日志列表）

### 技术决策

#### 数据库主键方案
- 从INTEGER自增改为UUID TEXT主键
- 原因：分布式友好、与前端ID格式统一、便于数据迁移

#### Token存储方案
- 当前使用文件存储（tokens.json），简单直接
- 后续可迁移到数据库tokens表

#### 密码哈希方案
- 使用Node.js内置crypto模块的SHA256
- 后续可升级为bcrypt等更安全的方案

#### API请求URL拼接
- 支持两种路径格式：带前导斜杠（直接拼接baseURL）和不带前导斜杠（使用URL构造器）
- 建议统一使用不带前导斜杠的路径格式

### 遇到的问题

#### 1. 数据库路径解析
- 问题：db.ts和schema.ts各自创建数据库连接，路径不一致
- 解决：统一从config/index.ts导出数据库连接，utils/db.ts仅做转发

#### 2. 相对路径解析
- 问题：`resolve(__dirname, relativePath)` 相对于源文件目录而非工作目录
- 解决：使用 `resolve(process.cwd(), relativePath)` 基于工作目录解析

#### 3. 数据库表结构演进
- 问题：原始设计使用INTEGER自增主键，与UUID类型的API设计不一致
- 解决：重构所有表使用TEXT(UUID)主键，增加profiles、tokens、providers、models等新表

#### 4. 后端模块化设计
- 问题：初始版本所有逻辑集中在入口文件
- 解决：按功能拆分为modules（user）、middleware（auth）、config（schema）等模块

### 下一步计划
- 实现Model模块后端（provider/model CRUD）
- 实现Project模块后端（项目创建、列表、状态管理、Session关联）
- 实现File模块后端（文件浏览、上传、下载）
- 实现Log模块后端（日志记录和查询）
- Admin管理页面功能实现
- 前端Home页面对接Project和Session管理

---

## 2026-04-22 Model模块与Project模块后端实现

### 完成工作

#### 1. Model模块后端实现（backend/src/modules/model/）
- **model.ts**: Provider和Model数据模型（CRUD操作）
- **handler.ts**: 业务处理（getModels, addProvider, addModel, deleteModel, deleteProvider）
- **routes.ts**: Fastify路由定义（含JSON Schema验证）

#### 2. Project模块后端实现（backend/src/modules/project/）
- **model.ts**: 项目数据模型（create, findById, listByUserId, update, setStatus, resetSession）
- **handler.ts**: 业务处理，创建项目时调用OpenCode API获取session_id
  - createProjectHandler: 创建项目 + OpenCode session
  - getProjectDetailHandler: 返回 { item, directory: `{user_id}/{project_id}/` }
  - getProjectsHandler: 列表过滤deleted，按updated_at降序
  - setProjectStatusHandler: 删除项目时同步删除OpenCode session
  - resetProjectSessionHandler: 重置时删除旧session、创建新session
- **routes.ts**: Fastify路由定义

#### 3. File模块后端实现（backend/src/modules/file/）
- **model.ts**: 文件操作模型
- **handler.ts**: list/delete/download/upload实现，目录下载自动tar.gz打包
- **routes.ts**: Fastify路由定义，使用@fastify/multipart处理上传

### 遇到的问题

#### 1. ESM兼容问题（核心）
- 问题：tsx + Node ESM loader将所有`export const`命名导出放入`default`对象
- 症状：`import { sessionApi }` 运行时得到 `undefined`
- 临时workaround：`import * as m` + `(m as any).default || m`

#### 2. Fastify POST路由body要求
- 问题：Fastify POST路由要求body是object，无body时需默认发送`{}`
- 解决：`post()`无body时传空对象

#### 3. projectApi.list()参数
- 问题：`projectApi.list({})`会导致TS报错
- 解决：`projectApi.list()`不接受参数

---

## 2026-04-24 前端以Project为主的重构

### 完成工作

#### 1. Home.vue项目化重构
- 无项目时显示"请创建或选择一个项目开始对话"，不显示Chat组件
- 选择项目后才显示Chat组件
- currentDirectory ref，directory参数传给promptAsync/messages

#### 2. Sidebar.vue项目化
- fetchProjectDetail返回 { item, directory }
- selectProject事件含directory信息

#### 3. chatStore.ts精简
- saveCurrentProjectId/loadCurrentProjectId持久化到localStorage
- appgenius_current_project_id键

#### 4. messageStore.ts更新
- loadMessages(sessionId, directory?) 从OpenCode加载历史消息

#### 5. 前端401/403处理
- main.ts注册onAuthFailure回调，自动清除登录状态跳转login

#### 6. 后端tsconfig对齐
- 改为bundler模式：moduleResolution: "bundler", allowImportingTsExtensions, isolatedModules, noEmit, noUnusedLocals, noUnusedParameters

---

## 2026-04-25 方案A实施：ESM兼容性修复

### 完成工作

#### 1. 添加export default到apis/opencode/api/request.ts
- 末尾添加`export default { setConfig, getBaseURL, get, post, put, patch, del, globalApi, authApi, ... }`
- 包含所有30个公共API

#### 2. 添加export default到apis/extension/api/request.ts
- 末尾添加`export default { setConfig, setAuthToken, getBaseURL, getHeaders, onAuthFailure, get, post, put, patch, del }`

#### 3. 更新backend project handler.ts
- 从`import * as opencodeModule + .default` workaround
- 改为干净的`import opencodeApi from '../../apis/opencode/api/request'; const { sessionApi, setConfig } = opencodeApi;`

#### 4. 同步apis/副本
- 确认backend/src/apis/和frontend/src/apis/为文件副本（非符号链接）
- 已同步所有变更到副本

#### 5. 验证
- Backend启动测试通过（端口3001，健康检查正常）
- Frontend构建测试通过（259ms完成）

### 技术决策

#### 方案A选择
- 在apis/文件末尾添加`export default`对象
- Backend用`import api from '...'` + 解构（类型安全）
- Frontend命名导入不变（Vite自行处理模块解析）

### 遗留问题
- apis/目录为文件副本而非符号链接，后续变更需手动同步三处（根目录、backend、frontend）
- 建议后续考虑改为符号链接避免同步问题
