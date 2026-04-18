export interface HealthResponse {
  healthy: boolean
  version: string
}

export interface BadRequestError {
  message: string
}

export interface NotFoundError {
  message: string
}

export interface Config {
  model?: string
  agent?: string
  temperature?: number
  systemPrompt?: string
  tools?: Record<string, boolean>
  [key: string]: unknown
}

export interface Auth {
  token: string
  [key: string]: unknown
}

export interface Project {
  id: string
  worktree: string
  vcs?: 'git'
  name?: string
  icon?: {
    url?: string
    override?: string
    color?: string
  }
  commands?: {
    start?: string
  }
  time: {
    created: number
    updated: number
    initialized?: number
  }
  sandboxes: string[]
}

export interface Session {
  id: string
  slug: string
  projectID: string
  directory: string
  parentID?: string
  summary?: {
    additions: number
    deletions: number
    files: number
    diffs?: FileDiff[]
  }
  share?: {
    url: string
  }
  title: string
  version: string
  time: {
    created: number
    updated: number
    compacting?: number
    archived?: number
  }
  permission?: PermissionRuleset
  revert?: {
    messageID: string
    partID?: string
    snapshot?: string
    diff?: string
  }
}

export interface FileDiff {
  file: string
  before: string
  after: string
  additions: number
  deletions: number
}

export interface SessionStatus {
  type: 'idle' | 'busy' | 'retry'
  attempt?: number
  message?: string
  next?: number
}

export interface Message {
  id: string
  sessionID: string
  role: 'user' | 'assistant'
  time: {
    created: number
    completed?: number
  }
}

export interface UserMessage extends Message {
  role: 'user'
  summary?: {
    title?: string
    body?: string
    diffs: FileDiff[]
  }
  agent: string
  model: {
    providerID: string
    modelID: string
  }
  system?: string
  tools?: Record<string, boolean>
  variant?: string
}

export interface AssistantMessage extends Message {
  role: 'assistant'
  parentID: string
  modelID: string
  providerID: string
  mode: string
  agent: string
  path: {
    cwd: string
    root: string
  }
  cost: number
  tokens: {
    input: number
    output: number
    reasoning: number
    cache: {
      read: number
      write: number
    }
  }
  error?: Error
  summary?: boolean
  finish?: string
}

export interface Part {
  id: string
  sessionID: string
  messageID: string
  type: string
}

export interface TextPart extends Part {
  type: 'text'
  text: string
  synthetic?: boolean
  ignored?: boolean
  time?: {
    start: number
    end?: number
  }
  metadata?: Record<string, unknown>
}

export interface FilePart extends Part {
  type: 'file'
  mime: string
  filename?: string
  url: string
  source?: FilePartSource
}

export interface FilePartSource {
  text: {
    value: string
    start: number
    end: number
  }
  type: 'file' | 'symbol' | 'resource'
  path?: string
  range?: Range
  name?: string
  kind?: number
  clientName?: string
  uri?: string
}

export interface Range {
  start: { line: number; character: number }
  end: { line: number; character: number }
}

export interface ToolPart extends Part {
  type: 'tool'
  callID: string
  tool: string
  state: ToolState
  metadata?: Record<string, unknown>
}

export type ToolState =
  | { status: 'pending'; input: Record<string, unknown>; raw: string }
  | { status: 'running'; input: Record<string, unknown>; time: { start: number }; title?: string; metadata?: Record<string, unknown> }
  | { status: 'completed'; input: Record<string, unknown>; output: string; title: string; metadata: Record<string, unknown>; time: { start: number; end: number; compacted?: number }; attachments?: FilePart[] }
  | { status: 'error'; input: Record<string, unknown>; error: string; metadata?: Record<string, unknown>; time: { start: number; end: number } }

export interface Ptysession {
  id: string
  title: string
  command: string
  args: string[]
  cwd: string
  status: 'running' | 'exited'
  pid: number
}

export interface Provider {
  id: string
  name: string
  env: string[]
  api?: string
  npm?: string
  models: Record<string, ProviderModel>
}

export interface ProviderModel {
  id: string
  name: string
  family?: string
  release_date: string
  attachment: boolean
  reasoning: boolean
  temperature: boolean
  tool_call: boolean
  limit: {
    context: number
    output: number
    input?: number
  }
  options: Record<string, unknown>
  cost?: {
    input: number
    output: number
    cache_read?: number
    cache_write?: number
  }
  modalities?: {
    input: ('text' | 'audio' | 'image' | 'video' | 'pdf')[]
    output: ('text' | 'audio' | 'image' | 'video' | 'pdf')[]
  }
}

export interface PermissionRequest {
  id: string
  sessionID: string
  permission: string
  patterns: string[]
  metadata: Record<string, unknown>
  always: string[]
  tool?: {
    messageID: string
    callID: string
  }
}

export interface QuestionRequest {
  id: string
  sessionID: string
  questions: QuestionInfo[]
  tool?: {
    messageID: string
    callID: string
  }
}

export interface QuestionInfo {
  question: string
  header: string
  options: QuestionOption[]
  multiple?: boolean
  custom?: boolean
}

export interface QuestionOption {
  label: string
  description: string
}

export type QuestionAnswer = string[]

export type PermissionAction = 'allow' | 'deny' | 'ask'

export interface PermissionRule {
  permission: string
  pattern: string
  action: PermissionAction
}

export type PermissionRuleset = PermissionRule[]

export interface Todo {
  id: string
  content: string
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  priority: 'high' | 'medium' | 'low'
}

export interface FileNode {
  name: string
  path: string
  type: 'file' | 'directory'
  size?: number
  modified?: number
}

export interface FileContent {
  path: string
  content: string
  language?: string
}

export interface File {
  path: string
  status: 'unmodified' | 'modified' | 'added' | 'deleted' | 'renamed'
}

export interface VcsInfo {
  branch: string
  root: string
  ahead?: number
  behind?: number
}

export interface Path {
  cwd: string
  root: string
}

export interface Agent {
  name: string
  description: string
  system?: string
  tools?: string[]
}

export interface Command {
  name: string
  description: string
  arguments?: string
}

export interface Symbol {
  name: string
  kind: number
  location: {
    path: string
    range: Range
  }
}

export interface McpResource {
  uri: string
  name: string
  description?: string
}

export interface MCPStatus {
  name: string
  status: 'connected' | 'disconnected' | 'connecting' | 'error'
  error?: string
}

export interface LSPStatus {
  id: string
  name: string
  status: 'running' | 'stopped' | 'error'
  error?: string
}

export interface FormatterStatus {
  id: string
  name: string
  status: 'available' | 'unavailable'
}

export type GlobalEvent =
  | { type: 'server.connected'; properties: {} }
  | { type: 'global.disposed'; properties: {} }
  | { type: 'project.updated'; properties: Project }
  | { type: 'session.created'; properties: { info: Session } }
  | { type: 'session.updated'; properties: { info: Session } }
  | { type: 'session.deleted'; properties: { info: Session } }
  | { type: 'session.status'; properties: { sessionID: string; status: SessionStatus } }
  | { type: 'session.idle'; properties: { sessionID: string } }
  | { type: 'message.updated'; properties: { info: Message } }
  | { type: 'message.part.updated'; properties: { part: Part; delta?: string } }
  | { type: 'permission.asked'; properties: PermissionRequest }
  | { type: 'question.asked'; properties: QuestionRequest }
  | { type: 'todo.updated'; properties: { sessionID: string; todos: Todo[] } }
  | { type: 'pty.created'; properties: { info: Ptysession } }
  | { type: 'pty.exited'; properties: { id: string; exitCode: number } }
  | { type: 'file.watcher.updated'; properties: { file: string; event: 'add' | 'change' | 'unlink' } }

export interface PromptInput {
  messageID?: string
  model?: {
    providerID: string
    modelID: string
  }
  agent?: string
  noReply?: boolean
  tools?: Record<string, boolean>
  system?: string
  variant?: string
  parts: PartInput[]
}

export type PartInput =
  | { type: 'text'; text: string }
  | { type: 'file'; mime: string; url: string; filename?: string; source?: FilePartSource }
  | { type: 'agent'; name: string; source?: { value: string; start: number; end: number } }
  | { type: 'subtask'; prompt: string; description: string; agent: string; model?: { providerID: string; modelID: string }; command?: string }

export interface CreatePtyInput {
  command: string
  args?: string[]
  cwd?: string
  title?: string
  env?: Record<string, string>
}

export interface UpdatePtyInput {
  title?: string
  size?: {
    rows: number
    cols: number
  }
}

export interface WorktreeCreateInput {
  branch?: string
}

export interface WorktreeRemoveInput {
  branch: string
}

export interface WorktreeResetInput {
  branch: string
}
