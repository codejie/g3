// ============================================
// HTTP Client Utilities for g2
// ============================================

import { useServerStore } from '../store/serverStore'

/**
 * 统一 fetch 入口
 * 在非 Tauri 环境下直接使用原生 fetch
 */
export async function unifiedFetch(input: string | URL | Request, init?: RequestInit): Promise<Response> {
  return globalThis.fetch(input, init)
}

/**
 * 获取当前 API Base URL
 * 优先使用 serverStore 中的活动服务器
 */
export function getApiBaseUrl(): string {
  const serverStore = useServerStore()
  return serverStore.getActiveBaseUrl()
}

/**
 * 获取当前活动服务器的 Authorization header
 */
export function getAuthHeader(): Record<string, string> {
  // 后续可根据 serverStore 扩展 Basic Auth 等
  return {}
}

/** @deprecated */
export const API_BASE = import.meta.env.VITE_OPENCODE_BASE_URL

// ============================================
// URL Building
// ============================================

type QueryValue = string | number | boolean | undefined

export function buildQueryString(params: Record<string, QueryValue>): string {
  const parts: string[] = []
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    }
  }
  return parts.length > 0 ? '?' + parts.join('&') : ''
}

export function buildUrl(path: string, params: Record<string, QueryValue> = {}): string {
  let baseUrl = getApiBaseUrl()
  if (baseUrl.endsWith('/')) {
    baseUrl = baseUrl.slice(0, -1)
  }
  return `${baseUrl}${path}${buildQueryString(params)}`
}

// ============================================
// HTTP Methods
// ============================================

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  body?: unknown
  headers?: Record<string, string>
  timeout?: number
  signal?: AbortSignal
}

const DEFAULT_TIMEOUT = 30_000

export async function request<T>(
  path: string,
  params: Record<string, QueryValue> = {},
  options: RequestOptions = {},
): Promise<T> {
  const { method = 'GET', body, headers = {}, timeout = DEFAULT_TIMEOUT, signal } = options

  const requestHeaders: Record<string, string> = {
    ...getAuthHeader(),
    ...headers,
  }

  const controller = new AbortController()
  let timeoutId: ReturnType<typeof setTimeout> | undefined

  if (timeout > 0) {
    timeoutId = setTimeout(() => controller.abort(new Error(`Request timed out after ${timeout}ms`)), timeout)
  }

  if (signal) {
    if (signal.aborted) {
      controller.abort(signal.reason)
    } else {
      signal.addEventListener('abort', () => controller.abort(signal.reason), { once: true })
    }
  }

  const init: RequestInit = {
    method,
    headers: requestHeaders,
    signal: controller.signal,
  }

  if (body !== undefined) {
    init.headers = {
      ...init.headers,
      'Content-Type': 'application/json',
    }
    init.body = JSON.stringify(body)
  }

  try {
    const response = await unifiedFetch(buildUrl(path, params), init)

    if (!response.ok) {
      let errorMsg = `Request failed: ${response.status}`
      try {
        const errorText = await response.text()
        if (errorText) errorMsg += ` - ${errorText}`
      } catch { /* ignore */ }
      throw new Error(errorMsg)
    }

    if (response.status === 204) return undefined as T
    const text = await response.text()
    if (!text) return undefined as T
    return JSON.parse(text)
  } finally {
    if (timeoutId !== undefined) clearTimeout(timeoutId)
  }
}

export async function get<T>(path: string, params: Record<string, QueryValue> = {}): Promise<T> {
  return request<T>(path, params, { method: 'GET' })
}

export async function post<T>(path: string, params: Record<string, QueryValue> = {}, body?: unknown): Promise<T> {
  return request<T>(path, params, { method: 'POST', body })
}

export async function patch<T>(path: string, params: Record<string, QueryValue> = {}, body?: unknown): Promise<T> {
  return request<T>(path, params, { method: 'PATCH', body })
}

export async function put<T>(path: string, params: Record<string, QueryValue> = {}, body?: unknown): Promise<T> {
  return request<T>(path, params, { method: 'PUT', body })
}

export async function del<T>(path: string, params: Record<string, QueryValue> = {}, body?: unknown): Promise<T> {
  return request<T>(path, params, { method: 'DELETE', body })
}
