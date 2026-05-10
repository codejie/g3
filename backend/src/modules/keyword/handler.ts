import type { FastifyRequest, FastifyReply } from 'fastify';
import keywordModel from './model.js';
import type {
  GetKeywordsRequest,
  AddKeywordRequest,
  DeleteKeywordRequest,
  UpdateKeywordRequest,
  AddPromptRequest,
  DeletePromptRequest,
  UpdatePromptRequest,
  Keyword,
  Prompt,
} from '../../apis/extension/types/keyword';

const RESPONSE_CODES = {
  SUCCESS: 0,
  INVALID_REQUEST: -1,
  NOT_FOUND: -5,
  CONFLICT: -6,
};

function toKeyword(row: any): Keyword {
  const result: Keyword = {
    id: row.id,
    keyword: row.keyword,
    disabled: row.disabled,
    order: row.order,
    type: row.type,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
  if (row.description) result.description = row.description;
  return result;
}

function toPrompt(row: any): Prompt {
  const result: Prompt = {
    id: row.id,
    keyword_id: row.keyword_id,
    label: row.label,
    prompt: row.prompt,
    disabled: row.disabled,
    order: row.order,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
  if (row.description) result.description = row.description;
  return result;
}

export async function getKeywordsHandler(request: FastifyRequest, reply: FastifyReply) {
  const { keyword, type } = request.body as GetKeywordsRequest;

  const keywords = keywordModel.listKeywords(type);
  const items = keywords.map((kw) => {
    const prompts = keywordModel.listPrompts(kw.id);
    return {
      keyword: toKeyword(kw),
      prompts: prompts.map(toPrompt),
    };
  });

  const filtered = keyword
    ? items.filter((item) => item.keyword.keyword.includes(keyword))
    : items;

  return reply.send({
    code: RESPONSE_CODES.SUCCESS,
    data: { items: filtered },
  });
}

export async function addKeywordHandler(request: FastifyRequest, reply: FastifyReply) {
  const { keyword, description, order, type } = request.body as AddKeywordRequest;

  if (!keyword) {
    return reply.send({
      code: RESPONSE_CODES.INVALID_REQUEST,
      message: 'Keyword is required',
    });
  }

  const existing = keywordModel.findKeywordByKeyword(keyword);
  if (existing) {
    return reply.send({
      code: RESPONSE_CODES.CONFLICT,
      message: 'Keyword already exists',
    });
  }

  const kw = keywordModel.createKeyword({ keyword, description, order, type });

  return reply.send({
    code: RESPONSE_CODES.SUCCESS,
    data: { id: kw.id },
  });
}

export async function deleteKeywordHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.body as DeleteKeywordRequest;

  if (!id) {
    return reply.send({
      code: RESPONSE_CODES.INVALID_REQUEST,
      message: 'Keyword ID is required',
    });
  }

  const kw = keywordModel.findKeywordById(id);
  if (!kw) {
    return reply.send({
      code: RESPONSE_CODES.NOT_FOUND,
      message: 'Keyword not found',
    });
  }

  keywordModel.deleteKeyword(id);

  return reply.send({
    code: RESPONSE_CODES.SUCCESS,
  });
}

export async function updateKeywordHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id, keyword, description, order, type, disabled } = request.body as UpdateKeywordRequest;

  if (!id) {
    return reply.send({
      code: RESPONSE_CODES.INVALID_REQUEST,
      message: 'Keyword ID is required',
    });
  }

  const kw = keywordModel.findKeywordById(id);
  if (!kw) {
    return reply.send({
      code: RESPONSE_CODES.NOT_FOUND,
      message: 'Keyword not found',
    });
  }

  const fields: Record<string, unknown> = {};
  if (keyword !== undefined) fields.keyword = keyword;
  if (description !== undefined) fields.description = description;
  if (order !== undefined) fields.order = order;
  if (type !== undefined) fields.type = type;
  if (disabled !== undefined) fields.disabled = disabled;

  keywordModel.updateKeyword(id, fields);

  return reply.send({
    code: RESPONSE_CODES.SUCCESS,
    data: { id },
  });
}

export async function addPromptHandler(request: FastifyRequest, reply: FastifyReply) {
  const { keyword_id, label, prompt, description, order } = request.body as AddPromptRequest;

  if (!keyword_id || !label || !prompt) {
    return reply.send({
      code: RESPONSE_CODES.INVALID_REQUEST,
      message: 'Keyword ID, label, and prompt are required',
    });
  }

  const kw = keywordModel.findKeywordById(keyword_id);
  if (!kw) {
    return reply.send({
      code: RESPONSE_CODES.NOT_FOUND,
      message: 'Keyword not found',
    });
  }

  const p = keywordModel.createPrompt({ keyword_id, label, prompt, description, order });

  return reply.send({
    code: RESPONSE_CODES.SUCCESS,
    data: { id: p.id },
  });
}

export async function deletePromptHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.body as DeletePromptRequest;

  if (!id) {
    return reply.send({
      code: RESPONSE_CODES.INVALID_REQUEST,
      message: 'Prompt ID is required',
    });
  }

  const p = keywordModel.findPromptById(id);
  if (!p) {
    return reply.send({
      code: RESPONSE_CODES.NOT_FOUND,
      message: 'Prompt not found',
    });
  }

  keywordModel.deletePrompt(id);

  return reply.send({
    code: RESPONSE_CODES.SUCCESS,
  });
}

export async function updatePromptHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id, label, prompt, description, order, disabled } = request.body as UpdatePromptRequest;

  if (!id) {
    return reply.send({
      code: RESPONSE_CODES.INVALID_REQUEST,
      message: 'Prompt ID is required',
    });
  }

  const p = keywordModel.findPromptById(id);
  if (!p) {
    return reply.send({
      code: RESPONSE_CODES.NOT_FOUND,
      message: 'Prompt not found',
    });
  }

  const fields: Record<string, unknown> = {};
  if (label !== undefined) fields.label = label;
  if (prompt !== undefined) fields.prompt = prompt;
  if (description !== undefined) fields.description = description;
  if (order !== undefined) fields.order = order;
  if (disabled !== undefined) fields.disabled = disabled;

  keywordModel.updatePrompt(id, fields);

  return reply.send({
    code: RESPONSE_CODES.SUCCESS,
    data: { id },
  });
}
