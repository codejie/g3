import type { FastifyInstance } from 'fastify';
import {
  getKeywordsHandler,
  addKeywordHandler,
  deleteKeywordHandler,
  updateKeywordHandler,
  addPromptHandler,
  deletePromptHandler,
  updatePromptHandler,
} from './handler.js';
import { authenticateUser, authenticateAdmin } from '../../middleware/auth.js';

const getKeywordsSchema = {
  description: 'Get keywords list',
  tags: ['Keyword'],
  body: {
    type: 'object',
    properties: {
      requestId: { type: 'string' },
      keyword: { type: 'string', description: 'Filter by keyword name (fuzzy match)' },
      type: { type: 'string', description: 'Filter by keyword type, e.g. general, project_specific' },
    },
  },
};

const addKeywordSchema = {
  description: 'Add a keyword',
  tags: ['Keyword'],
  body: {
    type: 'object',
    required: ['keyword'],
    properties: {
      requestId: { type: 'string' },
      keyword: { type: 'string', description: 'Keyword name' },
      description: { type: 'string', description: 'Keyword description' },
      order: { type: 'number', description: 'Sort order (higher = first), default 0' },
      type: { type: 'string', description: 'Keyword type, default general' },
    },
  },
};

const deleteKeywordSchema = {
  description: 'Delete a keyword and its prompts',
  tags: ['Keyword'],
  body: {
    type: 'object',
    required: ['id'],
    properties: {
      requestId: { type: 'string' },
      id: { type: 'string', description: 'Keyword ID' },
    },
  },
};

const updateKeywordSchema = {
  description: 'Update a keyword',
  tags: ['Keyword'],
  body: {
    type: 'object',
    required: ['id'],
    properties: {
      requestId: { type: 'string' },
      id: { type: 'string', description: 'Keyword ID' },
      keyword: { type: 'string', description: 'New keyword name' },
      description: { type: 'string', description: 'New description' },
      order: { type: 'number', description: 'New sort order' },
      type: { type: 'string', description: 'New keyword type' },
      disabled: { type: 'number', description: '0=enabled, 1=disabled' },
    },
  },
};

const addPromptSchema = {
  description: 'Add a prompt under a keyword',
  tags: ['Keyword'],
  body: {
    type: 'object',
    required: ['keyword_id', 'label', 'prompt'],
    properties: {
      requestId: { type: 'string' },
      keyword_id: { type: 'string', description: 'Parent keyword ID' },
      label: { type: 'string', description: 'Display label' },
      prompt: { type: 'string', description: 'Prompt text' },
      description: { type: 'string', description: 'Prompt description' },
      order: { type: 'number', description: 'Sort order (higher = first), default 0' },
    },
  },
};

const deletePromptSchema = {
  description: 'Delete a prompt',
  tags: ['Keyword'],
  body: {
    type: 'object',
    required: ['id'],
    properties: {
      requestId: { type: 'string' },
      id: { type: 'string', description: 'Prompt ID' },
    },
  },
};

const updatePromptSchema = {
  description: 'Update a prompt',
  tags: ['Keyword'],
  body: {
    type: 'object',
    required: ['id'],
    properties: {
      requestId: { type: 'string' },
      id: { type: 'string', description: 'Prompt ID' },
      label: { type: 'string', description: 'New display label' },
      prompt: { type: 'string', description: 'New prompt text' },
      description: { type: 'string', description: 'New description' },
      order: { type: 'number', description: 'New sort order' },
      disabled: { type: 'number', description: '0=enabled, 1=disabled' },
    },
  },
};

export async function keywordRoutes(fastify: FastifyInstance) {
  fastify.post('/api/keyword/list', { preHandler: [authenticateUser], schema: getKeywordsSchema }, getKeywordsHandler);
  fastify.post('/api/keyword/add', { preHandler: [authenticateAdmin], schema: addKeywordSchema }, addKeywordHandler);
  fastify.post('/api/keyword/delete', { preHandler: [authenticateAdmin], schema: deleteKeywordSchema }, deleteKeywordHandler);
  fastify.post('/api/keyword/update', { preHandler: [authenticateAdmin], schema: updateKeywordSchema }, updateKeywordHandler);
  fastify.post('/api/keyword/prompt/add', { preHandler: [authenticateAdmin], schema: addPromptSchema }, addPromptHandler);
  fastify.post('/api/keyword/prompt/delete', { preHandler: [authenticateAdmin], schema: deletePromptSchema }, deletePromptHandler);
  fastify.post('/api/keyword/prompt/update', { preHandler: [authenticateAdmin], schema: updatePromptSchema }, updatePromptHandler);
}

export default keywordRoutes;
