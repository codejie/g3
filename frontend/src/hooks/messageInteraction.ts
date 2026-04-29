export interface MessageInteractionContext {
  sessionId: string;
  messageId?: string;
  userMessageText?: string;
  directory?: string;
}

type MessageHook = (ctx: MessageInteractionContext) => void | Promise<void>;

const onSubmitHooks: MessageHook[] = [];
const onReplyStartHooks: MessageHook[] = [];
const onReplyEndHooks: MessageHook[] = [];

export function onMessageSubmit(hook: MessageHook) {
  onSubmitHooks.push(hook);
}

export function onReplyStart(hook: MessageHook) {
  onReplyStartHooks.push(hook);
}

export function onReplyEnd(hook: MessageHook) {
  onReplyEndHooks.push(hook);
}

export function offMessageSubmit(hook: MessageHook) {
  const i = onSubmitHooks.indexOf(hook);
  if (i !== -1) onSubmitHooks.splice(i, 1);
}

export function offReplyStart(hook: MessageHook) {
  const i = onReplyStartHooks.indexOf(hook);
  if (i !== -1) onReplyStartHooks.splice(i, 1);
}

export function offReplyEnd(hook: MessageHook) {
  const i = onReplyEndHooks.indexOf(hook);
  if (i !== -1) onReplyEndHooks.splice(i, 1);
}

async function fireHooks(hooks: MessageHook[], ctx: MessageInteractionContext): Promise<void> {
  for (const hook of hooks) {
    try {
      await hook(ctx);
    } catch (err) {
      console.error('[MessageInteractionHook] hook error:', err);
    }
  }
}

export async function fireMessageSubmit(ctx: MessageInteractionContext): Promise<void> {
  console.log('[Hook] fireMessageSubmit —', JSON.stringify(ctx));
  await fireHooks(onSubmitHooks, ctx);
}

export async function fireReplyStart(ctx: MessageInteractionContext): Promise<void> {
  console.log('[Hook] fireReplyStart —', JSON.stringify(ctx));
  await fireHooks(onReplyStartHooks, ctx);
}

export async function fireReplyEnd(ctx: MessageInteractionContext): Promise<void> {
  console.log('[Hook] fireReplyEnd —', JSON.stringify(ctx));
  await fireHooks(onReplyEndHooks, ctx);
}
