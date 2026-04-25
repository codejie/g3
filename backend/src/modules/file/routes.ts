import type { FastifyInstance } from 'fastify';
import {
  getFilesHandler,
  deleteFileHandler,
  downloadFileHandler,
  uploadFileHandler,
} from './handler';
import { authenticateUser } from '../../middleware/auth';

const getFilesSchema = {
  description: 'List files in project',
  tags: ['File'],
  body: {
    type: 'object',
    required: ['project_id'],
    properties: {
      requestId: { type: 'string' },
      project_id: { type: 'string', description: 'Project ID' },
      path: { type: 'string', description: 'Relative path within project workspace' },
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
                  name: { type: 'string' },
                  type: { type: 'string' },
                  size: { type: 'number' },
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

const deleteFileSchema = {
  description: 'Delete a file or directory',
  tags: ['File'],
  body: {
    type: 'object',
    required: ['project_id', 'path'],
    properties: {
      requestId: { type: 'string' },
      project_id: { type: 'string', description: 'Project ID' },
      path: { type: 'string', description: 'Relative path to delete' },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        code: { type: 'number' },
        message: { type: 'string' },
      },
    },
  },
};

const downloadFileSchema = {
  description: 'Download a file or directory (directory as .tar.gz)',
  tags: ['File'],
  body: {
    type: 'object',
    required: ['project_id', 'path'],
    properties: {
      requestId: { type: 'string' },
      project_id: { type: 'string', description: 'Project ID' },
      path: { type: 'string', description: 'Relative path to download' },
    },
  },
};

export async function fileRoutes(fastify: FastifyInstance) {
  fastify.post('/api/file/list', { preHandler: [authenticateUser], schema: getFilesSchema }, getFilesHandler);
  fastify.post('/api/file/delete', { preHandler: [authenticateUser], schema: deleteFileSchema }, deleteFileHandler);
  fastify.post('/api/file/download', { preHandler: [authenticateUser], schema: downloadFileSchema }, downloadFileHandler);
  fastify.post('/api/file/upload', { preHandler: [authenticateUser] }, uploadFileHandler);
}

export default fileRoutes;
