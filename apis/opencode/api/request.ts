import type {
  HealthResponse,
  Config,
  Auth,
  Project,
  Session,
  SessionStatus,
  Message,
  AssistantMessage,
  Part,
  Ptysession,
  Provider,
  PermissionRequest,
  QuestionRequest,
  QuestionAnswer,
  Todo,
  FileNode,
  FileContent,
  File,
  VcsInfo,
  Path,
  Agent,
  Command,
  Symbol,
  McpResource,
  MCPStatus,
  LSPStatus,
  FormatterStatus,
  GlobalEvent,
  PromptInput,
  CreatePtyInput,
  UpdatePtyInput,
  WorktreeCreateInput,
  WorktreeRemoveInput,
  WorktreeResetInput,
  FileDiff,
} from '../types'

export interface RequestConfig {
  baseURL: string
  headers?: Record<string, string>
}

export type RequestParams = Record<string, string | number | boolean | undefined>

const defaultConfig: RequestConfig = {
  baseURL: '',
  headers: {
    'Content-Type': 'application/json',
  },
}

export function setConfig(config: Partial<RequestConfig>) {
  Object.assign(defaultConfig, config)
}

export function getBaseURL(): string {
  return defaultConfig.baseURL
}

async function request<T>(
  method: string,
  path: string,
  params?: RequestParams,
  body?: unknown
): Promise<T> {
  const url = new URL(path, defaultConfig.baseURL)
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.append(key, String(value))
      }
    })
  }

  const response = await fetch(url.toString(), {
    method,
    headers: defaultConfig.headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }))
    throw new Error(error.message || `HTTP ${response.status}`)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json()
}

export async function get<T>(path: string, params?: RequestParams): Promise<T> {
  return request<T>('GET', path, params)
}

export async function post<T>(path: string, body?: unknown, params?: RequestParams): Promise<T> {
  return request<T>('POST', path, params, body)
}

export async function put<T>(path: string, body?: unknown, params?: RequestParams): Promise<T> {
  return request<T>('PUT', path, params, body)
}

export async function patch<T>(path: string, body?: unknown, params?: RequestParams): Promise<T> {
  return request<T>('PATCH', path, params, body)
}

export async function del<T>(path: string, params?: RequestParams): Promise<T> {
  return request<T>('DELETE', path, params)
}

export const globalApi = {
  health: () => get<HealthResponse>('/global/health'),
  event: () => get<GlobalEvent>('/global/event'),
  getConfig: () => get<Config>('/global/config'),
  updateConfig: (config: Config) => patch<Config>('/global/config', config),
  dispose: () => post<boolean>('/global/dispose'),
}

export const authApi = {
  set: (providerID: string, auth: Auth) => put<boolean>(`/auth/${providerID}`, auth),
  remove: (providerID: string) => del<boolean>(`/auth/${providerID}`),
}

export const projectApi = {
  list: (directory?: string) => get<Project[]>('/project', { directory }),
  current: (directory?: string) => get<Project>('/project/current', { directory }),
  update: (projectID: string, data: Partial<Project>, directory?: string) =>
    patch<Project>(`/project/${projectID}`, data, { directory }),
}

export const sessionApi = {
  list: (params?: { directory?: string; roots?: boolean; start?: number; search?: string; limit?: number }) =>
    get<Session[]>('/session', params as RequestParams),
  create: (data: { parentID?: string; title?: string; permission?: PermissionRequest }, directory?: string) =>
    post<Session>('/session', data, { directory }),
  status: (directory?: string) => get<Record<string, SessionStatus>>('/session/status', { directory }),
  get: (sessionID: string, directory?: string) => get<Session>(`/session/${sessionID}`, { directory }),
  delete: (sessionID: string, directory?: string) => del<boolean>(`/session/${sessionID}`, { directory }),
  update: (sessionID: string, data: { title?: string; time?: { archived?: number } }, directory?: string) =>
    patch<Session>(`/session/${sessionID}`, data, { directory }),
  children: (sessionID: string, directory?: string) => get<Session[]>(`/session/${sessionID}/children`, { directory }),
  todo: (sessionID: string, directory?: string) => get<Todo[]>(`/session/${sessionID}/todo`, { directory }),
  init: (sessionID: string, data: { modelID: string; providerID: string; messageID: string }, directory?: string) =>
    post<boolean>(`/session/${sessionID}/init`, data, { directory }),
  fork: (sessionID: string, data: { messageID: string }, directory?: string) =>
    post<Session>(`/session/${sessionID}/fork`, data, { directory }),
  abort: (sessionID: string, directory?: string) => post<boolean>(`/session/${sessionID}/abort`, undefined, { directory }),
  share: (sessionID: string, directory?: string) => post<Session>(`/session/${sessionID}/share`, undefined, { directory }),
  unshare: (sessionID: string, directory?: string) => del<Session>(`/session/${sessionID}/share`, { directory }),
  diff: (sessionID: string, params?: { messageID?: string }, directory?: string) =>
    get<FileDiff[]>(`/session/${sessionID}/diff`, { ...params, directory }),
  summarize: (sessionID: string, data: { providerID: string; modelID: string; auto?: boolean }, directory?: string) =>
    post<boolean>(`/session/${sessionID}/summarize`, data, { directory }),
  messages: (sessionID: string, params?: { limit?: number }, directory?: string) =>
    get<{ info: Message; parts: Part[] }[]>(`/session/${sessionID}/message`, { ...params, directory }),
  message: (sessionID: string, messageID: string, directory?: string) =>
    get<{ info: Message; parts: Part[] }>(`/session/${sessionID}/message/${messageID}`, { directory }),
  prompt: (sessionID: string, input: PromptInput, directory?: string) =>
    post<{ info: AssistantMessage; parts: Part[] }>(`/session/${sessionID}/message`, input, { directory }),
  promptAsync: (sessionID: string, input: PromptInput, directory?: string) =>
    post<void>(`/session/${sessionID}/prompt_async`, input, { directory }),
  command: (sessionID: string, data: { arguments: string; command: string; messageID?: string; agent?: string; model?: string }, directory?: string) =>
    post<{ info: AssistantMessage; parts: Part[] }>(`/session/${sessionID}/command`, data, { directory }),
  shell: (sessionID: string, data: { agent: string; command: string; model?: { providerID: string; modelID: string } }, directory?: string) =>
    post<AssistantMessage>(`/session/${sessionID}/shell`, data, { directory }),
  revert: (sessionID: string, data: { messageID: string; partID?: string }, directory?: string) =>
    post<Session>(`/session/${sessionID}/revert`, data, { directory }),
  unrevert: (sessionID: string, directory?: string) =>
    post<Session>(`/session/${sessionID}/unrevert`, undefined, { directory }),
}

export const partApi = {
  delete: (sessionID: string, messageID: string, partID: string, directory?: string) =>
    del<boolean>(`/session/${sessionID}/message/${messageID}/part/${partID}`, { directory }),
  update: (sessionID: string, messageID: string, partID: string, part: Part, directory?: string) =>
    patch<Part>(`/session/${sessionID}/message/${messageID}/part/${partID}`, part, { directory }),
}

export const ptyApi = {
  list: (directory?: string) => get<Ptysession[]>('/pty', { directory }),
  create: (data: CreatePtyInput, directory?: string) => post<Ptysession>('/pty', data, { directory }),
  get: (ptyID: string, directory?: string) => get<Ptysession>(`/pty/${ptyID}`, { directory }),
  update: (ptyID: string, data: UpdatePtyInput, directory?: string) =>
    put<Ptysession>(`/pty/${ptyID}`, data, { directory }),
  remove: (ptyID: string, directory?: string) => del<boolean>(`/pty/${ptyID}`, { directory }),
  connect: (ptyID: string, directory?: string) => get<boolean>(`/pty/${ptyID}/connect`, { directory }),
}

export const configApi = {
  get: (directory?: string) => get<Config>('/config', { directory }),
  update: (config: Config, directory?: string) => patch<Config>('/config', config, { directory }),
  providers: (directory?: string) =>
    get<{ providers: Provider[]; default: Record<string, string> }>('/config/providers', { directory }),
}

export const permissionApi = {
  list: (directory?: string) => get<PermissionRequest[]>('/permission', { directory }),
  reply: (requestID: string, data: { reply: 'once' | 'always' | 'reject'; message?: string }, directory?: string) =>
    post<boolean>(`/permission/${requestID}/reply`, data, { directory }),
}

export const questionApi = {
  list: (directory?: string) => get<QuestionRequest[]>('/question', { directory }),
  reply: (requestID: string, answers: QuestionAnswer[], directory?: string) =>
    post<boolean>(`/question/${requestID}/reply`, { answers }, { directory }),
  reject: (requestID: string, directory?: string) =>
    post<boolean>(`/question/${requestID}/reject`, undefined, { directory }),
}

export const providerApi = {
  list: (directory?: string) =>
    get<{ all: Provider[]; default: Record<string, string>; connected: string[] }>('/provider', { directory }),
  auth: (directory?: string) =>
    get<Record<string, unknown[]>>('/provider/auth', { directory }),
  oauthAuthorize: (providerID: string, method: number, directory?: string) =>
    post<{ authorizationUrl?: string; method?: string }>(`/provider/${providerID}/oauth/authorize`, { method }, { directory }),
  oauthCallback: (providerID: string, data: { method: number; code?: string }, directory?: string) =>
    post<boolean>(`/provider/${providerID}/oauth/callback`, data, { directory }),
}

export const toolApi = {
  ids: (directory?: string) => get<string[]>('/experimental/tool/ids', { directory }),
  list: (provider: string, model: string, directory?: string) =>
    get<unknown[]>('/experimental/tool', { provider, model, directory }),
}

export const worktreeApi = {
  create: (data: WorktreeCreateInput, directory?: string) =>
    post<{ path: string; branch: string }>('/experimental/worktree', data, { directory }),
  list: (directory?: string) => get<string[]>('/experimental/worktree', { directory }),
  remove: (data: WorktreeRemoveInput, directory?: string) =>
    del<boolean>('/experimental/worktree', { ...data, directory }),
  reset: (data: WorktreeResetInput, directory?: string) =>
    post<boolean>('/experimental/worktree/reset', data, { directory }),
}

export const resourceApi = {
  list: (directory?: string) => get<Record<string, McpResource>>('/experimental/resource', { directory }),
}

export const fileApi = {
  list: (path: string, directory?: string) => get<FileNode[]>('/file', { path, directory }),
  read: (path: string, directory?: string) => get<FileContent>('/file/content', { path, directory }),
  status: (directory?: string) => get<File[]>('/file/status', { directory }),
}

export const findApi = {
  text: (pattern: string, directory?: string) =>
    get<Array<{ path: { text: string }; lines: { text: string }; line_number: number; absolute_offset: number }>>('/find', { pattern, directory }),
  files: (query: string, params?: { dirs?: string; type?: string; limit?: number }, directory?: string) =>
    get<string[]>('/find/file', { query, ...params, directory }),
  symbols: (query: string, directory?: string) => get<Symbol[]>('/find/symbol', { query, directory }),
}

export const mcpApi = {
  status: (directory?: string) => get<Record<string, MCPStatus>>('/mcp', { directory }),
  add: (data: { name: string; config: unknown }, directory?: string) =>
    post<Record<string, MCPStatus>>('/mcp', data, { directory }),
  connect: (name: string, directory?: string) => post<boolean>(`/mcp/${name}/connect`, undefined, { directory }),
  disconnect: (name: string, directory?: string) => post<boolean>(`/mcp/${name}/disconnect`, undefined, { directory }),
}

export const pathApi = {
  get: (directory?: string) => get<Path>('/path', { directory }),
}

export const vcsApi = {
  get: (directory?: string) => get<VcsInfo>('/vcs', { directory }),
}

export const commandApi = {
  list: (directory?: string) => get<Command[]>('/command', { directory }),
}

export const agentApi = {
  list: (directory?: string) => get<Agent[]>('/agent', { directory }),
}

export const lspApi = {
  status: (directory?: string) => get<LSPStatus[]>('/lsp', { directory }),
}

export const formatterApi = {
  status: (directory?: string) => get<FormatterStatus[]>('/formatter', { directory }),
}

export const eventApi = {
  subscribe: (directory?: string) => get<GlobalEvent>('/event', { directory }),
}

export const logApi = {
  write: (data: { service: string; level: 'debug' | 'info' | 'error' | 'warn'; message: string; extra?: Record<string, unknown> }, directory?: string) =>
    post<boolean>('/log', data, { directory }),
}
