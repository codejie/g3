# Extension API 接口规则描述
- 文档描述了*backend*应用提供的扩展/extension API接口的设计原则和规范，以及接口的请求和响应格式
- API接口采用HTTP协议，使用RESTful风格设计
- 所有接口都使用POST请求，数据格式为JSON
- 接口的请求基于**BaseRequest**，响应基于**BaseResponse**, 结构定义在 `apis/extension/types/common.ts` 中
- **BaseRequest** 包含公共请求字段，如请求ID，如果Request没有被描述为包含特定请求字段，则默认为 `BaseRequest`，表示没有特定请求字段要求
- **BaseResponse** 包含公共响应字段，如响应码、消息和结果数据， 响应码定义在 `RESPONSE_CODES` 常量中，结果数据统一放置在data字段中，使用是通过泛型定义，如 `BaseResponse<T>`，以适应不同接口的响应数据结构，结果数据一般单独定义为一个类型，如`LoginResult`, 此时`LoginResponse` 可以定义为 `BaseResponse<LoginResult>`，确保接口响应的一致性和类型安全, 以及便于维护，也就是接口报文接口定义中采用定义结果数据类型，生成时推导相应Response的方式，如果Response没有被描述结果数据类型，则默认为 `BaseResponse<void>`，表示没有结果数据返回
- Request或Response中包含分页、排序等通用功能时，相关字段也会包含在BaseRequest或BaseResponse中，并采用common.ts中定义的类型，如PageInfo、SortInfo等, 字段名称为page_info、sort_info等
- Request或Response中如果包含单个模块信息时，相关字段名称为item, 如果包含多个模块信息时，相关字段名称为items
- 接口按照模块划分生成在不同的文件中，如user.ts、session.ts等，位于 `apis/extension/types` 目录下
- 接口设计中包括是模块类型描述和接口报文结构定义，模块类型描述将作为参考用于数据库表设计，接口报文结构定义将作为前后端对接的规范
- 接口设计描述中存在不足情况时，请求补充完善，确保接口设计的完整性和可用性

# 接口安全性设计
- 所有接口都需要进行身份验证，要求请求中必须包含有效的认证令牌（如JWT），否则返回未授权错误
- 认证令牌应在用户登录成功后生成，并包含必要的用户信息和权限信息，以便后续接口调用进行权限验证
- 接口应根据用户角色和权限进行访问控制，确保用户只能访问其有权限的资源和操作， 用户身份/ID通过Token在接口中获取，接口设计中不直接传递用户ID等敏感信息
- 接口中除特殊说明外，ID类字段应使用UUID格式

# user模块接口设计
描述了用户相关接口的设计，包括登录、登出、注册、获取和更新用户资料等功能
## 模块类型描述
- **Profile**: 用户资料实体，包含以下字段：
  - id: 用户资料ID，唯一标识符
  - user_id: 用户ID，唯一标识符
  - name: 用户姓名，字符串类型
  - email?: 用户邮箱，字符串类型
  - nickname?: 用户昵称，字符串类型
  - avatar?: 用户头像，字符串类型（URL）
  - gender?: 用户性别，字符串类型（如male、female、other等）,default为other
  - description?: 用户描述信息，字符串类型
  - department?: 用户所属部门，字符串类型
  - remark?: 用户备注信息，字符串类型
  
- **User**: 用户实体，用于登录，包含以下字段：
  - id: 用户ID，唯一标识符
  - username: 用户名，字符串类型
  - password: 用户密码，字符串类型（实际存储时应加密处理）
  - role: 用户角色，字符串类型（如admin、user等）,default为user
  - disabled: 用户是否禁用，int类型（0表示启用，1表示禁用）,default为0
  - profile_id: 用户资料ID，关联Profile实体
  - created: 用户创建时间，日期时间类型, 当前时间戳
  - updated: 用户更新时间，日期时间类型，初始为当前时间戳，更新时修改为当前时间戳

- **Token**: 认证令牌实体，包含以下字段：
  - token: 令牌字符串
  - expires_at: 令牌过期时间，日期时间类型

## 接口报文结构定义 
### Login接口
- **接口描述**: 用户登录接口，验证用户凭证并返回认证令牌
- **请求结构**:
```typescript
interface LoginRequest extends BaseRequest {
  username: string; // 用户名
  password: string; // 密码
  role?: string; // 可选，用户角色（如admin、user等）,默认为user
}
```
- **响应结果数据**:
```typescript
interface LoginResult {
  token: Token; // 认证令牌
  profile: Profile;
  permissions?: string[]; // 用户权限列表,可选,保留字段
}
```

### Logout接口
- **接口描述**: 用户登出接口，清除用户认证状态
- **请求结构**: 无请求数据，使用 `BaseRequest` 即可

- **响应结果数据**: 无结果数据返回，使用 `BaseResponse<void>`

### Token刷新接口
- **接口描述**: 刷新认证令牌接口，验证当前令牌并返回新的认证令牌
- **请求结构**: 无请求数据，使用 `BaseRequest` 即可
- **响应结果数据**:
```typescript
interface RefreshTokenResult {
  token: Token; // 新的认证令牌
}
```

### Register接口
- **接口描述**: 用户注册接口，创建新用户, 暂不支持创建admin用户
- **请求结构**:
```typescript
interface RegisterRequest extends BaseRequest {
  username: string; // 用户名
  password: string; // 密码
  role?: string; // 可选，用户角色（如admin、user等）,默认为user
}
```
- **响应结果数据**:
```typescript
interface RegisterResult {
  id: string; // 新用户ID
}
```

### Profile接口
- **接口描述**: 获取用户资料接口，返回用户的详细信息
- **请求结构**: 
```typescript
interface ProfileRequest extends BaseRequest {
  id: string; // 用户Profile ID
}
```
- **响应结果数据**:
```typescript
interface ProfileResult {
  profile: Profile; // 用户资料信息
}
```

### 更新Profile接口
- **接口描述**: 更新用户资料接口，修改用户的详细信息
- **请求结构**:
```typescript
interface UpdateProfileRequest extends BaseRequest {
  name?: string; // 可选，用户姓名
  email?: string; // 可选，用户邮箱
  nickname?: string; // 可选，用户昵称
  avatar?: string; // 可选，用户头像URL
  gender?: string; // 可选，用户性别
  description?: string; // 可选，用户描述信息
  department?: string; // 可选，用户所属部门
  remark?: string; // 可选，用户备注信息
}```
- **响应结果数据**: 
```typescript
interface UpdateProfileResult {
  id: string; // 更新后的Profile ID
}
```

### 删除user接口
- **接口描述**: 删除用户接口，允许管理员删除指定用户,删除用户时会同时删除关联的Profile信息
- **请求结构**:
```typescript
interface DeleteUserRequest extends BaseRequest {
  id: string; // 用户ID
}
```
- **响应结果数据**: 无结果数据返回，使用 `BaseResponse<void>`


### 改密user接口
- **接口描述**: 修改用户密码接口，允许admin修改user的密码
- **请求结构**:
```typescript
interface ChangePasswordRequest extends BaseRequest {
  id: string; // 用户ID
  new_password: string; // 新密码
}
```
- **响应结果数据**: 无结果数据返回，使用 `BaseResponse<void>`


# 模型/Model接口设计
描述了模型的Provider和Model相关接口的设计
## 模块类型描述

- **Model**: 模型实体，包含以下字段：
  - id: 模型ID，唯一标识符
  - provider_id: 模型提供者ID，关联Provider实体
  - model_id: 模型ID，字符串类型，如gpt-3.5-turbo、gpt-4等
  - disabled: 模型是否禁用，int类型（0表示启用，1表示禁用）,default为0
  - created: 模型创建时间，日期时间类型
  - updated: 模型更新时间，日期时间类型

- **Model_Options**: 模型选项实体，包含以下字段：
  - id: 模型选项ID，唯一标识符
  - model_id: 模型ID，关联Model实体
  - key: 模型选项键，字符串类型，如name, context_size, description, temperature, top_p等
  - value: 模型选项值，字符串类型

- **Provider**: 模型提供者实体，包含以下字段：
  - id: 提供者ID，唯一标识符
  - provider_id: 提供者ID，字符串类型，如openai、azure、anthropic等
  - npm: 提供者npm包名，字符串类型，如openai、azure、anthropic等, default is NULL
  - disabled: 提供者是否禁用，int类型（0表示启用，1表示禁用）,default为0
  - created: 提供者创建时间，日期时间类型
  - updated: 提供者更新时间，日期时间类型

- **Provider_Options**: 模型提供者选项实体，包含以下字段：
  - id: 提供者选项ID，唯一标识符
  - provider_id: 提供者ID，关联Provider实体
  - key: 提供者选项键，字符串类型，如name, api_key, endpoint_url, region等
  - value: 提供者选项值，字符串类型 

## 接口报文结构定义

### 获取供应商和模型列表接口
- **请求结构**:
```typescript
interface GetModelsRequest extends BaseRequest {
  provider_id?: string; // 可选，模型提供者ID，过滤条件
}
```
- **响应结果数据**:
```typescript
interface Options {
  key: string; // 选项键，如name, context_size, description, temperature, top_p等
  value: string; // 选项值
}

interface Provider {
  id: string; // 提供者ID
  provider_id: string; // 提供者ID字符串，如openai、azure、anthropic等
  npm?: string; // 提供者npm包名，如openai、azure、anthropic等, default is NULL
  options: Options[]; // 提供者选项列表，如name, api_key, endpoint_url, region等
}

interface Model {
  id: string; // 模型ID
  model_id: string; // 模型ID字符串，如gpt-3.5-turbo、gpt-4等
  options: Options[]; // 模型选项列表，如name, context_size, description, temperature, top_p等
}

interface GetModelsResult {
  items: {
    provider: Provider; // 模型提供者信息
    models: Model[]; // 模型信息
   }[]; // 模型列表，包含提供者和模型信息
  }
```

### 增加供应商接口
- **请求结构**:
```typescript
interface AddProviderRequest extends BaseRequest {
  id: string; // 提供者ID/privider_id字符串，如openai、azure、anthropic等
  npm?: string; // 提供者npm包名，如openai、azure、anthropic等, default is NULL
  options: Options[]; // 提供者选项列表，如name, api_key, endpoint_url, region等
}
```
- **响应结果数据**:
```typescript
interface AddModelResult {
  id: string; // 新增的模型提供者/供应商ID
}
```

### 增加模型接口
- **请求结构**:
```typescript
interface AddModelRequest extends BaseRequest {
  provider_id: string; // 模型提供者ID
  id: string; // 模型ID字符串，如gpt-3.5-turbo、gpt-4等
  options: Options[]; // 模型选项列表，如name, context_size, description, temperature, top_p等
}
```
- **响应结果数据**:
```typescript
interface AddModelResult {
  id: string; // 新增的模型ID
  provider_id: string; // 新增的模型提供者ID
}
```
### 删除模型接口
- **请求结构**:
```typescript
interface DeleteModelRequest extends BaseRequest {
  id: string; // 模型ID
  provider_id: string; // 模型提供者ID
}
```
- **响应结果数据**:
```typescript
interface DeleteModelResult {
  id: string; // 删除的模型ID
  provider_id: string; // 删除的模型提供者ID
}
```

### 删除供应商接口
- **请求结构**:
```typescript
interface DeleteProviderRequest extends BaseRequest {
  id: string; // 模型提供者ID
}
```
- **响应结果数据**: 无结果数据返回，使用 `BaseResponse<void>`

### 更新供应商接口
- **请求结构**:
```typescript
interface UpdateProviderRequest extends BaseRequest {
  id: string; // 模型提供者ID
  options?: Options[]; // 可选，提供者选项列表，如name, api_key, endpoint_url, region等
}
```
- **响应结果数据**:
```typescript
interface UpdateProviderResult {
  id: string; // 更新的模型提供者ID
}
```

### 更新模型接口
- **请求结构**:
```typescript
interface UpdateModelRequest extends BaseRequest {
  id: string; // 模型ID
  provider_id: string; // 模型提供者ID
  options?: Options[]; // 可选，模型选项列表，如name, context_size, description, temperature, top_p等
}
```
- **响应结果数据**:
```typescript
interface UpdateModelResult {
  id: string; // 更新的模型ID
  provider_id: string; // 更新的模型提供者ID
}
```

# 项目/Project接口设计
描述了项目相关接口的设计，包括创建项目、获取项目列表、更新项目和删除项目等功能
## 模块类型描述
- **Project**: 项目实体，包含以下字段：
  - id: 项目ID，唯一标识符
  - user_id: 用户ID，关联User实体
  - session_id: 会话ID，关联OpenCode Session信息
  - name: 项目名称，字符串类型
  - type: 项目类型，字符串类型, 'public|private'等
  - description?: 项目描述信息，字符串类型
  - status: 项目状态，字符串类型, 'active|deleted|archived'等,default为active
  - created: 项目创建时间，日期时间类型
  - updated: 项目更新时间，日期时间类型

## 接口报文结构定义
### 创建项目接口
- **接口描述**: 创建新项目接口，允许用户创建一个新的项目
- **请求结构**:
```typescript
interface CreateProjectRequest extends BaseRequest {
  name?: string; // 项目名称, 可选，如果不提供则默认命名为"New Project"
  type: string; // 项目类型，如public、private等
  description?: string; // 可选，项目描述信息
} 
```
- **响应结果数据**:
```typescript
interface CreateProjectResult {
  id: string; // 新项目ID
  // session_id: string; // 关联的OpenCode Session ID
}
```

### 获取项目列表接口
- **接口描述**: 获取用户的项目列表接口，返回用户创建的所有项目
- **请求结构**: 无请求数据，使用 `BaseRequest` 即可，通过token识别用户身份, 获取用户ID并返回该用户的项目列表
- **响应结果数据**:
```typescript
interface GetProjectsResult {
  items: Project[]; // 项目列表
}
```

### 获取项目详情接口
- **接口描述**: 获取项目详情接口，允许用户获取指定项目的详细信息
- **请求结构**:
```typescript
interface GetProjectDetailRequest extends BaseRequest {
  id: string; // 项目ID
}
```
- **响应结果数据**:
```typescript
interface GetProjectDetailResult {
  item: Project; // 项目详细信息
  directory: string; // 项目目录路径，格式为"{user_id}/{project_id}/"，用于opencode的会话中目录指示
}

```

### 激活项目接口
- **接口描述**: 激活项目接口，用户激活一个项目作为当前工作项目，返回项目信息
- **请求结构**:
```typescript
interface ActivateProjectRequest extends BaseRequest {
  id: string; // 项目ID
}
```
- **响应结果数据**:
```typescript
interface ActivateProjectResult {
  item: Project; // 项目信息
  directory: string; // 项目目录路径，格式为"{user_id}/{project_id}/"，用于opencode的会话中目录指示
}
```


### 更新项目接口
- **接口描述**: 更新项目接口，允许用户修改项目的名称、类型和描述信息
- **请求结构**:
```typescript
interface UpdateProjectRequest extends BaseRequest {
  id: string; // 项目ID
  name?: string; // 可选，项目名称
  type?: string; // 可选，项目类型
  description?: string; // 可选，项目描述信息
}
```
- **响应结果数据**:
```typescript
interface UpdateProjectResult {
  id: string; // 更新的项目ID
}
```

### 设置项目状态接口
- **接口描述**: 设置项目状态接口，允许用户修改项目的状态，如标记为已归档或删除等
- **请求结构**:
```typescript
interface SetProjectStatusRequest extends BaseRequest {
  id: string; // 项目ID
  status: string; // 项目状态，如active、deleted、archived等
}
```
- **响应结果数据**:
```typescriptinterface SetProjectStatusResult {
  id: string; // 更新的项目ID
}
```

### 重置项目Session接口
- **接口描述**: 重置项目Session接口，允许用户重置项目关联的OpenCode Session信息，清除会话历史记录等
- **请求结构**:
```typescript
interface ResetProjectSessionRequest extends BaseRequest {
  id: string; // 项目ID
}
```
- **响应结果数据**:
```typescript
interface ResetProjectSessionResult {
  id: string; // 更新的项目ID
  session_id: string; // 新的OpenCode Session ID
}
```

# 文件/File接口设计
描述了文件相关接口的设计，包括上传文件、获取文件列表、下载文件和删除文件等功能

## 模块类型描述
- 无需创建数据库表，文件信息通过获取项目目录下的文件列表返回
### 文件信息类型定义
- **FileNode**: 文件节点实体，包含以下字段：
  - name: 文件名称，字符串类型
  - type: 文件类型，字符串类型（如file、directory等）
  - size: 文件大小，数字类型（单位字节）
  - created: 文件创建时间，日期时间类型
  - updated: 文件更新时间，日期时间类型

## 接口报文结构定义
### 获取文件列表接口
- **接口描述**: 获取项目目录下的文件列表接口，返回项目目录结构和文件信息
- **请求结构**: 
```typescript
interface GetFilesRequest extends BaseRequest {
  project_id: string; // 项目ID
  path?: string; // 可选，目录路径，默认为根目录
}
```
- **响应结果数据**:
```typescript
interface GetFilesResult {
  items: FileNode[]; // 文件列表，包含文件和目录信息
}
```
### 删除文件接口 (忽略)
- **接口描述**: 删除文件接口，允许用户删除项目目录下的指定文件
- **请求结构**:
```typescript
interface DeleteFileRequest extends BaseRequest {
  project_id: string; // 项目ID
  path: string; // 文件路径
}
```
- **响应结果数据**: 无响应数据返回，使用 `BaseResponse<void>`

### 下载文件接口
- **接口描述**: 下载文件接口，允许用户下载项目目录下的指定文件，如果文件是目录则需要打包成zip文件下载
- **请求结构**:
```typescript
interface DownloadFileRequest extends BaseRequest {
  project_id: string; // 项目ID
  path: string; // 文件路径
}
```
- **响应结果数据**: 无响应数据返回，使用 `BaseResponse<void>`

### 上传文件接口
- **接口描述**: 上传文件接口，允许用户上传文件到项目目录下，上传文件类型只能是'file'，不支持上传目录
- **请求结构**:
```typescript
interface UploadFileRequest extends BaseRequest {
  project_id: string; // 项目ID
  path: string; // 文件路径
  file: File; // 文件对象
}
```

### 下载opencode配置文件接口
- **接口描述**: 下载opencode配置文件接口，允许用户下载项目目录下的opencode配置文件，如`opencode.json`，如果文件不存在则返回默认配置内容
- **请求结构**:
```typescript
interface DownloadOpencodeConfigRequest extends BaseRequest {
  name: string; // 配置文件名称，默认为opencode.json
}
```
- **响应结果数据**: 无响应数据返回，使用 `BaseResponse<void>`

### 上传opencode配置文件接口
- **接口描述**: 上传opencode配置文件接口，允许用户上传项目目录下的opencode配置文件，如`opencode.json`，上传时会覆盖原有配置文件
- **请求结构**:
```typescript
interface UploadOpencodeConfigRequest extends BaseRequest {
  name: string; // 配置文件名称，默认为opencode.json
  file: File; // 文件对象
}
```
- **响应结果数据**: 无响应数据返回，使用 `BaseResponse<void>`



- **响应结果数据**: 无响应数据返回，使用 `BaseResponse<void>`

# Logs接口设计
描述了日志相关接口的设计，包括获取日志列表和清除日志等功能
## 模块类型描述
- **LogEntry**: 日志条目实体，包含以下字段：
  - id: 日志ID，唯一标识符
  - user_id: 用户ID，关联User实体
  - action: 日志操作类型，字符串类型（如login、logout、create_project、download_file等）
  - target: 日志操作目标，字符串类型（如project_id、file_path等）
  - details?: 日志详情信息，字符串类型（可选）
  - created: 日志创建时间，日期时间类型

## 接口报文结构定义
### 获取日志列表接口
- **接口描述**: 获取日志列表接口，返回用户的操作日志记录
- **请求结构**:
```typescript
interface GetLogsRequest extends BaseRequest {
  user_id?: string; // 可选，用户ID，过滤条件
  action?: string; // 可选，日志操作类型，过滤条件
  target?: string; // 可选，日志操作目标，过滤条件
  page_info?: PageInfo; // 可选，分页信息
}
```
- **响应结果数据**:
```typescript
interface GetLogsResult {
  items: LogEntry[]; // 日志条目列表
  page_info: PageInfo; // 分页信息
}
```

# Skills接口设计
描述了技能相关接口的设计，包括获取技能列表和执行技能等功能
## 模块类型描述
- **Skill**: 技能实体，包含以下字段：
  - id: 技能ID，唯一标识符
  - name: 技能名称，字符串类型
  - description?: 技能描述信息，字符串类型（可选）
  - path: 技能文件路径，字符串类型
  - created: 技能创建时间，日期时间类型

## 接口报文结构定义
### 下载技能接口
- **接口描述**: 下载技能接口，允许用户下载指定技能文件
- **请求结构**:
```typescript
interface DownloadSkillRequest extends BaseRequest {
  name: string; // 技能名称
}
```
- **响应结果数据**: 无响应数据返回，使用 `BaseResponse<void>`

### 上传技能接口
- **接口描述**: 上传技能接口，允许用户上传技能文件
- **请求结构**: 无请求数据，使用 `BaseRequest<void>`，上传文件
- **响应结果数据**: 无响应数据返回，使用 `BaseResponse<void>`

### 删除技能接口
- **接口描述**: 删除技能接口
- **请求结构**:
```typescript
interface DeleteSkillRequest extends BaseRequest {
  name: string; // 技能名称
}
```
- **响应结果数据**: 无响应数据返回，使用 `BaseResponse<void>`

# System接口设计
描述了系统相关接口的设计，包括获取系统状态和配置等功能
## 接口报文结构定义
### 执行脚本接口
- **接口描述**: 执行脚本接口，允许用户执行指定的系统脚本，如系统健康检查、环境信息获取等
- **请求结构**:
```typescript 
interface ExecuteScriptRequest extends BaseRequest {
  name: string; // 脚本名称，如health_check、env_info等
  params?: Record<string, any>; // 可选，脚本参数
}
``` 
- **响应结果数据**: 无响应数据返回，使用 `BaseResponse<void>`
