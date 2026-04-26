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

function buildSystemPrompt(ctx: ActivateContext): string {
  return `You are a helpful AI assistant working in the G3 project workspace.

sessionId: ${ctx.sessionId}
userId: ${ctx.userId}
Project: ${ctx.project.name}
Type: ${ctx.project.type}
${ctx.project.description ? `Description: ${ctx.project.description}` : ''}

Working directory: ${ctx.workspacePath}

Follow the user's instructions carefully. When working with files, always operate within the project workspace.`;
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
      agent: 'build-extended',
      parts: [{ type: 'text', text: 'Understood. I will follow the system instructions.' }],
      noReply: true,
    }, ctx.directory);

    console.log(`[ProjectHook] System prompt sent via session message — session: ${ctx.sessionId}`);
  } catch (error: any) {
    console.error(`[ProjectHook] System prompt via session message failed — session: ${ctx.sessionId}:`, error.message);
  }
}

registerActivateHook(setSystemPromptViaMessage);
