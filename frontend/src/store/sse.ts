import type { EventCallbacks, ConnectionInfo, ConnectionState } from '../types';

let controller: AbortController | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let heartbeatTimer: ReturnType<typeof setTimeout> | null = null;
let reconnectAttempt = 0;
let isConnecting = false;
let connectionGeneration = 0;
const MAX_RECONNECT_ATTEMPTS = 10;
const BASE_RECONNECT_DELAY = 1000;
const HEARTBEAT_TIMEOUT = 60000;

const connectionInfo: ConnectionInfo = {
  state: 'disconnected',
  lastEventTime: Date.now(),
  reconnectAttempt: 0,
};

let currentCallbacks: EventCallbacks = {};

function buildSSEURL(): string {
  const baseURL = import.meta.env.VITE_OPENCODE_URL || 'http://127.0.0.1:10090';
  return `${baseURL}/global/event`;
}

function resetHeartbeat() {
  if (heartbeatTimer) clearTimeout(heartbeatTimer);
  connectionInfo.lastEventTime = Date.now();
  heartbeatTimer = setTimeout(() => {
    console.warn(`[SSE] No events for ${HEARTBEAT_TIMEOUT / 1000}s, reconnecting...`);
    connectionInfo.state = 'disconnected';
    scheduleReconnect();
  }, HEARTBEAT_TIMEOUT);
}

function scheduleReconnect() {
  if (reconnectTimer) clearTimeout(reconnectTimer);
  const delay = BASE_RECONNECT_DELAY * Math.pow(2, Math.min(reconnectAttempt, MAX_RECONNECT_ATTEMPTS - 1));
  reconnectAttempt++;
  connectionInfo.reconnectAttempt = reconnectAttempt;
  // console.log(`[SSE] reconnecting in ${delay}ms, attempt ${reconnectAttempt}`);
  reconnectTimer = setTimeout(() => {
    connect();
  }, delay);
}

function dispatchEvent(type: string, properties: any): void {
  // console.log('[SSE] dispatchEvent:', type, JSON.stringify(properties).slice(0, 200));
  switch (type) {
    case 'message.updated':
      currentCallbacks.onMessageUpdated?.(properties);
      break;
    case 'message.part.updated':
      currentCallbacks.onPartUpdated?.(properties);
      break;
    case 'message.part.delta':
      currentCallbacks.onPartDelta?.(properties);
      break;
    case 'session.status':
      currentCallbacks.onSessionStatus?.(properties);
      break;
    case 'session.idle':
      currentCallbacks.onSessionIdle?.(properties);
      break;
    case 'server.connected':
      connectionInfo.state = 'connected';
      connectionInfo.lastEventTime = Date.now();
      reconnectAttempt = 0;
      connectionInfo.reconnectAttempt = 0;
      currentCallbacks.onReconnected?.('network');
      break;
    case 'server.heartbeat':
      currentCallbacks.onServerHeartbeat?.(null);
      break;
    default:
      console.warn('[SSE] unhandled event type:', type);
      break;
  }
}

function connect(): void {
  if (isConnecting) return;
  isConnecting = true;
  connectionInfo.state = 'connecting';

  controller = new AbortController();
  const myGeneration = connectionGeneration;
  const url = buildSSEURL();

  // console.log('[SSE] connecting to:', url);

  fetch(url, {
    signal: controller.signal,
    headers: { Accept: 'text/event-stream' },
  })
    .then(async (response) => {
      isConnecting = false;
      if (!response.ok) {
        throw new Error(`SSE subscribe failed: ${response.status}`);
      }

      connectionInfo.state = 'connected';
      connectionInfo.lastEventTime = Date.now();
      reconnectAttempt = 0;
      connectionInfo.reconnectAttempt = 0;
      resetHeartbeat();
      currentCallbacks.onReconnected?.('network');

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        if (myGeneration !== connectionGeneration) {
          reader.cancel().catch(() => {});
          break;
        }
        const { done, value } = await reader.read();
        if (done) {
          connectionInfo.state = 'disconnected';
          scheduleReconnect();
          break;
        }
        resetHeartbeat();
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        const dataLines: string[] = [];
        for (const rawLine of lines) {
          const line = rawLine.endsWith('\r') ? rawLine.slice(0, -1) : rawLine;
          if (line.startsWith('data:')) {
            const payload = line[5] === ' ' ? line.slice(6) : line.slice(5);
            dataLines.push(payload);
          } else if (line === '') {
            if (dataLines.length > 0) {
              const eventData = dataLines.join('\n');
              dataLines.length = 0;
              try {
                const globalEvent = JSON.parse(eventData);
                const type = globalEvent?.payload?.type;
                const properties = globalEvent?.payload?.properties;
                if (type && properties) {
                  dispatchEvent(type, properties);
                } else {
                  console.warn('[SSE] event missing payload.type/properties:', globalEvent);
                }
              } catch (e) {
                console.warn('[SSE] failed to parse event:', e, eventData.slice(0, 100));
              }
            }
          }
        }
      }
    })
    .catch((error) => {
      isConnecting = false;
      if (error.name === 'AbortError') return;
      console.error('[SSE] connection error:', error);
      connectionInfo.state = 'disconnected';
      connectionInfo.error = error.message;
      currentCallbacks.onError?.(error);
      scheduleReconnect();
    });
}

export function subscribeToEvents(callbacks: EventCallbacks): () => void {
  currentCallbacks = callbacks;
  connect();

  return () => {
    if (heartbeatTimer) {
      clearTimeout(heartbeatTimer);
      heartbeatTimer = null;
    }
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    connectionGeneration++;
    if (controller) {
      controller.abort();
      controller = null;
    }
    isConnecting = false;
    connectionInfo.state = 'disconnected';
  };
}

export function getConnectionInfo(): ConnectionInfo {
  return connectionInfo;
}

export function getSSEState(): ConnectionState {
  return connectionInfo.state;
}
