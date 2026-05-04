import type { FastifyInstance } from 'fastify';
import {
  getFilesHandler,
  deleteFileHandler,
  downloadFileHandler,
  uploadFileHandler,
  readFileHandler,
  readOpencodeConfigHandler,
  saveOpencodeConfigHandler,
  downloadOpencodeConfigHandler,
  uploadOpencodeConfigHandler,
} from './handler.js';
import { authenticateUser, authenticateAdmin } from '../../middleware/auth.js';

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

const readFileSchema = {
  description: 'Read file content (max 10KB)',
  tags: ['File'],
  body: {
    type: 'object',
    required: ['project_id', 'path'],
    properties: {
      requestId: { type: 'string' },
      project_id: { type: 'string', description: 'Project ID' },
      path: { type: 'string', description: 'Relative file path to read' },
    },
  },
};

const readOpencodeConfigSchema = {
  description: 'Read OpenCode config file content',
  tags: ['File'],
  body: {
    type: 'object',
    required: ['name'],
    properties: {
      requestId: { type: 'string' },
      name: { type: 'string', description: 'Config file name (opencode.json or config.json)' },
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
            name: { type: 'string' },
            content: { type: 'string' },
            exists: { type: 'boolean' },
          },
        },
      },
    },
  },
};

const saveOpencodeConfigSchema = {
  description: 'Save OpenCode config file content',
  tags: ['File'],
  body: {
    type: 'object',
    required: ['name', 'content'],
    properties: {
      requestId: { type: 'string' },
      name: { type: 'string', description: 'Config file name (opencode.json or config.json)' },
      content: { type: 'string', description: 'JSON content of the config file' },
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

const downloadOpencodeConfigSchema = {
  description: 'Download OpenCode config file',
  tags: ['File'],
  body: {
    type: 'object',
    required: ['name'],
    properties: {
      requestId: { type: 'string' },
      name: { type: 'string', description: 'Config file name (opencode.json or config.json)' },
    },
  },
};

export async function fileRoutes(fastify: FastifyInstance) {
  fastify.post('/api/file/list', { preHandler: [authenticateUser], schema: getFilesSchema }, getFilesHandler);
  fastify.post('/api/file/delete', { preHandler: [authenticateUser], schema: deleteFileSchema }, deleteFileHandler);
  fastify.post('/api/file/download', { preHandler: [authenticateUser], schema: downloadFileSchema }, downloadFileHandler);
  fastify.post('/api/file/upload', { preHandler: [authenticateUser] }, uploadFileHandler);
  fastify.post('/api/file/read', { preHandler: [authenticateUser], schema: readFileSchema }, readFileHandler);

  // OpenCode Config — admin only
  fastify.post('/api/file/opencode-config/read', { preHandler: [authenticateAdmin], schema: readOpencodeConfigSchema }, readOpencodeConfigHandler);
  fastify.post('/api/file/opencode-config/save', { preHandler: [authenticateAdmin], schema: saveOpencodeConfigSchema }, saveOpencodeConfigHandler);
  fastify.post('/api/file/opencode-config/download', { preHandler: [authenticateAdmin], schema: downloadOpencodeConfigSchema }, downloadOpencodeConfigHandler);
  fastify.post('/api/file/opencode-config/upload', { preHandler: [authenticateAdmin] }, uploadOpencodeConfigHandler);
}

export default fileRoutes;
