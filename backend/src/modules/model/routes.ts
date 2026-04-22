import type { FastifyInstance } from 'fastify';
import {
  getModelsHandler,
  addProviderHandler,
  addModelHandler,
  deleteModelHandler,
  deleteProviderHandler,
} from './handler';
import { authenticateUser, authenticateAdmin } from '../../middleware/auth';

const getModelsSchema = {
  description: 'Get models list',
  tags: ['Model'],
  body: {
    type: 'object',
    properties: {
      requestId: { type: 'string' },
      provider_id: { type: 'string', description: 'Filter by provider ID' },
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
                  provider: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      name: { type: 'string' },
                      description: { type: 'string' },
                      created: { type: 'number' },
                    },
                  },
                  models: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
            id: { type: 'string' },
            provider_id: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            context_size: { type: 'number' },
            created: { type: 'number' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};

const addProviderSchema = {
  description: 'Add a model provider',
  tags: ['Model'],
  body: {
    type: 'object',
    required: ['name'],
    properties: {
      requestId: { type: 'string' },
      name: { type: 'string', description: 'Provider name' },
      description: { type: 'string', description: 'Provider description' },
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

const addModelSchema = {
  description: 'Add a model',
  tags: ['Model'],
  body: {
    type: 'object',
    required: ['provider_id', 'name'],
    properties: {
      requestId: { type: 'string' },
      provider_id: { type: 'string', description: 'Provider ID' },
      name: { type: 'string', description: 'Model name' },
      description: { type: 'string', description: 'Model description' },
      context_size: { type: 'number', description: 'Context size in tokens' },
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
            provider_id: { type: 'string' },
          },
        },
      },
    },
  },
};

const deleteModelSchema = {
  description: 'Delete a model',
  tags: ['Model'],
  body: {
    type: 'object',
    required: ['id', 'provider_id'],
    properties: {
      requestId: { type: 'string' },
      id: { type: 'string', description: 'Model ID' },
      provider_id: { type: 'string', description: 'Provider ID' },
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
            provider_id: { type: 'string' },
          },
        },
      },
    },
  },
};

const deleteProviderSchema = {
  description: 'Delete a provider and its models',
  tags: ['Model'],
  body: {
    type: 'object',
    required: ['id'],
    properties: {
      requestId: { type: 'string' },
      id: { type: 'string', description: 'Provider ID' },
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

export async function modelRoutes(fastify: FastifyInstance) {
  fastify.post('/api/model/list', { preHandler: [authenticateUser], schema: getModelsSchema }, getModelsHandler);
  fastify.post('/api/model/provider/add', { preHandler: [authenticateAdmin], schema: addProviderSchema }, addProviderHandler);
  fastify.post('/api/model/add', { preHandler: [authenticateAdmin], schema: addModelSchema }, addModelHandler);
  fastify.post('/api/model/delete', { preHandler: [authenticateAdmin], schema: deleteModelSchema }, deleteModelHandler);
  fastify.post('/api/model/provider/delete', { preHandler: [authenticateAdmin], schema: deleteProviderSchema }, deleteProviderHandler);
}

export default modelRoutes;
