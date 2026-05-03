import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve } from 'path';
import modelModel from './model';

const OPENCODE_CONFIG_DIR = process.env.VITE_OPENCODE_CONFIG_PATH
  ? resolve(process.env.VITE_OPENCODE_CONFIG_PATH.replace(/^~/, process.env.HOME || ''))
  : resolve(process.env.HOME || '/root', '.config/opencode');

const CONFIG_FILE = 'config.json';

function readConfigJson(): Record<string, any> {
  const filePath = resolve(OPENCODE_CONFIG_DIR, CONFIG_FILE);
  if (!existsSync(filePath)) {
    return {};
  }
  try {
    const content = readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return {};
  }
}

function writeConfigJson(config: Record<string, any>): void {
  const filePath = resolve(OPENCODE_CONFIG_DIR, CONFIG_FILE);
  if (!existsSync(OPENCODE_CONFIG_DIR)) {
    mkdirSync(OPENCODE_CONFIG_DIR, { recursive: true });
  }
  writeFileSync(filePath, JSON.stringify(config, null, 2) + '\n', 'utf-8');
}

/**
 * Build the "provider" object in opencode config.json format from DB data.
 *
 * Target structure:
 * {
 *   "<provider_id>": {
 *     "name": "<name option value or provider_id>",
 *     "npm": "<npm if present>",          // optional
 *     "models": {
 *       "<model_id>": {
 *         "name": "<model name option or model_id>"
 *       }
 *     },
 *     "options": {                         // only non-name provider options
 *       "<key>": "<value>"
 *     }
 *   }
 * }
 */
function buildProviderObject(): Record<string, any> {
  const providers = modelModel.listProviders();
  const result: Record<string, any> = {};

  for (const providerRow of providers) {
    // Skip builtin providers - they should not be submitted to config
    if (providerRow.builtin === 1) continue;

    const providerOpts = modelModel.getProviderOptions(providerRow.id);
    const models = modelModel.listModels(providerRow.id);

    const providerEntry: Record<string, any> = {};

    // "name" field: use the 'name' option value, fallback to provider_id
    const nameOpt = providerOpts.find((o) => o.key === 'name');
    providerEntry.name = nameOpt ? nameOpt.value : providerRow.provider_id;

    // "npm" field: only include if present
    if (providerRow.npm) {
      providerEntry.npm = providerRow.npm;
    }

    // "models" field
    const modelsObj: Record<string, any> = {};
    for (const modelRow of models) {
      const modelOpts = modelModel.getModelOptions(modelRow.id);
      const modelNameOpt = modelOpts.find((o) => o.key === 'name');
      modelsObj[modelRow.model_id] = {
        name: modelNameOpt ? modelNameOpt.value : modelRow.model_id,
      };
    }
    if (Object.keys(modelsObj).length > 0) {
      providerEntry.models = modelsObj;
    }

    // "options" field: provider options excluding 'name' (name is a top-level field)
    const optionsObj: Record<string, string> = {};
    for (const opt of providerOpts) {
      if (opt.key !== 'name') {
        optionsObj[opt.key] = opt.value;
      }
    }
    if (Object.keys(optionsObj).length > 0) {
      providerEntry.options = optionsObj;
    }

    result[providerRow.provider_id] = providerEntry;
  }

  return result;
}

/**
 * Sync DB providers/models to opencode config.json's "provider" field.
 * Reads existing config.json, replaces only the "provider" field, writes back.
 * Called after every provider/model CRUD operation.
 */
export function syncConfigProvider(): void {
  const config = readConfigJson();
  config.provider = buildProviderObject();
  writeConfigJson(config);
}
