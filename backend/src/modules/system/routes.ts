import type { FastifyInstance } from 'fastify';
import { executeScriptHandler } from './handler';
import { authenticateAdmin } from '../../middleware/auth';

const executeScriptSchema = {
  description: 'Execute a system script',
  tags: ['System'],
  body: {
    type: 'object',
    required: ['name'],
    properties: {
      requestId: { type: 'string' },
      name: { type: 'string', description: 'Script name' },
      params: {
        type: 'object',
        additionalProperties: { type: 'string' },
        description: 'Optional script parameters',
      },
    },
  },
};

export async function systemRoutes(fastify: FastifyInstance) {
  fastify.post('/api/system/execute-script', { preHandler: [authenticateAdmin], schema: executeScriptSchema }, executeScriptHandler);
}

export default systemRoutes;
