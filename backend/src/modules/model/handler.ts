import type { FastifyRequest, FastifyReply } from 'fastify';
import db from '../../utils/db';
import modelModel from './model';
import { syncConfigProvider } from './configSync';
import type {
  GetModelsRequest,
  AddProviderRequest,
  AddModelRequest,
  DeleteModelRequest,
  DeleteProviderRequest,
  UpdateProviderRequest,
  UpdateModelRequest,
  Provider as ApiProvider,
  Model as ApiModel,
} from '../../apis/extension/types/model';

const RESPONSE_CODES = {
  SUCCESS: 0,
  INVALID_REQUEST: -1,
  NOT_FOUND: -5,
  CONFLICT: -6,
};

function toProvider(row: any, options: any[]): ApiProvider {
  const result: ApiProvider = {
    id: row.id,
    provider_id: row.provider_id,
    options: options.map((o: any) => ({ key: o.key, value: o.value })),
  };
  if (row.npm) result.npm = row.npm;
  if (row.builtin === 1) result.builtin = true;
  return result;
}

function toModel(row: any, options: any[]): ApiModel {
  return {
    id: row.id,
    model_id: row.model_id,
    options: options.map((o: any) => ({ key: o.key, value: o.value })),
  };
}

export async function getModelsHandler(request: FastifyRequest, reply: FastifyReply) {
  const { provider_id } = request.body as GetModelsRequest;

  const providers = modelModel.listProviders();
  const items = providers.map((providerRow) => {
    const providerOpts = modelModel.getProviderOptions(providerRow.id);
    const models = modelModel.listModels(providerRow.id);
    return {
      provider: toProvider(providerRow, providerOpts),
      models: models.map((m) => toModel(m, modelModel.getModelOptions(m.id))),
    };
  });

  const filtered = provider_id
    ? items.filter((item) => item.provider.provider_id === provider_id || item.provider.id === provider_id)
    : items;

  return reply.send({
    code: RESPONSE_CODES.SUCCESS,
    data: { items: filtered },
  });
}

export async function addProviderHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id, npm, builtin, options } = request.body as AddProviderRequest;

  if (!id) {
    return reply.send({
      code: RESPONSE_CODES.INVALID_REQUEST,
      message: 'Provider ID is required',
    });
  }

  const existing = modelModel.findProviderByProviderId(id);
  if (existing) {
    return reply.send({
      code: RESPONSE_CODES.CONFLICT,
      message: 'Provider already exists',
    });
  }

  const provider = modelModel.createProvider({ provider_id: id, npm, builtin, options: options || [] });
  syncConfigProvider();

  return reply.send({
    code: RESPONSE_CODES.SUCCESS,
    data: { id: provider.id },
  });
}

export async function addModelHandler(request: FastifyRequest, reply: FastifyReply) {
  const { provider_id, id, options } = request.body as AddModelRequest;

  if (!provider_id || !id) {
    return reply.send({
      code: RESPONSE_CODES.INVALID_REQUEST,
      message: 'Provider ID and model ID are required',
    });
  }

  const provider = modelModel.findProviderByProviderId(provider_id) || modelModel.findProviderById(provider_id);
  if (!provider) {
    return reply.send({
      code: RESPONSE_CODES.NOT_FOUND,
      message: 'Provider not found',
    });
  }

  const existing = modelModel.findModelByModelId(provider.id, id);
  if (existing) {
    return reply.send({
      code: RESPONSE_CODES.CONFLICT,
      message: 'Model already exists under this provider',
    });
  }

  const model = modelModel.createModel({ provider_id: provider.id, model_id: id, options: options || [] });
  syncConfigProvider();

  return reply.send({
    code: RESPONSE_CODES.SUCCESS,
    data: { id: model.id, provider_id: provider.id },
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
  syncConfigProvider();

  return reply.send({
    code: RESPONSE_CODES.SUCCESS,
    data: { id, provider_id },
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

  const provider = modelModel.findProviderById(id) || modelModel.findProviderByProviderId(id);
  if (!provider) {
    return reply.send({
      code: RESPONSE_CODES.NOT_FOUND,
      message: 'Provider not found',
    });
  }

  modelModel.deleteModelsByProvider(provider.id);
  modelModel.deleteProvider(provider.id);
  syncConfigProvider();

  return reply.send({
    code: RESPONSE_CODES.SUCCESS,
  });
}

export async function updateProviderHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id, npm, builtin, options } = request.body as UpdateProviderRequest;

  if (!id) {
    return reply.send({
      code: RESPONSE_CODES.INVALID_REQUEST,
      message: 'Provider ID is required',
    });
  }

  const provider = modelModel.findProviderById(id) || modelModel.findProviderByProviderId(id);
  if (!provider) {
    return reply.send({
      code: RESPONSE_CODES.NOT_FOUND,
      message: 'Provider not found',
    });
  }

  if (npm !== undefined) {
    modelModel.updateProviderNpm(provider.id, npm || null);
  }

  if (builtin !== undefined) {
    modelModel.updateProviderBuiltin(provider.id, builtin ? 1 : 0);
  }

  if (options && options.length > 0) {
    modelModel.updateProviderOptions(provider.id, options);
  }

  const now = Math.floor(Date.now() / 1000);
  const updateStmt = db.prepare('UPDATE providers SET updated_at = ? WHERE id = ?');
  updateStmt.run(now, provider.id);
  syncConfigProvider();

  return reply.send({
    code: RESPONSE_CODES.SUCCESS,
    data: { id: provider.id },
  });
}

export async function updateModelHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id, provider_id, options } = request.body as UpdateModelRequest;

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

  if (options && options.length > 0) {
    modelModel.updateModelOptions(model.id, options);
  }

  const now = Math.floor(Date.now() / 1000);
  const updateStmt = db.prepare('UPDATE models SET updated_at = ? WHERE id = ?');
  updateStmt.run(now, model.id);
  syncConfigProvider();

  return reply.send({
    code: RESPONSE_CODES.SUCCESS,
    data: { id: model.id, provider_id: model.provider_id },
  });
}
