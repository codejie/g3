import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { Message, MessagePart } from '../types';

export const useMessageStore = defineStore('message', () => {
  const messages = ref<Message[]>([]);
  const isStreaming = ref(false);

  const clearMessages = () => {
    messages.value = [];
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

    let messageIndex = messages.value.findIndex(m => m.info?.id === messageID);

    if (messageIndex === -1) {
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
    }
  };

  return {
    messages,
    isStreaming,
    clearMessages,
    updatePartType,
    addUserMessage,
    handlePartDelta,
  };
});
