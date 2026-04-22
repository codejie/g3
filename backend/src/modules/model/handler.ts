import type { FastifyRequest, FastifyReply } from 'fastify';
import modelModel from './model';
import type {
  GetModelsRequest,
  AddProviderRequest,
  AddModelRequest,
  DeleteModelRequest,
  DeleteProviderRequest,
  Provider,
  Model,
} from '../../apis/extension/types/model';

const RESPONSE_CODES = {
  SUCCESS: 0,
  INVALID_REQUEST: -1,
  NOT_FOUND: -5,
  CONFLICT: -6,
};

function toProvider(row: any): Provider {
  return {
    id: row.id,
    name: row.name,
    description: row.description || undefined,
    created: row.created_at,
  };
}

function toModel(row: any): Model {
  return {
    id: row.id,
    provider_id: row.provider_id,
    name: row.name,
    description: row.description || undefined,
    context_size: row.context_size || undefined,
    created: row.created_at,
  };
}

export async function getModelsHandler(request: FastifyRequest, reply: FastifyReply) {
  const { provider_id } = request.body as GetModelsRequest;

  const providers = modelModel.listProviders();
  const items = providers.map((providerRow) => {
    const models = modelModel.listModels(providerRow.id);
    return {
      provider: toProvider(providerRow),
      models: models.map(toModel),
    };
  });

  const filtered = provider_id
    ? items.filter((item) => item.provider.id === provider_id)
    : items;

  return reply.send({
    code: RESPONSE_CODES.SUCCESS,
    data: { items: filtered },
  });
}

export async function addProviderHandler(request: FastifyRequest, reply: FastifyReply) {
  const { name, description } = request.body as AddProviderRequest;

  if (!name) {
    return reply.send({
      code: RESPONSE_CODES.INVALID_REQUEST,
      message: 'Provider name is required',
    });
  }

  const existing = modelModel.findProviderByName(name);
  if (existing) {
    return reply.send({
      code: RESPONSE_CODES.CONFLICT,
      message: 'Provider already exists',
    });
  }

  const provider = modelModel.createProvider({ name, description });

  return reply.send({
    code: RESPONSE_CODES.SUCCESS,
    data: { id: provider.id },
  });
}

export async function addModelHandler(request: FastifyRequest, reply: FastifyReply) {
  const { provider_id, name, description, context_size } = request.body as AddModelRequest;

  if (!provider_id || !name) {
    return reply.send({
      code: RESPONSE_CODES.INVALID_REQUEST,
      message: 'Provider ID and model name are required',
    });
  }

  const provider = modelModel.findProviderById(provider_id);
  if (!provider) {
    return reply.send({
      code: RESPONSE_CODES.NOT_FOUND,
      message: 'Provider not found',
    });
  }

  modelModel.createModel({ provider_id, name, description, context_size });

  return reply.send({
    code: RESPONSE_CODES.SUCCESS,
    data: { provider_id },
  });
}

export async function deleteModelHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id, provider_id } = request.body as DeleteModelRequest;

  if (!id || !provider_id) {
    return reply.send({
      code: RESPONSE_CODES.INVALID_REQUEST,
      message: 'Model ID and provider ID are required',
    });
  }

  const model = modelModel.findModelById(id);
  if (!model) {
    return reply.send({
      code: RESPONSE_CODES.NOT_FOUND,
      message: 'Model not found',
    });
  }

  modelModel.deleteModel(id);

  return reply.send({
    code: RESPONSE_CODES.SUCCESS,
    data: { provider_id },
  });
}

export async function deleteProviderHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.body as DeleteProviderRequest;

  if (!id) {
    return reply.send({
      code: RESPONSE_CODES.INVALID_REQUEST,
      message: 'Provider ID is required',
    });
  }

  const provider = modelModel.findProviderById(id);
  if (!provider) {
    return reply.send({
      code: RESPONSE_CODES.NOT_FOUND,
      message: 'Provider not found',
    });
  }

  modelModel.deleteModelsByProvider(id);
  modelModel.deleteProvider(id);

  return reply.send({
    code: RESPONSE_CODES.SUCCESS,
  });
}
