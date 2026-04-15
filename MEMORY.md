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

### 下一步计划
- 实现用户认证API
- 完善前端页面功能
- 添加API路由
- 实现会话管理
- 添加日志系统
