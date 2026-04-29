import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { Message, MessagePart } from '../types';
import { sessionApi, setConfig } from '../apis/opencode/api';
import { useChatStore } from './chatStore';
// import { fireReplyStart } from '../hooks/messageInteraction';

export const useMessageStore = defineStore('message', () => {
  const messages = ref<Message[]>([]);
  const isStreaming = ref(false);
  const loading = ref(false);
  const currentAssistantMessageId = ref<string | undefined>(undefined);

  const clearMessages = () => {
    messages.value = [];
    currentAssistantMessageId.value = undefined;
  };

  const loadMessages = async (sessionId: string, directory?: string) => {
    loading.value = true;
    try {
      const chatStore = useChatStore();
      const baseURL = chatStore.getOpenCodeURL();
      setConfig({ baseURL });

      const data = await sessionApi.messages(sessionId, undefined, directory);
      if (data && Array.isArray(data)) {
        messages.value = data.map((m: any) => ({
          info: {
            id: m.info.id,
            role: m.info.role,
            time: m.info.time,
          },
          parts: (m.parts || []).map((p: any) => ({
            id: p.id,
            type: p.type || 'text',
            text: p.text || '',
          })),
        }));
      }
    } catch (error) {
      console.error('[MessageStore] Failed to load messages:', error);
    } finally {
      loading.value = false;
    }
  };

  const updatePartType = (messageID: string, partID: string, type: string) => {
    const messageIndex = messages.value.findIndex(m => m.info?.id === messageID);
    if (messageIndex === -1) return;

    const message = messages.value[messageIndex];
    const partIndex = message.parts.findIndex((p: MessagePart) => p.id === partID);

    if (partIndex === -1) {
      message.parts.push({
        id: partID,
        type: type as MessagePart['type'],
        text: ''
      } as MessagePart);
    } else {
      const part = message.parts[partIndex];
      if (part.type !== type) {
        if (part.type === 'text' && (type === 'reasoning' || type === 'thought' || type === 'thinking')) {
          part.type = 'reasoning';
          message.parts[partIndex] = { ...part };
        } else if (type === 'text' && part.type === 'reasoning') {
          // Keep reasoning type
        } else {
          part.type = type as MessagePart['type'];
          message.parts[partIndex] = { ...part };
        }
      }
    }

    message.parts = [...message.parts];
    messages.value[messageIndex] = { ...message };
  };

  const addUserMessage = (text: string) => {
    const userMsg: Message = {
      info: {
        id: `temp-${Date.now()}`,
        role: 'user',
        time: { created: Date.now() },
      },
      parts: [{ id: `part-${Date.now()}`, type: 'text', text }],
    };
    messages.value.push(userMsg);
  };

  const handlePartDelta = (payload: any) => {
    const { messageID, partID, field, delta } = payload;
    console.log('[MessageStore] handlePartDelta — messageID:', messageID, 'partID:', partID, 'field:', field, 'delta:', delta?.slice(0, 50));

    let messageIndex = messages.value.findIndex(m => m.info?.id === messageID);

    if (messageIndex === -1) {
      console.log('[MessageStore] new assistant message created — messageID:', messageID);
      const newMessage: Message = {
        info: {
          id: messageID,
          role: 'assistant',
          time: { created: Date.now() },
        },
        parts: [],
      };
      messages.value.push(newMessage);
      messageIndex = messages.value.length - 1;

      isStreaming.value = true;
      currentAssistantMessageId.value = messageID;

      // fireReplyStart({ sessionId: '', messageId: messageID });
    }

    const message = messages.value[messageIndex];
    let partIndex = message.parts.findIndex((p: MessagePart) => p.id === partID);

    if (partIndex === -1) {
      const type = (field === 'reasoning' || field === 'thought') ? 'reasoning' : 'text';
      const newPart: MessagePart = {
        id: partID,
        type: type as MessagePart['type'],
        text: '',
      };
      message.parts.push(newPart);
      partIndex = message.parts.length - 1;
    }

    const part = message.parts[partIndex];

    if ((field === 'reasoning' || field === 'thought') && part.type !== 'reasoning') {
      part.type = 'reasoning';
    }

    if (part.type === 'text' || part.type === 'reasoning') {
      part.text += (delta || '');
      message.parts = [...message.parts];
      messages.value[messageIndex] = { ...message };
      console.log('[MessageStore] part updated — msgId:', messageID, 'partId:', partID, 'textLen:', part.text.length);
    } else {
      console.log('[MessageStore] part type skipped:', part.type);
    }
  };

  const markReplyEnded = () => {
    isStreaming.value = false;
    currentAssistantMessageId.value = undefined;
  };

  return {
    messages,
    isStreaming,
    loading,
    currentAssistantMessageId,
    clearMessages,
    loadMessages,
    updatePartType,
    addUserMessage,
    handlePartDelta,
    markReplyEnded,
  };
});
