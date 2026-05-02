import type { FastifyInstance } from 'fastify';
import {
  getModelsHandler,
  addProviderHandler,
  addModelHandler,
  deleteModelHandler,
  deleteProviderHandler,
  updateProviderHandler,
  updateModelHandler,
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
};

const addProviderSchema = {
  description: 'Add a model provider',
  tags: ['Model'],
  body: {
    type: 'object',
    required: ['id'],
    properties: {
      requestId: { type: 'string' },
      id: { type: 'string', description: 'Provider ID string (e.g. openai, azure, anthropic)' },
      npm: { type: 'string', description: 'NPM package name for the provider adapter' },
      options: {
        type: 'array',
        items: {
          type: 'object',
          required: ['key', 'value'],
          properties: {
            key: { type: 'string' },
            value: { type: 'string' },
          },
        },
        description: 'Provider options',
      },
    },
  },
};

const addModelSchema = {
  description: 'Add a model',
  tags: ['Model'],
  body: {
    type: 'object',
    required: ['provider_id', 'id'],
    properties: {
      requestId: { type: 'string' },
      provider_id: { type: 'string', description: 'Provider ID' },
      id: { type: 'string', description: 'Model ID string (e.g. gpt-3.5-turbo, gpt-4)' },
      options: {
        type: 'array',
        items: {
          type: 'object',
          required: ['key', 'value'],
          properties: {
            key: { type: 'string' },
            value: { type: 'string' },
          },
        },
        description: 'Model options',
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
};

const updateProviderSchema = {
  description: 'Update a provider',
  tags: ['Model'],
  body: {
    type: 'object',
    required: ['id'],
    properties: {
      requestId: { type: 'string' },
      id: { type: 'string', description: 'Provider ID' },
      npm: { type: 'string', description: 'NPM package name for the provider adapter' },
      options: {
        type: 'array',
        items: {
          type: 'object',
          required: ['key', 'value'],
          properties: {
            key: { type: 'string' },
            value: { type: 'string' },
          },
        },
        description: 'Provider options to update',
      },
    },
  },
};

const updateModelSchema = {
  description: 'Update a model',
  tags: ['Model'],
  body: {
    type: 'object',
    required: ['id', 'provider_id'],
    properties: {
      requestId: { type: 'string' },
      id: { type: 'string', description: 'Model ID' },
      provider_id: { type: 'string', description: 'Provider ID' },
      options: {
        type: 'array',
        items: {
          type: 'object',
          required: ['key', 'value'],
          properties: {
            key: { type: 'string' },
            value: { type: 'string' },
          },
        },
        description: 'Model options to update',
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
  fastify.post('/api/model/provider/update', { preHandler: [authenticateAdmin], schema: updateProviderSchema }, updateProviderHandler);
  fastify.post('/api/model/update', { preHandler: [authenticateAdmin], schema: updateModelSchema }, updateModelHandler);
}

export default modelRoutes;
