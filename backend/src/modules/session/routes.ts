import type { FastifyInstance } from 'fastify';
import { listSessionsHandler } from './handler.js';
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

export async function sessionRoutes(fastify: FastifyInstance) {
  fastify.post('/api/session/list', { preHandler: [authenticateAdmin], schema: listSessionsSchema }, listSessionsHandler);
}

export default sessionRoutes;
