import type { FastifyInstance } from 'fastify';
import { uploadSkillHandler, downloadSkillHandler, deleteSkillHandler } from './handler';
import { authenticateAdmin } from '../../middleware/auth';

const downloadSkillSchema = {
  description: 'Download a skill package',
  tags: ['Skill'],
  body: {
    type: 'object',
    required: ['name'],
    properties: {
      name: { type: 'string', description: 'Skill name' },
    },
  },
};

const deleteSkillSchema = {
  description: 'Delete a skill',
  tags: ['Skill'],
  body: {
    type: 'object',
    required: ['name'],
    properties: {
      name: { type: 'string', description: 'Skill name' },
    },
  },
};

export async function skillRoutes(fastify: FastifyInstance) {
  fastify.post('/api/skill/upload', { preHandler: [authenticateAdmin] }, uploadSkillHandler);
  fastify.post('/api/skill/download', { preHandler: [authenticateAdmin], schema: downloadSkillSchema }, downloadSkillHandler);
  fastify.post('/api/skill/delete', { preHandler: [authenticateAdmin], schema: deleteSkillSchema }, deleteSkillHandler);
}

export default skillRoutes;
