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

const hooks: ActivateHook[] = [];

export function registerActivateHook(hook: ActivateHook) {
  hooks.push(hook);
}

export async function onProjectActivate(ctx: ActivateContext): Promise<void> {
  for (const hook of hooks) {
    await hook(ctx);
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
    console.log(`[ProjectHook] Setting system prompt via configApi — directory: ${ctx.directory}`);
    console.log(`[ProjectHook] System prompt content:\n${system}`);

    await configApi.update({ systemPrompt: system }, ctx.directory);

    console.log(`[ProjectHook] System prompt configured via configApi — directory: ${ctx.directory}`);
  } catch (error: any) {
    console.error(`[ProjectHook] System prompt configApi failed — directory: ${ctx.directory}:`, error.message);
  }
}

export async function setSystemPromptViaMessage(ctx: ActivateContext): Promise<void> {
  ensureOpenCodeConfig();

  const system = buildSystemPrompt(ctx);

  if (!ctx.sessionId) {
    console.warn(`[ProjectHook] Cannot set system prompt via message — no sessionId`);
    return;
  }

  try {
    console.log(`[ProjectHook] Setting system prompt via session message — session: ${ctx.sessionId}, directory: ${ctx.directory}`);
    console.log(`[ProjectHook] System prompt content:\n${system}`);

    await sessionApi.prompt(ctx.sessionId, {
      system,
      agent: process.env.VITE_AGENT_BUILD || 'build-extended',
      parts: [{ type: 'text', text: `<div style="text-align:center;color:#666">${getCurrentTimeString()}</div>` }],
      noReply: true,
    }, ctx.directory);

    console.log(`[ProjectHook] System prompt sent via session message — session: ${ctx.sessionId}`);
  } catch (error: any) {
    console.error(`[ProjectHook] System prompt via session message failed — session: ${ctx.sessionId}:`, error.message);
  }
}

registerActivateHook(setSystemPromptViaMessage);
