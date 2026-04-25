import type { FastifyInstance } from 'fastify';
import {
  createProjectHandler,
  getProjectsHandler,
  getProjectDetailHandler,
  updateProjectHandler,
  setProjectStatusHandler,
  resetProjectSessionHandler,
} from './handler';
import { authenticateUser } from '../../middleware/auth';

const createProjectSchema = {
  description: 'Create a project',
  tags: ['Project'],
  body: {
    type: 'object',
    required: ['type'],
    properties: {
      requestId: { type: 'string' },
      name: { type: 'string', description: 'Project name' },
      type: { type: 'string', description: 'Project type' },
      description: { type: 'string', description: 'Project description' },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        code: { type: 'number' },
        message: { type: 'string' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
        },
      },
    },
  },
};

const getProjectsSchema = {
  description: 'Get projects list',
  tags: ['Project'],
  body: {
    type: 'object',
    properties: {
      requestId: { type: 'string' },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        code: { type: 'number' },
        message: { type: 'string' },
        data: {
          type: 'object',
          properties: {
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  user_id: { type: 'string' },
                  session_id: { type: 'string' },
                  name: { type: 'string' },
                  type: { type: 'string' },
                  description: { type: 'string' },
                  status: { type: 'string' },
                  created: { type: 'number' },
                  updated: { type: 'number' },
                },
              },
            },
          },
        },
      },
    },
  },
};

const getProjectDetailSchema = {
  description: 'Get project detail',
  tags: ['Project'],
  body: {
    type: 'object',
    required: ['id'],
    properties: {
      requestId: { type: 'string' },
      id: { type: 'string', description: 'Project ID' },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        code: { type: 'number' },
        message: { type: 'string' },
        data: {
          type: 'object',
          properties: {
            item: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                user_id: { type: 'string' },
                session_id: { type: 'string' },
                name: { type: 'string' },
                type: { type: 'string' },
                description: { type: 'string' },
                status: { type: 'string' },
                created: { type: 'number' },
                updated: { type: 'number' },
              },
            },
            directory: { type: 'string' },
          },
        },
      },
    },
  },
};

const updateProjectSchema = {
  description: 'Update a project',
  tags: ['Project'],
  body: {
    type: 'object',
    required: ['id'],
    properties: {
      requestId: { type: 'string' },
      id: { type: 'string', description: 'Project ID' },
      name: { type: 'string', description: 'Project name' },
      type: { type: 'string', description: 'Project type' },
      description: { type: 'string', description: 'Project description' },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        code: { type: 'number' },
        message: { type: 'string' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
        },
      },
    },
  },
};

const setProjectStatusSchema = {
  description: 'Set project status',
  tags: ['Project'],
  body: {
    type: 'object',
    required: ['id', 'status'],
    properties: {
      requestId: { type: 'string' },
      id: { type: 'string', description: 'Project ID' },
      status: { type: 'string', description: 'Project status' },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        code: { type: 'number' },
        message: { type: 'string' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
        },
      },
    },
  },
};

const resetProjectSessionSchema = {
  description: 'Reset project session',
  tags: ['Project'],
  body: {
    type: 'object',
    required: ['id'],
    properties: {
      requestId: { type: 'string' },
      id: { type: 'string', description: 'Project ID' },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        code: { type: 'number' },
        message: { type: 'string' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            session_id: { type: 'string' },
          },
        },
      },
    },
  },
};

export async function projectRoutes(fastify: FastifyInstance) {
  fastify.post('/api/project/create', { preHandler: [authenticateUser], schema: createProjectSchema }, createProjectHandler);
  fastify.post('/api/project/list', { preHandler: [authenticateUser], schema: getProjectsSchema }, getProjectsHandler);
  fastify.post('/api/project/detail', { preHandler: [authenticateUser], schema: getProjectDetailSchema }, getProjectDetailHandler);
  fastify.post('/api/project/update', { preHandler: [authenticateUser], schema: updateProjectSchema }, updateProjectHandler);
  fastify.post('/api/project/status', { preHandler: [authenticateUser], schema: setProjectStatusSchema }, setProjectStatusHandler);
  fastify.post('/api/project/reset-session', { preHandler: [authenticateUser], schema: resetProjectSessionSchema }, resetProjectSessionHandler);
}

export default projectRoutes;
