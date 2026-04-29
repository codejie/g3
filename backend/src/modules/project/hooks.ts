import opencodeApi from '../../apis/opencode/api/request';
const { sessionApi, configApi, setConfig } = opencodeApi;
import type { Project } from '../../apis/extension/types/project';

export interface ActivateContext {
  userId: string;
  project: Project;
  sessionId: string | null;
  directory: string;
  workspacePath: string;
}

type ActivateHook = (ctx: ActivateContext) => Promise<void>;

const activateHooks: ActivateHook[] = [];

export function registerActivateHook(hook: ActivateHook) {
  activateHooks.push(hook);
}

export async function onProjectActivate(ctx: ActivateContext): Promise<void> {
  for (const hook of activateHooks) {
    await hook(ctx);
  }
}

export interface MessageInteractionContext {
  sessionId: string;
  messageId?: string;
  userMessageText?: string;
  directory?: string;
}

type MessageInteractionHook = (ctx: MessageInteractionContext) => Promise<void>;

const onSubmitHooks: MessageInteractionHook[] = [];
const onReplyStartHooks: MessageInteractionHook[] = [];
const onReplyEndHooks: MessageInteractionHook[] = [];

export function registerOnSubmitHook(hook: MessageInteractionHook) {
  onSubmitHooks.push(hook);
}

export function registerOnReplyStartHook(hook: MessageInteractionHook) {
  onReplyStartHooks.push(hook);
}

export function registerOnReplyEndHook(hook: MessageInteractionHook) {
  onReplyEndHooks.push(hook);
}

export async function fireOnSubmit(ctx: MessageInteractionContext): Promise<void> {
  for (const hook of onSubmitHooks) {
    try { await hook(ctx); } catch (err) { console.error('[Hook] onSubmit error:', err); }
  }
}

export async function fireOnReplyStart(ctx: MessageInteractionContext): Promise<void> {
  for (const hook of onReplyStartHooks) {
    try { await hook(ctx); } catch (err) { console.error('[Hook] onReplyStart error:', err); }
  }
}

export async function fireOnReplyEnd(ctx: MessageInteractionContext): Promise<void> {
  for (const hook of onReplyEndHooks) {
    try { await hook(ctx); } catch (err) { console.error('[Hook] onReplyEnd error:', err); }
  }
}

function ensureOpenCodeConfig(): void {
  const baseURL = process.env.VITE_OPENCODE_URL || 'http://127.0.0.1:10090';
  setConfig({ baseURL });
}

function getCurrentTimeString(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const MM = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const HH = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  return `--- ${yyyy}-${MM}-${dd} ${HH}:${mm}:${ss} ---`;
}

// 以下是会话信息、项目信息和用户信息，请加载到系统提示中，以供后续操作和回复参考使用。
//，并**忽略**本次消息中其他的消息，仅以"${ctx.project.name}项目加载完成~"作为回复内容，**不要使用**其他任何信息回复
// ---

function buildSystemPrompt(ctx: ActivateContext): string { 
  return `
Session Id: ${ctx.sessionId}
User Id: ${ctx.userId}
Project Name: ${ctx.project.name}
Project Type: ${ctx.project.type}
${ctx.project.description ? `Description: ${ctx.project.description}` : ''}
Project directory: ${ctx.workspacePath}`;
}

export async function setSystemPromptViaConfig(ctx: ActivateContext): Promise<void> {
  ensureOpenCodeConfig();

  const system = buildSystemPrompt(ctx);

  try {
    await configApi.update({ systemPrompt: system }, ctx.directory);
  } catch (error: any) {
    console.error(`[ProjectHook] System prompt configApi failed — directory: ${ctx.directory}:`, error.message);
  }
}

export async function setSystemPromptViaMessage(ctx: ActivateContext): Promise<void> {
  ensureOpenCodeConfig();

  // const system = buildSystemPrompt(ctx);

  if (!ctx.sessionId) {
    return;
  }

  try {
    await sessionApi.prompt(ctx.sessionId, {
      // system,
      agent: 'build-extended',
      model: {
        providerID: 'nvidia',
        modelID: 'google/gemma-4-31b-it'
      },
      parts: [{ type: 'text', text: `<div style="text-align:center;color:#666">${getCurrentTimeString()}</div>` }],
      noReply: true,
    }, ctx.directory);
  } catch (error: any) {
    console.error(`[ProjectHook] System prompt via session message failed — session: ${ctx.sessionId}:`, error.message);
  }
}

registerActivateHook(setSystemPromptViaMessage);
