import type { FastifyRequest, FastifyReply } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import db from '../../utils/db.js';
import opencodeApi from '../../apis/opencode/api/request.js';
const { sessionApi, setConfig } = opencodeApi;

const RESPONSE_CODES = {
  SUCCESS: 0,
  INVALID_REQUEST: -1,
  INTERNAL_ERROR: -7,
};

function ensureOpenCodeConfig(): void {
  const baseURL = process.env.VITE_OPENCODE_URL || 'http://127.0.0.1:10090';
  setConfig({ baseURL });
}

interface SessionItem {
  id: string;
  title: string;
  directory: string;
  created: number;
  updated: number;
  project_name: string | null;
  project_type: string | null;
  project_status: string | null;
  user_name: string | null;
}

export async function listSessionsHandler(_request: FastifyRequest, reply: FastifyReply) {
  ensureOpenCodeConfig();

  let sessions: any[];
  try {
    sessions = await sessionApi.list();
  } catch (error: any) {
    return reply.send({
      code: RESPONSE_CODES.INTERNAL_ERROR,
      message: `Failed to fetch sessions from OpenCode: ${error.message}`,
    });
  }

  // Build session_id -> project mapping from DB
  const projectRows = db.prepare(
    'SELECT session_id, name, type, status, user_id FROM projects WHERE status != ? AND session_id IS NOT NULL'
  ).all('deleted') as { session_id: string; name: string; type: string; status: string; user_id: string }[];

  const projectBySessionId = new Map<string, { name: string; type: string; status: string; user_id: string }>();
  for (const row of projectRows) {
    projectBySessionId.set(row.session_id, { name: row.name, type: row.type, status: row.status, user_id: row.user_id });
  }

  // Build user_id -> username mapping from DB
  const userRows = db.prepare('SELECT id, username FROM users').all() as { id: string; username: string }[];
  const usernameById = new Map<string, string>();
  for (const row of userRows) {
    usernameById.set(row.id, row.username);
  }

  const items: SessionItem[] = (sessions || []).map((s: any) => {
    const project = projectBySessionId.get(s.id) || null;
    return {
      id: s.id,
      title: s.title || '',
      directory: s.directory || '',
      created: s.time?.created || 0,
      updated: s.time?.updated || 0,
      project_name: project?.name || null,
      project_type: project?.type || null,
      project_status: project?.status || null,
      user_name: project ? (usernameById.get(project.user_id) || null) : null,
    };
  });

  return reply.send({
    code: RESPONSE_CODES.SUCCESS,
    data: { items },
  });
}

// --- AutoClean handlers ---

export function getAutoCleanEnabled(): boolean {
  const row = db.prepare('SELECT value FROM system_config WHERE key = ?').get('autoCleanEnabled') as { value: string } | undefined;
  return row ? row.value === '1' : false;
}

export function setAutoCleanEnabled(enabled: boolean): void {
  const now = Math.floor(Date.now() / 1000);
  db.prepare('INSERT INTO system_config (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at')
    .run('autoCleanEnabled', enabled ? '1' : '0', now);
}

export async function getAutoCleanHandler(_request: FastifyRequest, reply: FastifyReply) {
  const enabled = getAutoCleanEnabled();
  return reply.send({
    code: RESPONSE_CODES.SUCCESS,
    data: { enabled },
  });
}

export async function setAutoCleanHandler(request: FastifyRequest, reply: FastifyReply) {
  const { enabled } = request.body as { enabled: boolean };
  if (typeof enabled !== 'boolean') {
    return reply.send({
      code: RESPONSE_CODES.INVALID_REQUEST,
      message: 'enabled must be a boolean',
    });
  }
  setAutoCleanEnabled(enabled);
  return reply.send({
    code: RESPONSE_CODES.SUCCESS,
    data: { enabled },
  });
}

// --- Cleanup logic (used by timer and can be called programmatically) ---

export async function cleanupUnboundSessions(): Promise<{ deleted: number; failed: number }> {
  ensureOpenCodeConfig();

  let sessions: any[];
  try {
    sessions = await sessionApi.list();
  } catch (error: any) {
    console.error('[AutoClean] Failed to fetch sessions:', error.message);
    return { deleted: 0, failed: 0 };
  }

  const boundSessionIds = new Set(
    (db.prepare('SELECT session_id FROM projects WHERE status != ? AND session_id IS NOT NULL').all('deleted') as { session_id: string }[])
      .map(r => r.session_id)
  );

  const unboundSessions = (sessions || []).filter((s: any) => !boundSessionIds.has(s.id));

  let deleted = 0;
  let failed = 0;
  for (const session of unboundSessions) {
    try {
      await sessionApi.delete(session.id);
      deleted++;
    } catch (e: any) {
      console.error(`[AutoClean] Failed to delete session ${session.id}:`, e.message);
      failed++;
    }
  }

  if (deleted > 0) {
    console.log(`[AutoClean] Cleaned ${deleted} unbound sessions${failed > 0 ? `, ${failed} failed` : ''}`);
  }

  try {
    const now = Math.floor(Date.now() / 1000);
    db.prepare('INSERT INTO log_entries (id, user_id, action, target, details, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(
      uuidv4(),
      null,
      'auto_clean_sessions',
      'session',
      JSON.stringify({ deleted, failed, unbound_total: unboundSessions.length }),
      now,
    );
  } catch (logError: any) {
    console.error('[AutoClean] Failed to write log entry:', logError.message);
  }

  return { deleted, failed };
}
