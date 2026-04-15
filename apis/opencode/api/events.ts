// ============================================
// Global Event Subscription (SSE) - Singleton Pattern
// ============================================

import { getApiBaseUrl, getAuthHeader } from './http'
import type { GlobalEvent, EventCallbacks } from './types'

// ============================================
// Connection State
// ============================================

export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error'

export interface ConnectionInfo {
  state: ConnectionState
  lastEventTime: number
  reconnectAttempt: number
  error?: string
}

let connectionInfo: ConnectionInfo = {
  state: 'disconnected',
  lastEventTime: 0,
  reconnectAttempt: 0,
}

const connectionListeners = new Set<(info: ConnectionInfo) => void>()

function updateConnectionState(update: Partial<ConnectionInfo>) {
  connectionInfo = { ...connectionInfo, ...update }
  connectionListeners.forEach(fn => fn(connectionInfo))
}

export function getConnectionInfo(): ConnectionInfo {
  return connectionInfo
}

export function subscribeToConnectionState(fn: (info: ConnectionInfo) => void): () => void {
  connectionListeners.add(fn)
  fn(connectionInfo)
  return () => connectionListeners.delete(fn)
}

// ============================================
// Singleton SSE Connection
// ============================================

const RECONNECT_DELAYS = [1000, 2000, 3000, 5000, 10000, 30000]
const HEARTBEAT_TIMEOUT = 60000

const allSubscribers = new Set<EventCallbacks>()

let singletonController: AbortController | null = null
let heartbeatTimer: ReturnType<typeof setTimeout> | null = null
let reconnectTimer: ReturnType<typeof setTimeout> | null = null
let isConnecting = false
let connectionGeneration = 0

function resetHeartbeat() {
  if (heartbeatTimer) clearTimeout(heartbeatTimer)
  updateConnectionState({ lastEventTime: Date.now() })

  heartbeatTimer = setTimeout(() => {
    console.warn(`[SSE] No events received for ${HEARTBEAT_TIMEOUT / 1000}s, reconnecting...`)
    updateConnectionState({ state: 'disconnected', error: 'Heartbeat timeout' })
    scheduleReconnect()
  }, HEARTBEAT_TIMEOUT)
}

function scheduleReconnect() {
  if (reconnectTimer) clearTimeout(reconnectTimer)
  if (allSubscribers.size === 0) return

  const attempt = connectionInfo.reconnectAttempt
  const delay = RECONNECT_DELAYS[Math.min(attempt, RECONNECT_DELAYS.length - 1)]

  reconnectTimer = setTimeout(() => {
    updateConnectionState({ reconnectAttempt: attempt + 1 })
    connectSingleton()
  }, delay)
}

function connectSingleton() {
  if (isConnecting || allSubscribers.size === 0) return

  if (connectionInfo.state === 'connected') {
    const timeSinceLastEvent = Date.now() - connectionInfo.lastEventTime
    if (timeSinceLastEvent > HEARTBEAT_TIMEOUT) {
      connectionGeneration++
      if (singletonController) {
        singletonController.abort()
        singletonController = null
      }
      updateConnectionState({ state: 'disconnected' })
    } else {
      return
    }
  }

  isConnecting = true
  updateConnectionState({ state: 'connecting' })

  connectViaBrowser()
}

function connectViaBrowser() {
  singletonController = new AbortController()
  const myGeneration = connectionGeneration

  fetch(`${getApiBaseUrl()}/global/event`, {
    signal: singletonController.signal,
    headers: {
      Accept: 'text/event-stream',
      ...getAuthHeader(),
    },
  })
    .then(async response => {
      isConnecting = false

      if (!response.ok) {
        throw new Error(`Failed to subscribe: ${response.status}`)
      }

      updateConnectionState({
        state: 'connected',
        reconnectAttempt: 0,
        error: undefined,
      })
      resetHeartbeat()

      allSubscribers.forEach(cb => cb.onReconnected?.('network'))

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response body')

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        if (myGeneration !== connectionGeneration) {
          reader.cancel().catch(() => {})
          break
        }

        const { done, value } = await reader.read()
        if (done) {
          updateConnectionState({ state: 'disconnected' })
          scheduleReconnect()
          break
        }

        resetHeartbeat()
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        const dataLines: string[] = []
        for (const rawLine of lines) {
          const line = rawLine.endsWith('\r') ? rawLine.slice(0, -1) : rawLine
          if (line.startsWith('data:')) {
            const payload = line[5] === ' ' ? line.slice(6) : line.slice(5)
            dataLines.push(payload)
          } else if (line === '') {
            if (dataLines.length > 0) {
              const eventData = dataLines.join('\n')
              dataLines.length = 0
              try {
                const globalEvent = JSON.parse(eventData) as GlobalEvent
                broadcastEvent(globalEvent)
              } catch (e) {
                console.warn('[SSE] Failed to parse event:', e, eventData)
              }
            }
          }
        }
      }
    })
    .catch(error => {
      isConnecting = false
      if (error.name === 'AbortError') return
      updateConnectionState({
        state: 'error',
        error: error.message || 'Connection failed',
      })
      allSubscribers.forEach(cb => cb.onError?.(error))
      scheduleReconnect()
    })
}

function broadcastEvent(globalEvent: GlobalEvent) {
  const { type, properties } = globalEvent.payload
  allSubscribers.forEach(callbacks => {
    handleEventForSubscriber(type, properties, callbacks)
  })
}

function handleEventForSubscriber(type: string, properties: unknown, callbacks: EventCallbacks) {
  switch (type) {
    case 'message.updated':
      callbacks.onMessageUpdated?.(properties as any)
      break
    case 'message.part.updated':
      callbacks.onPartUpdated?.(properties as any)
      break
    case 'message.part.delta':
      callbacks.onPartDelta?.(properties as any)
      break
    case 'session.status':
      callbacks.onSessionStatus?.(properties as any)
      break
    case 'server.heartbeat':
      callbacks.onServerHeartbeat?.(properties as any)
      break
  }
}

export function reconnectSSE() {
  if (allSubscribers.size === 0) return
  if (heartbeatTimer) clearTimeout(heartbeatTimer)
  if (reconnectTimer) clearTimeout(reconnectTimer)
  reconnectTimer = null
  connectionGeneration++
  if (singletonController) {
    singletonController.abort()
    singletonController = null
  }
  isConnecting = false
  updateConnectionState({
    state: 'disconnected',
    reconnectAttempt: 0,
    error: undefined,
  })
  connectSingleton()
}

export function subscribeToEvents(callbacks: EventCallbacks): () => void {
  allSubscribers.add(callbacks)
  if (allSubscribers.size === 1) {
    connectSingleton()
  }
  return () => {
    allSubscribers.delete(callbacks)
    if (allSubscribers.size === 0) {
      if (heartbeatTimer) clearTimeout(heartbeatTimer)
      if (reconnectTimer) clearTimeout(reconnectTimer)
      if (singletonController) {
        singletonController.abort()
        singletonController = null
      }
      isConnecting = false
      updateConnectionState({ state: 'disconnected' })
    }
  }
}
