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

export function setConfig(config: Partial<RequestConfig>) {
  Object.assign(defaultConfig, config)
}

export function getBaseURL(): string {
  return defaultConfig.baseURL
}

export function getHeaders(): Record<string, string> {
  return defaultConfig.headers || {}
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const url = new URL(path, defaultConfig.baseURL)

  const response = await fetch(url.toString(), {
    method,
    headers: defaultConfig.headers,
    body: body ? JSON.stringify(body) : undefined,
  })

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
  return request<T>('POST', path, body)
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