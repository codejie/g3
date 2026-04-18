export interface MessagePart {
  id: string;
  type: 'text' | 'reasoning' | 'agent' | 'tool';
  text: string;
}

export interface Message {
  info: {
    id: string;
    role: 'user' | 'assistant';
    time?: {
      created?: number;
    };
  };
  parts: MessagePart[];
}

export interface GlobalEvent {
  type: string;
  payload: {
    type: string;
    properties: any;
  };
}

export interface EventCallbacks {
  onMessageUpdated?: (payload: any) => void;
  onPartUpdated?: (payload: any) => void;
  onPartDelta?: (payload: any) => void;
  onSessionStatus?: (payload: any) => void;
  onServerHeartbeat?: (payload: any) => void;
  onError?: (error: Error) => void;
  onReconnected?: (source: string) => void;
}

export interface Session {
  id: string;
  title?: string;
  time?: {
    created?: number;
    updated?: number;
  };
  status?: string;
}

export interface Model {
  id: string;
  providerId: string;
  name: string;
  providerName?: string;
  contextLimit?: number;
}

export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error';

export interface ConnectionInfo {
  state: ConnectionState;
  lastEventTime: number;
  reconnectAttempt: number;
  error?: string;
}
