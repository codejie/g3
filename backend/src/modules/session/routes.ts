import type { FastifyInstance } from 'fastify';
import { listSessionsHandler, getAutoCleanHandler, setAutoCleanHandler } from './handler.js';
import { authenticateAdmin } from '../../middleware/auth.js';

const listSessionsSchema = {
  description: 'List all OpenCode sessions with project/user info',
  tags: ['Session'],
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
                  title: { type: 'string' },
                  directory: { type: 'string' },
                  created: { type: 'number' },
                  updated: { type: 'number' },
                  project_name: { type: 'string' },
                  project_type: { type: 'string' },
                  project_status: { type: 'string' },
                  user_name: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
  },
};

const getAutoCleanSchema = {
  description: 'Get auto-clean enabled status',
  tags: ['Session'],
  response: {
    200: {
      type: 'object',
      properties: {
        code: { type: 'number' },
        message: { type: 'string' },
        data: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
          },
        },
      },
    },
  },
};

const setAutoCleanSchema = {
  description: 'Set auto-clean enabled status',
  tags: ['Session'],
  body: {
    type: 'object',
    required: ['enabled'],
    properties: {
      requestId: { type: 'string' },
      enabled: { type: 'boolean', description: 'Enable or disable auto-clean' },
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
            enabled: { type: 'boolean' },
          },
        },
      },
    },
  },
};

export async function sessionRoutes(fastify: FastifyInstance) {
  fastify.post('/api/session/list', { preHandler: [authenticateAdmin], schema: listSessionsSchema }, listSessionsHandler);
  fastify.post('/api/session/auto-clean/get', { preHandler: [authenticateAdmin], schema: getAutoCleanSchema }, getAutoCleanHandler);
  fastify.post('/api/session/auto-clean/set', { preHandler: [authenticateAdmin], schema: setAutoCleanSchema }, setAutoCleanHandler);
}

export default sessionRoutes;
