import type { FastifyRequest, FastifyReply } from 'fastify';
import projectModel from './model';
import type {
  CreateProjectRequest,
  GetProjectDetailRequest,
  UpdateProjectRequest,
  SetProjectStatusRequest,
  ResetProjectSessionRequest,
  Project,
} from '../../apis/extension/types/project';
import opencodeApi from '../../apis/opencode/api/request';
const { sessionApi, setConfig } = opencodeApi;
import { ensureWorkspace } from '../file/model';
import { resolve } from 'path';
import { onProjectActivate } from './hooks';

const WORKSPACE_ROOT = process.env.VITE_WORKSPACE_ROOT || resolve(process.cwd(), 'data/workspace');

const RESPONSE_CODES = {
  SUCCESS: 0,
  INVALID_REQUEST: -1,
  NOT_FOUND: -5,
  INTERNAL_ERROR: -7,
};

export function getProjectDirectory(userId: string, projectId: string): string {
  return `/${userId}/${projectId}/`;
}

export function getProjectWorkspacePath(userId: string, projectId: string): string {
  return resolve(WORKSPACE_ROOT, userId, projectId);
}

function ensureOpenCodeConfig(): void {
  const baseURL = process.env.VITE_OPENCODE_URL || 'http://127.0.0.1:10090';
  setConfig({ baseURL });
}

async function createOpenCodeSession(title?: string): Promise<string> {
  ensureOpenCodeConfig();
  const session = await sessionApi.create({ title: title || 'New Project' });
  return session.id;
}

async function deleteOpenCodeSession(sessionId: string): Promise<void> {
  ensureOpenCodeConfig();
  await sessionApi.delete(sessionId);
}

function toProject(row: any): Project {
  return {
    id: row.id,
    user_id: row.user_id,
    session_id: row.session_id || '',
    name: row.name,
    type: row.type,
    description: row.description || undefined,
    status: row.status,
    created: row.created_at,
    updated: row.updated_at,
  };
}

export async function createProjectHandler(request: FastifyRequest, reply: FastifyReply) {
  const { name, type, description } = request.body as CreateProjectRequest;
  const userId = (request as any).userId;

  if (!type) {
    return reply.send({
      code: RESPONSE_CODES.INVALID_REQUEST,
      message: 'Project type is required',
    });
  }

  let sessionId: string;
  try {
    sessionId = await createOpenCodeSession(name || 'Untitled Project');
  } catch (error: any) {
    return reply.send({
      code: RESPONSE_CODES.INTERNAL_ERROR,
      message: `Failed to create session: ${error.message}`,
    });
  }

  const project = projectModel.create({
    user_id: userId,
    session_id: sessionId,
    name: name || 'Untitled Project',
    type,
    description,
  });

  await ensureWorkspace(userId, project.id);

  return reply.send({
    code: RESPONSE_CODES.SUCCESS,
    data: { id: project.id },
  });
}

export async function getProjectDetailHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.body as GetProjectDetailRequest;

  if (!id) {
    return reply.send({
      code: RESPONSE_CODES.INVALID_REQUEST,
      message: 'Project ID is required',
    });
  }

  const project = projectModel.findById(id);
  if (!project) {
    return reply.send({
      code: RESPONSE_CODES.NOT_FOUND,
      message: 'Project not found',
    });
  }

  return reply.send({
    code: RESPONSE_CODES.SUCCESS,
    data: {
      item: toProject(project),
      directory: getProjectWorkspacePath(project.user_id, project.id),
    },
  });
}

export async function activateProjectHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.body as GetProjectDetailRequest;
  const userId = (request as any).userId;

  if (!id) {
    return reply.send({
      code: RESPONSE_CODES.INVALID_REQUEST,
      message: 'Project ID is required',
    });
  }

  const project = projectModel.findById(id);
  if (!project) {
    return reply.send({
      code: RESPONSE_CODES.NOT_FOUND,
      message: 'Project not found',
    });
  }

  if (project.status === 'deleted') {
    return reply.send({
      code: RESPONSE_CODES.INVALID_REQUEST,
      message: 'Project is deleted',
    });
  }

  await ensureWorkspace(project.user_id, project.id);

  // const directory = getProjectDirectory(project.user_id, project.id);
  const directory = getProjectWorkspacePath(project.user_id, project.id);

  try {
    await onProjectActivate({
      userId,
      project: toProject(project),
      sessionId: project.session_id,
      directory,
      workspacePath: directory // getProjectWorkspacePath(project.user_id, project.id),
    });
  } catch (error: any) {
    console.error(`[Project] Activate hook failed for project ${id}:`, error.message);
  }

  console.log(`[Project] Activated — userId: ${userId}, projectId: ${id}, directory: ${directory}`);

  return reply.send({
    code: RESPONSE_CODES.SUCCESS,
    data: {
      item: toProject(project),
      directory,
    },
  });
}

export async function getProjectsHandler(request: FastifyRequest, reply: FastifyReply) {
  const userId = (request as any).userId;

  const projects = projectModel.listByUserId(userId);
  const active = projects.filter(p => p.status !== 'deleted');

  return reply.send({
    code: RESPONSE_CODES.SUCCESS,
    data: { items: active.map(toProject) },
  });
}

export async function updateProjectHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id, name, type, description } = request.body as UpdateProjectRequest;

  if (!id) {
    return reply.send({
      code: RESPONSE_CODES.INVALID_REQUEST,
      message: 'Project ID is required',
    });
  }

  const existing = projectModel.findById(id);
  if (!existing) {
    return reply.send({
      code: RESPONSE_CODES.NOT_FOUND,
      message: 'Project not found',
    });
  }

  projectModel.update({ id, name, type, description });

  return reply.send({
    code: RESPONSE_CODES.SUCCESS,
    data: { id },
  });
}

export async function setProjectStatusHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id, status } = request.body as SetProjectStatusRequest;

  if (!id || !status) {
    return reply.send({
      code: RESPONSE_CODES.INVALID_REQUEST,
      message: 'Project ID and status are required',
    });
  }

  const existing = projectModel.findById(id);
  if (!existing) {
    return reply.send({
      code: RESPONSE_CODES.NOT_FOUND,
      message: 'Project not found',
    });
  }

  if (status === 'deleted' && existing.session_id) {
    try {
      await deleteOpenCodeSession(existing.session_id);
    } catch (error: any) {
      console.error(`[Project] Failed to delete OpenCode session ${existing.session_id}:`, error.message);
    }
  }

  projectModel.setStatus(id, status);

  return reply.send({
    code: RESPONSE_CODES.SUCCESS,
    data: { id },
  });
}

export async function resetProjectSessionHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.body as ResetProjectSessionRequest;

  if (!id) {
    return reply.send({
      code: RESPONSE_CODES.INVALID_REQUEST,
      message: 'Project ID is required',
    });
  }

  const existing = projectModel.findById(id);
  if (!existing) {
    return reply.send({
      code: RESPONSE_CODES.NOT_FOUND,
      message: 'Project not found',
    });
  }

  if (existing.session_id) {
    try {
      await deleteOpenCodeSession(existing.session_id);
    } catch (error: any) {
      console.error(`[Project] Failed to delete OpenCode session ${existing.session_id}:`, error.message);
    }
  }

  let newSessionId: string;
  try {
    newSessionId = await createOpenCodeSession(existing.name);
  } catch (error: any) {
    return reply.send({
      code: RESPONSE_CODES.INTERNAL_ERROR,
      message: `Failed to create session: ${error.message}`,
    });
  }

  projectModel.resetSession(id, newSessionId);

  return reply.send({
    code: RESPONSE_CODES.SUCCESS,
    data: { id, session_id: newSessionId },
  });
}
