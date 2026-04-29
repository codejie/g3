import { defineStore } from 'pinia';
import { ref } from 'vue';
import { subscribeToEvents, getConnectionInfo } from './sse';
import type { ConnectionInfo } from '../types';
import { useMessageStore } from './messageStore';
// import { fireReplyEnd } from '../hooks/messageInteraction';

export const useEventStore = defineStore('event', () => {
  const messageStore = useMessageStore();
  const connection = ref<ConnectionInfo>(getConnectionInfo());
  const lastHeartbeatTime = ref<number>(Date.now());
  const isServerActive = ref<boolean>(true);

  let heartbeatCheckTimer: ReturnType<typeof setTimeout> | null = null;

  const startHeartbeatCheck = () => {
    if (heartbeatCheckTimer) clearInterval(heartbeatCheckTimer);
    heartbeatCheckTimer = setInterval(() => {
      const now = Date.now();
      isServerActive.value = (now - lastHeartbeatTime.value) < 30000;
    }, 5000);
  };

  const init = () => {
    // console.log('[EventStore] init — setting up SSE callbacks');
    const callbacks = {
      onPartDelta: (payload: any) => {
        // console.log('[EventStore] onPartDelta received');
        messageStore.handlePartDelta(payload);
      },
      onPartUpdated: (payload: any) => {
        const part = payload.part;
        const mID = part.messageID || part.messageId || part.message_id;
        const pID = part.id || part.partID || part.id;
        const pType = part.type || part.field || part.type;
        // console.log('[EventStore] onPartUpdated — mID:', mID, 'pID:', pID, 'pType:', pType);

        if (mID && pID && pType) {
          messageStore.updatePartType(mID, pID, pType);
        }
      },
      onSessionStatus: (payload: any) => {
        // console.log('[EventStore] onSessionStatus:', JSON.stringify(payload).slice(0, 200));
        if (payload.status && typeof payload.status === 'object' && payload.status.type === 'idle') {
          // console.log('[EventStore] session idle via sessionStatus');
          // fireReplyEnd({ sessionId: payload.sessionID, messageId: messageStore.currentAssistantMessageId });
          messageStore.markReplyEnded();
        }
      },
      onSessionIdle: (payload: { sessionID: string }) => {
        // console.log('[EventStore] onSessionIdle — sessionId:', payload.sessionID);
        // fireReplyEnd({ sessionId: payload.sessionID, messageId: messageStore.currentAssistantMessageId });
        messageStore.markReplyEnded();
      },
      onServerHeartbeat: () => {
        lastHeartbeatTime.value = Date.now();
        isServerActive.value = true;
      },
      onError: (error: Error) => {
        console.error('[SSE] Error:', error);
      },
      onReconnected: () => {
        lastHeartbeatTime.value = Date.now();
        isServerActive.value = true;
      }
    };

    const unsubscribe = subscribeToEvents(callbacks);
    startHeartbeatCheck();

    return () => {
      unsubscribe();
      if (heartbeatCheckTimer) clearInterval(heartbeatCheckTimer);
    };
  };

  return {
    connection,
    isServerActive,
    init
  };
});
