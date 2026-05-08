import type { FastifyRequest, FastifyReply } from 'fastify';
import db from '../../utils/db.js';
import opencodeApi from '../../apis/opencode/api/request.js';
const { sessionApi, setConfig } = opencodeApi;

const RESPONSE_CODES = {
  SUCCESS: 0,
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
