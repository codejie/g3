// ============================================
// Config API - 配置管理
// ============================================

import { get, patch } from './http'
import { formatPathForApi } from '../utils/directoryUtils'
import type { Config } from '../types/api/config'

const GLOBAL_CONFIG_DIR = '/root/.config/opencode'

/**
 * 获取当前配置
 */
export async function getConfig(directory?: string): Promise<Config> {
  const params = directory ? { directory: formatPathForApi(directory) } : {}
  return get<Config>('/config', params)
}

/**
 * 更新配置
 */
export async function updateConfig(config: Partial<Config>, directory?: string): Promise<Config> {
  const params = directory ? { directory: formatPathForApi(directory) } : {}
  return patch<Config>('/config', params, config)
}

/**
 * 获取全局配置
 */
export async function getGlobalConfig(): Promise<Config> {
  return get<Config>('/config', { directory: GLOBAL_CONFIG_DIR })
}

/**
 * 更新全局配置
 */
export async function updateGlobalConfig(config: Partial<Config>): Promise<Config> {
  const result = await patch<Config>('/config', { directory: GLOBAL_CONFIG_DIR }, config)
  return result
}

/**
 * 获取 provider 配置列表
 */
export async function getProviderConfigs(directory?: string): Promise<Record<string, unknown>> {
  return get<Record<string, unknown>>('/config/providers', { directory: formatPathForApi(directory) })
}
