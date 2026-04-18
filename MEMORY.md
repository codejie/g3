# G3 Project 开发记录

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

#### 2. G3扩展API类型定义（apis/extension/）
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
- axios保留用于G3扩展API调用

#### 类型定义策略
- OpenCode API: 基于OpenAPI规范生成，保持一致性
- G3扩展API: 手动定义，更灵活地适配业务需求

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

## 2026-04-17 Thinking标签解析支持

### 完成工作

#### 1. 创建Thinking标签解析器（utils/thinkingParser.ts）
- `parseThinkingTags`: 解析文本中的 `<tool_call>think
