export interface RequestConfig {
  baseURL: string
  headers?: Record<string, string>
}

const defaultConfig: RequestConfig = {
  baseURL: '',
  headers: {
    'Content-Type': 'application/json',
  },
}

let authToken: string | null = null

export function setConfig(config: Partial<RequestConfig>) {
  Object.assign(defaultConfig, config)
}

export function setAuthToken(token: string | null) {
  authToken = token
}

export function getBaseURL(): string {
  return defaultConfig.baseURL
}

export function getHeaders(): Record<string, string> {
  return defaultConfig.headers || {}
}

let onUnauthorized: (() => void) | null = null

export function onAuthFailure(callback: () => void) {
  onUnauthorized = callback
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const base = defaultConfig.baseURL.replace(/\/+$/, '')
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  const fullURL = `${base}${cleanPath}`
  const url = new URL(fullURL)

  const headers: Record<string, string> = { ...defaultConfig.headers }
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`
  }

  const hasBody = body !== undefined && body !== null
  if (!hasBody) {
    delete headers['Content-Type']
  }

  const response = await fetch(url.toString(), {
    method,
    headers,
    body: hasBody ? JSON.stringify(body) : undefined,
  })

  if (response.status === 401 || response.status === 403) {
    if (onUnauthorized) onUnauthorized()
    throw new Error('Unauthorized')
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }))
    throw new Error(error.message || `HTTP ${response.status}`)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json()
}

export async function get<T>(path: string): Promise<T> {
  return request<T>('GET', path)
}

export async function post<T>(path: string, body?: unknown): Promise<T> {
  return request<T>('POST', path, body ?? {})
}

export async function put<T>(path: string, body?: unknown): Promise<T> {
  return request<T>('PUT', path, body)
}

export async function patch<T>(path: string, body?: unknown): Promise<T> {
  return request<T>('PATCH', path, body)
}

export async function del<T>(path: string): Promise<T> {
  return request<T>('DELETE', path)
}

export default {
  setConfig,
  setAuthToken,
  getBaseURL,
  getHeaders,
  onAuthFailure,
  get,
  post,
  put,
  patch,
  del,
}