# AppGenius Project
AppGenius工程是一个OpenCode的增强版本，旨在提供更强大的功能和更好的用户体验。以下是AppGenius工程的主要特点：
- 支持多用户同时使用OpenCode服务
- 支持会话管理，可以保存和恢复用户的会话状态
- 支持用户数据隔离，通过目录结构和权限控制，实现用户只能访问自己的数据
- 支持文件上传和下载，方便用户管理自己的文件
- 支持日志记录，实现管理员监控和调试系统
- 提供扩展服务和API接口，实现对OpenCode的功能扩展，包括模型配置、Skills部署等
- 提供Web界面，实现用户进行操作和服务管理

# 工程组成
AppGenius工程是由两个独立的服务组成的，分别是前端服务和后端服务。

## 前端服务/frontend
前端服务提供Web页面服务，用户通过Web界面实现OpenCode的功能操作、扩展服务和配置、用户管理。

### 技术栈
- Typescript 5.8.3: 作为主要的编程语言
- Vue.js 3.5.32: 作为前端框架，提供响应式和组件化的开发方式
- Vite 8.0.8: 作为前端构建工具，提供快速的开发和构建
- Element Plus 2.13.7: 作为UI组件库，提供丰富的组件和良好的设计风格
- Vue Router 5.0.4: 作为路由管理，支持SPA应用
- Pinia 3.0.4: 作为状态管理，提供响应式数据存储
- i18next 26.0.5: 作为国际化库，提供多语言支持和灵活的翻译管理
- Vue I18n 11.3.2: Vue集成i18next
- Axios 1.15.0: 作为HTTP客户端，用于API请求

### 已实现页面
- Login.vue: 用户登录页面，已对接后端认证API，支持用户名/密码登录、管理员登录选项、登录状态持久化
- Home.vue: 用户主页面，类似ChatGPT聊天界面，参考g2项目设计
  - 三栏布局：左侧会话列表侧边栏、中间聊天区域、右侧工作空间侧边栏
  - 可折叠的侧边栏设计
  - 响应式CSS变量系统（背景、文本、强调色等）
  - 消息列表和输入组件
  - SSE实时消息流处理
  - Thinking/Reasoning消息块渲染（支持`<tool_call>think`和`<thinking>`标签解析）
  - Markdown渲染支持
  - 已实现OpenCode会话创建和消息发送功能
  - 通过`import.meta.env.VITE_OPENCODE_URL`配置OpenCode服务地址
- Admin.vue: 管理员页面，提供用户管理、日志查看、系统配置功能入口（基础UI框架）

### 已实现组件（frontend/src/components/）
- Sidebar.vue: 左侧边栏组件，包含会话列表、新建会话按钮、设置入口
- WorkspaceSidebar.vue: 右侧工作空间侧边栏组件，预留文件浏览器位置
- ChatInput.vue: 消息输入组件，包含快捷操作、发送按钮、Agent模式下拉选择（BUILD/PLAN），通过`agentModeChange`事件传递选择的agent值

### 状态管理（frontend/src/store/）
- chatStore.ts: 聊天管理（会话列表、当前会话、侧边栏状态）
- messageStore.ts: 消息管理（消息列表、流式消息处理、part增量更新）
- eventStore.ts: SSE事件管理（连接状态、心跳检测、事件分发）
- userStore.ts: 用户状态管理（用户信息、登录状态、加密持久化、角色判断）

### API层（frontend/src/api/）
- events.ts: SSE连接管理（单例模式、自动重连、心跳检测）

### 路由守卫（frontend/src/router/）
- authGuard.ts: 导航守卫（登录检查、角色访问控制、自动跳转）
- index.ts: 路由配置（meta.roles权限定义、全局beforeEach守卫）

### 工具函数（frontend/src/utils/）
- markdownUtils.ts: Markdown渲染（markdown-it集成）
- thinkingParser.ts: Thinking标签解析（支持`<tool_call>think`和`<thinking>`标签，转换为reasoning类型part）

### 类型定义（frontend/src/types/）
- index.ts: 前端本地类型定义（Message, MessagePart, GlobalEvent, EventCallbacks, Session, Model, ConnectionInfo）

### 样式系统（frontend/src/style.css）
- CSS变量定义：背景色(bg-000~400)、文本色(text-100~600)、强调色(accent-brand)、边框色(border-100~300)等
- 安全区域适配（safe-area-inset）
- Markdown样式支持
- 响应式滚动条样式

### 已实现的API接口（apis/opencode/）
基于OpenCode的OpenAPI规范，已生成完整的类型定义和API接口函数：
- **types/common.ts**: 包含所有类型定义（HealthResponse, Config, Session, Message, Part, Provider等）
- **api/request.ts**: 封装的HTTP请求函数，基于fetch实现（含export default对象，Backend用default import解构，Frontend用命名导入）
- 基础函数: `get`, `post`, `put`, `patch`, `del`, `setConfig`, `getBaseURL`
- 模块化API:
  - `globalApi`: 全局健康检查、事件、配置
  - `authApi`: 认证管理
  - `projectApi`: 项目管理
  - `sessionApi`: 会话管理（消息、prompt、fork、share等）
  - `ptyApi`: PTY会话管理
  - `configApi`: 配置管理
  - `permissionApi`: 权限管理
  - `questionApi`: 问答管理
  - `providerApi`: AI提供商管理
  - `fileApi`: 文件操作
  - `findApi`: 搜索功能
  - `mcpApi`: MCP服务管理
  - `toolApi`: 工具管理
  - `worktreeApi`: Worktree管理
  - `resourceApi`: 资源管理
  - `pathApi`: 路径管理
  - `vcsApi`: 版本控制管理
  - `commandApi`: 命令管理
  - `agentApi`: Agent管理
  - `lspApi`: LSP状态管理
  - `formatterApi`: 格式化工具状态管理
  - `eventApi`: 事件订阅
  - `logApi`: 日志写入
  - `partApi`: 消息部分管理

### 扩展API接口（apis/extension/）
- **types/common.ts**: 扩展服务的公共类型定义
  - `PageInfo`: 分页信息
  - `SortInfo`: 排序信息
  - `BaseRequest`: 基础请求接口
  - `BaseResponse`: 基础响应接口
  - `RESPONSE_CODES`: 响应码常量（SUCCESS, INVALID_REQUEST, VALIDATION_ERROR等）
- **types/user.ts**: 用户相关类型定义
  - `Profile`: 用户资料实体（id, user_id, name, email, nickname, avatar, gender, description, department, remark）
  - `User`: 用户实体（id, username, password, role, disabled, profile_id, created, updated）
  - `Token`: 认证令牌实体（token, expires_at）
  - `LoginRequest/LoginResponse`: 登录请求和响应
  - `LogoutResponse`: 登出响应
  - `RefreshTokenRequest/RefreshTokenResponse`: Token刷新请求和响应
  - `RegisterRequest/RegisterResponse`: 注册请求和响应
  - `ProfileRequest/ProfileResponse`: 用户资料请求和响应
  - `UpdateProfileRequest/UpdateProfileResponse`: 更新用户资料请求和响应
- **types/model.ts**: 模型相关类型定义
  - `Options`: 键值对选项（key, value）
  - `Provider`: 提供者实体（id, provider_id, npm?, builtin?, options[]）
  - `Model`: 模型实体（id, model_id, options[]）
  - `ProviderRow/ModelRow/ProviderOptionRow/ModelOptionRow`: DB行类型
  - `GetModelsRequest/GetModelsResponse`: 获取模型列表
  - `AddProviderRequest/AddProviderResponse`: 增加供应商
  - `AddModelRequest/AddModelResponse`: 增加模型
  - `DeleteModelRequest/DeleteModelResponse`: 删除模型
  - `DeleteProviderRequest/DeleteProviderResponse`: 删除供应商
  - `UpdateProviderRequest/UpdateProviderResponse`: 更新供应商
  - `UpdateModelRequest/UpdateModelResponse`: 更新模型
- **types/project.ts**: 项目相关类型定义
  - `Project`: 项目实体（id, user_id, session_id, name, type, description, status, created, updated）
  - `CreateProjectRequest/CreateProjectResponse`: 创建项目
  - `GetProjectsResponse`: 获取项目列表
  - `UpdateProjectRequest/UpdateProjectResponse`: 更新项目
  - `SetProjectStatusRequest/SetProjectStatusResponse`: 设置项目状态
  - `ResetProjectSessionRequest/ResetProjectSessionResponse`: 重置项目Session
- **types/file.ts**: 文件相关类型定义
  - `FileNode`: 文件节点实体（name, type, size, created, updated）
  - `GetFilesRequest/GetFilesResponse`: 获取文件列表
  - `DeleteFileRequest/DeleteFileResponse`: 删除文件
  - `DownloadFileRequest/DownloadFileResponse`: 下载文件
  - `UploadFileRequest/UploadFileResponse`: 上传文件
- **types/log.ts**: 日志相关类型定义
 - `LogEntry`: 日志条目实体（id, user_id, action, target, details, created）
 - `GetLogsRequest/GetLogsResponse`: 获取日志列表（含分页）
- **types/skill.ts**: 技能相关类型定义
 - `Skill`: 技能实体（id, name, description?, path, created）
 - `DownloadSkillRequest/DownloadSkillResponse`: 下载技能
 - `DeleteSkillRequest/DeleteSkillResponse`: 删除技能
 - `UploadSkillResponse`: 上传技能
- **types/system.ts**: 系统相关类型定义
 - `ExecuteScriptRequest`: 执行脚本请求（name, params?）
 - `ExecuteScriptResponse`: 执行脚本响应
- **api/request.ts**: 基于fetch的HTTP请求封装（含export default对象，Backend用default import解构，Frontend用命名导入）
- `RequestConfig`: 请求配置接口
- `setConfig`, `setAuthToken`, `getBaseURL`, `getHeaders`: 配置方法
- `onAuthFailure`: 401/403自动回调（前端用于清除登录状态）
- `get`, `post`, `put`, `patch`, `del`: HTTP方法
- **api/userApi.ts**: 用户API（login, logout, refreshToken, register, getProfile, updateProfile）
- **api/modelApi.ts**: 模型API（getModels, addProvider, addModel, deleteModel, deleteProvider, updateProvider, updateModel）
- **api/projectApi.ts**: 项目API（create, list, update, setStatus, resetSession）
- **api/fileApi.ts**: 文件API（getFiles, delete, download, upload）
- **api/logApi.ts**: 日志API（getLogs）
 - **api/skillApi.ts**: 技能API（download, delete, upload）
 - **api/systemApi.ts**: 系统API（executeScript）


## 后端服务/backend
后端服务提供API接口服务，处理前端请求，访问数据库，管理用户会话和文件操作。

### 技术栈
- Typescript 5.8.3: 作为主要的编程语言
- Fastify 5.8.5: 作为后端框架，提供高性能和丰富的生态系统
- better-sqlite3 12.9.0: 作为数据库驱动，提供轻量级和易于使用的数据库解决方案
- uuid 13.0.0: 作为唯一标识符生成库
- tsx 4.21.0: 作为TypeScript执行和热重载工具

### 功能设计
- 用户认证：提供用户登录、注册、权限验证等功能（已实现User模块）
- 会话管理：管理用户会话状态，支持会话创建、恢复、删除（待实现）
- 文件管理：处理文件上传、下载、删除等操作（待实现）
- 日志记录：记录系统操作日志，支持管理员查询（待实现）
- API服务：提供RESTful API接口供前端调用（已实现健康检查和User接口）

### 已实现功能
- **index.ts**: Fastify服务入口
  - 环境变量加载（从env文件）
  - 集成@fastify/cors跨域支持
  - 基础健康检查接口 `GET /`
  - User模块路由注册
  - 服务启动配置（端口可配置，默认3000）
- **config/schema.ts**: 数据库初始化和表结构创建
  - 用户资料表(profiles)、用户表(users)、令牌表(tokens)
  - 模型提供者表(providers)、模型表(models)
  - 项目表(projects)、日志表(log_entries)
  - 索引优化、初始数据（admin/tester用户）
- **config/index.ts**: 统一导出数据库连接实例
- **middleware/auth.ts**: Token认证中间件
  - Bearer Token验证
  - 文件存储Token（data/tokens.json）
  - Token过期检测
- **modules/user/**: User模块
  - model.ts: 用户数据模型（CRUD操作）
  - handler.ts: 业务处理（登录/注册/登出/资料）
  - routes.ts: Fastify路由定义（含JSON Schema）
- **modules/model/**: Model模块
  - model.ts: 模型数据模型（Provider/Model CRUD + Options管理，含updateProviderBuiltin）
  - handler.ts: 业务处理（获取列表/增删改Provider/增删改Model，支持builtin字段），所有变更操作后调用syncConfigProvider()
 - routes.ts: Fastify路由定义（7路由+JSON Schema+authenticateAdmin）
 - configSync.ts: 配置文件同步（syncConfigProvider: 从DB读取providers/models → 构建config.json的provider字段 → 跳过builtin=1的Provider → 写入opencode配置文件）
- **modules/system/**: System模块
 - handler.ts: 业务处理（执行脚本），白名单限制可执行脚本，当前支持restart_opencode
 - routes.ts: Fastify路由定义（1路由+JSON Schema+authenticateAdmin）
- **modules/project/**: Project模块
  - model.ts: 项目数据模型（CRUD操作）
  - handler.ts: 业务处理（创建/详情/激活/更新/状态/重置会话），含项目信息文件(.PROJECT.md)写入
  - routes.ts: Fastify路由定义（含JSON Schema）
  - hooks.ts: 项目激活钩子（系统提示设置）
- **utils/db.ts**: 数据库连接转发（从config导入）
- **utils/logger.ts**: 简单的日志输出工具

### 数据库设计
- profiles表：存储用户资料信息
  - id: TEXT PRIMARY KEY（UUID）
  - user_id: TEXT NOT NULL
  - name: TEXT NOT NULL
  - email: TEXT
  - nickname: TEXT
  - avatar: TEXT
  - gender: TEXT DEFAULT 'other'
  - description: TEXT
  - department: TEXT
  - remark: TEXT
  - created_at: INTEGER DEFAULT (strftime('%s', 'now'))
  - updated_at: INTEGER DEFAULT (strftime('%s', 'now'))
- users表：存储用户的基本信息
  - id: TEXT PRIMARY KEY（UUID）
  - username: TEXT UNIQUE NOT NULL
  - password: TEXT NOT NULL（SHA256哈希）
  - role: TEXT DEFAULT 'user'
  - disabled: INTEGER DEFAULT 0
  - profile_id: TEXT（外键关联profiles）
  - created_at: INTEGER DEFAULT (strftime('%s', 'now'))
  - updated_at: INTEGER DEFAULT (strftime('%s', 'now'))
- tokens表：存储认证令牌
  - id: TEXT PRIMARY KEY（UUID）
  - user_id: TEXT NOT NULL（外键关联users）
  - token: TEXT NOT NULL
  - expires_at: INTEGER NOT NULL
  - created_at: INTEGER DEFAULT (strftime('%s', 'now'))
- providers表：存储模型提供者
  - id: TEXT PRIMARY KEY（UUID）
  - provider_id: TEXT UNIQUE NOT NULL
  - npm: TEXT DEFAULT NULL（NPM适配器包名）
  - builtin: INTEGER DEFAULT 0（内置标识，1=内置Provider，不提交到OpenCode配置）
  - disabled: INTEGER DEFAULT 0
  - created_at: INTEGER DEFAULT (strftime('%s', 'now'))
  - updated_at: INTEGER DEFAULT (strftime('%s', 'now'))
- provider_options表：存储提供者选项
  - id: TEXT PRIMARY KEY（UUID）
  - provider_id: TEXT NOT NULL（外键关联providers，ON DELETE CASCADE）
  - key: TEXT NOT NULL
  - value: TEXT NOT NULL
  - UNIQUE(provider_id, key)
- models表：存储模型信息
  - id: TEXT PRIMARY KEY（UUID）
  - provider_id: TEXT NOT NULL（外键关联providers，ON DELETE CASCADE）
  - model_id: TEXT NOT NULL
  - disabled: INTEGER DEFAULT 0
  - created_at: INTEGER DEFAULT (strftime('%s', 'now'))
  - updated_at: INTEGER DEFAULT (strftime('%s', 'now'))
  - UNIQUE(provider_id, model_id)
- model_options表：存储模型选项
  - id: TEXT PRIMARY KEY（UUID）
  - model_id: TEXT NOT NULL（外键关联models，ON DELETE CASCADE）
  - key: TEXT NOT NULL
  - value: TEXT NOT NULL
  - UNIQUE(model_id, key)
- projects表：存储用户的项目信息
  - id: TEXT PRIMARY KEY（UUID）
  - user_id: TEXT NOT NULL（外键关联users）
  - session_id: TEXT
  - name: TEXT NOT NULL
  - type: TEXT NOT NULL
  - description: TEXT
  - status: TEXT DEFAULT 'active'
  - created_at: INTEGER DEFAULT (strftime('%s', 'now'))
  - updated_at: INTEGER DEFAULT (strftime('%s', 'now'))
- log_entries表：存储系统的日志信息
  - id: TEXT PRIMARY KEY（UUID）
  - user_id: TEXT（外键关联users）
  - action: TEXT NOT NULL
  - target: TEXT
  - details: TEXT
  - created_at: INTEGER DEFAULT (strftime('%s', 'now'))

# 目录结构
```
├── AGENTS.md # 工程设计文档
├── README.md # 使用说明
├── MEMORY.md # 开发过程记录
├── .gitignore # Git忽略配置
├── .env # 环境变量配置
├── spec/ # 接口设计文档
│   └── extension_api.md # 扩展API接口规则和设计
├── apis/ # API接口定义
│   ├── opencode/ # OpenCode API接口
│   │   ├── api/ # API请求函数
│   │   │   ├── index.ts # 导出文件
│   │   │   └── request.ts # 封装的HTTP请求函数
│   │   ├── types/ # 类型定义
│   │   │   ├── index.ts # 导出文件
│   │   │   └── common.ts # 公共类型定义
│   │   ├── openapi_doc.json # OpenAPI规范文档
│   │   └── openapi_formatted.json # 格式化的OpenAPI文档
│   └── extension/ # AppGenius扩展API接口
│       ├── api/ # API请求函数
│       │   ├── index.ts # 导出文件
│       │   ├── request.ts # 基于fetch的HTTP请求封装
│ │ ├── userApi.ts # 用户API
│ │ ├── modelApi.ts # 模型API
│ │ ├── projectApi.ts # 项目API
│ │ ├── fileApi.ts # 文件API
│ │ ├── logApi.ts # 日志API
│ │ ├── skillApi.ts # 技能API
│ │ └── systemApi.ts # 系统API
│       └── types/ # 类型定义
│           ├── index.ts # 导出文件
│           ├── common.ts # 公共类型定义
│           ├── user.ts # 用户相关类型
│           ├── model.ts # 模型相关类型
│           ├── project.ts # 项目相关类型
│ ├── file.ts # 文件相关类型
│ ├── log.ts # 日志相关类型
│ ├── skill.ts # 技能相关类型
│ └── system.ts # 系统相关类型
├── backend/ # 后端服务
│   ├── data/ # 数据文件目录（数据库、tokens.json）
│   ├── src/
│   │   ├── apis -> ../../apis # API接口文件（符号链接）
│   │   ├── config/ # 配置模块
│   │   │   ├── index.ts # 导出数据库连接
│   │   │   └── schema.ts # 数据库Schema定义和初始化
│   │   ├── middleware/ # 中间件
│   │   │   └── auth.ts # Token认证中间件
│ │ ├── modules/ # 业务模块
│ │ │ ├── user/ # User模块
│ │ │ │ ├── model.ts # 用户数据模型
│ │ │ │ ├── handler.ts # 业务处理
│ │ │ │ └── routes.ts # 路由定义
│ │ │ └── model/ # Model模块
│ │ │ ├── model.ts # 模型数据模型
│ │ │ ├── handler.ts # 业务处理
│ │ │ ├── routes.ts # 路由定义
│ │ │ └── configSync.ts # 配置文件同步
│ │ │ └── system/ # System模块
│ │ │ ├── handler.ts # 业务处理
│ │ │ └── routes.ts # 路由定义
│   │   └── utils/ # 工具函数
│   │       ├── db.ts # 数据库连接转发
│   │       └── logger.ts # 日志工具
│   ├── dist/ # 编译输出目录
│   ├── node_modules/ # 依赖包
│   ├── env -> ../env # 环境变量配置（符号链接）
│   ├── index.ts # 后端入口文件
│   ├── package.json # 依赖配置文件
│   └── tsconfig.json # TypeScript配置文件
├── frontend/ # 前端服务
│   ├── public/ # 公共资源文件
│   ├── src/
│   │   ├── apis -> ../../apis # API接口文件（符号链接）
│   │   ├── api/ # API层
│   │   │   └── events.ts # SSE连接管理
│   │   ├── assets/ # 静态资源文件
│   │   ├── config/ # 配置文件（预留）
│   │   ├── locales/ # 国际化文件
│   │   ├── router/ # 路由文件
│   │   │   ├── index.ts # 路由配置
│   │   │   └── authGuard.ts # 导航守卫
│   │   ├── store/ # 状态管理文件
│   │   │   ├── chatStore.ts # 聊天管理
│   │   │   ├── messageStore.ts # 消息管理
│   │   │   ├── eventStore.ts # SSE事件管理
│   │   │   └── userStore.ts # 用户状态管理
│   │   ├── types/ # 类型定义
│   │   │   └── index.ts # 前端本地类型定义
│   │   ├── utils/ # 工具函数文件
│   │   │   ├── markdownUtils.ts # Markdown渲染
│   │   │   └── thinkingParser.ts # Thinking标签解析
│   │   ├── views/ # 页面视图文件
│   │   │   ├── components/ # 组件文件
│   │   │   │   ├── Sidebar.vue # 左侧边栏
│   │   │   │   ├── WorkspaceSidebar.vue # 右侧工作空间侧边栏
│   │   │   │   └── ChatInput.vue # 消息输入组件
│   │   │   ├── Login.vue # 登录页面
│   │   │   ├── Home.vue # 主页面（ChatGPT风格）
│   │   │   └── Admin.vue # 管理页面
│   │   ├── main.ts # 前端入口文件
│   │   ├── App.vue # 根组件
│   │   ├── style.css # 全局样式文件
│   │   └── vite-env.d.ts # Vite环境变量类型声明
│   ├── dist/ # 构建输出目录
│   ├── node_modules/ # 依赖包
│   ├── env -> ../env # 环境变量配置（符号链接）
│   ├── index.html # 入口HTML文件
│   ├── package.json # 依赖配置文件
│   ├── tsconfig.json # TypeScript配置文件
│   ├── tsconfig.node.json # Node TypeScript配置
│   └── vite.config.ts # Vite配置文件
```

# Agents需求
- 在工程实现过程中，Agents需要丰富和更新设计和实现细节，包括功能介绍、技术栈、目录结构等信息，根据设计和实现的需求，进行功能设计、数据库设计、API设计等工作，确保设计和实现的合理性和可行性。
- 在工程实现过程中，Agents需要将更新和丰富此文档，以确保工程信息的完整性和准确性。
- 在工程实现过程中，Agents需要与开发人员进行沟通和协作，确保设计和实现的正确性和一致性，将过程中遇到的设计和实现问题进行记录和总结，并记录在MEMORY.md中，供后续参考和改进。
- 接口设计文档位于 `spec/extension_api.md`，新增模块的接口设计应先在该文档中描述，再生成类型定义和API实现