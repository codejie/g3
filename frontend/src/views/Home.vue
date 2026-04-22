<template>
  <div class="home-container" :style="{ paddingTop: 'var(--safe-area-inset-top)' }">
    <!-- Left Sidebar -->
    <Sidebar
      :collapsed="chatStore.isSidebarCollapsed"
      :sessions="chatStore.sessionList"
      :currentSessionId="chatStore.currentSession?.id"
      @toggle="chatStore.toggleSidebar"
      @newChat="handleNewChat"
      @selectSession="handleSelectSession"
      @openSettings="showSettings = true"
    />

    <!-- Main Content Area -->
    <main class="main-content">
      <!-- Header -->
      <header class="main-header">
        <div class="header-left">
          <div v-if="chatStore.isSidebarCollapsed" class="brand-logo">
            <div class="logo-icon">
              <span>G3</span>
            </div>
            <span class="brand-text">G3</span>
          </div>
        <ModelSelector
          :isServerActive="eventStore.isServerActive"
          @select="handleModelSelect"
        />
        </div>
        <div class="header-right">
          <button class="header-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
          </button>
        </div>
      </header>

      <!-- Chat Area -->
      <div class="chat-area" ref="scrollContainer">
        <!-- Empty State -->
        <div v-if="!chatStore.hasSession" class="empty-state">
          <div class="welcome-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>
          </div>
          <h2 class="welcome-title">欢迎使用 G3</h2>
          <ChatInput
            v-model="message"
            :loading="chatStore.sending"
            @submit="sendMessage"
          />
        </div>

        <!-- Chat Messages -->
        <div v-else class="messages-container">
          <div class="messages-list">
            <div
              v-for="msg in messageStore.messages"
              :key="msg.info.id"
              class="message-item"
            >
              <div class="message-avatar" :class="msg.info.role">
                <svg v-if="msg.info.role === 'user'" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
              </div>
          <div class="message-content">
            <div
              v-for="(part, idx) in getProcessedParts(msg)"
              :key="idx"
            >
                  <!-- Thinking/Reasoning Part -->
                  <div
                    v-if="part.type === 'reasoning' && part.text.trim()"
                    class="thinking-block"
                  >
                    <div class="thinking-header">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/></svg>
                      <span>Thinking...</span>
                    </div>
                    <div class="thinking-content">{{ part.text.trim() }}</div>
                  </div>

                  <!-- Text Part (Markdown) -->
                  <div
                    v-else-if="part.type === 'text' && part.text"
                    class="markdown-body"
                    v-html="renderMarkdown(part.text)"
                  ></div>

                  <!-- Agent Part -->
                  <div
                    v-else-if="part.type === 'agent'"
                    class="agent-block"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 7h.01"/><path d="M17 7h.01"/><path d="M7 17h.01"/><path d="M17 17h.01"/></svg>
                    <span>Executing: {{ (part as any).name || 'agent' }}</span>
                  </div>
            </div>
          </div>
        </div>

        <!-- Waiting for response indicator -->
        <div v-if="isWaitingForResponse" class="message-item waiting-indicator">
          <div class="message-avatar assistant">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
          </div>
          <div class="message-content">
            <div class="waiting-dots">
              <span class="dot"></span>
              <span class="dot"></span>
              <span class="dot"></span>
            </div>
          </div>
        </div>
      </div>

      <!-- Floating Input -->
          <div class="floating-input">
            <ChatInput
              v-model="message"
              :loading="chatStore.sending"
              @submit="sendMessage"
            />
          </div>
        </div>
      </div>
    </main>

    <!-- Right Workspace Sidebar -->
    <WorkspaceSidebar
      :collapsed="chatStore.isRightSidebarCollapsed"
      @toggle="chatStore.toggleRightSidebar"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { sessionApi, setConfig } from '../apis/opencode/api';
import { useChatStore } from '../store/chatStore';
import { useMessageStore } from '../store/messageStore';
import { useEventStore } from '../store/eventStore';
import { renderMarkdown } from '../utils/markdownUtils';
import { processPartText } from '../utils/thinkingParser';
import Sidebar from './components/Sidebar.vue';
import WorkspaceSidebar from './components/WorkspaceSidebar.vue';
import ChatInput from './components/ChatInput.vue';
import ModelSelector from './components/ModelSelector.vue';
import type { Session } from '../types';
import { useModelStore } from '../store/modelStore';

// 默认模型配置常量
const DEFAULT_PROVIDER_ID = 'nvidia';
const DEFAULT_MODEL_ID = 'minimaxai/minimax-m2.5';

const chatStore = useChatStore();
const messageStore = useMessageStore();
const eventStore = useEventStore();
const modelStore = useModelStore();

const message = ref('');
const scrollContainer = ref<HTMLElement | null>(null);
const showSettings = ref(false);
const isWaitingForResponse = ref(false);

let unsubscribeSSE: (() => void) | null = null;

onMounted(async () => {
  // Initialize SSE connection
  unsubscribeSSE = eventStore.init();
  
  // Fetch existing sessions
  await chatStore.fetchSessions();
});

onUnmounted(() => {
  if (unsubscribeSSE) {
    unsubscribeSSE();
  }
});

// Auto-scroll to bottom when messages update
watch(() => messageStore.messages, () => {
  // 当收到AI回复时，隐藏等待指示器
  const lastMessage = messageStore.messages[messageStore.messages.length - 1];
  if (lastMessage?.info?.role === 'assistant' && lastMessage.parts.length > 0) {
    isWaitingForResponse.value = false;
  }
  scrollToBottom();
}, { deep: true });

const scrollToBottom = async () => {
  await nextTick();
  if (scrollContainer.value) {
    const container = scrollContainer.value.querySelector('.messages-list');
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }
};

const handleNewChat = async () => {
  messageStore.clearMessages();
  chatStore.resetSession();
};

const handleSelectSession = async (session: Session) => {
  await chatStore.selectSession(session);
  // TODO: Load messages for the session
};

// 处理消息的 parts，解析其中的 thinking 标签
const getProcessedParts = (msg: any) => {
  const processedParts: any[] = [];
  
  for (const part of msg.parts) {
    if (part.type === 'text' && part.text) {
      // 解析文本中的 thinking 标签
      const parsed = processPartText(part);
      parsed.forEach((p: any) => {
        processedParts.push({
          ...part,
          type: p.type,
          text: p.text
        });
      });
    } else {
      processedParts.push(part);
    }
  }
  
  return processedParts;
};

const getOpenCodeURL = (): string => {
  return import.meta.env.VITE_OPENCODE_URL || 'http://127.0.0.1:10090';
};

const handleModelSelect = (providerId: string, modelId: string) => {
};

const sendMessage = async () => {
  if (!message.value.trim() || chatStore.sending) return;

  const userMessage = message.value;
  message.value = '';

  // Add user message to store
  messageStore.addUserMessage(userMessage);

  // Show waiting indicator
  isWaitingForResponse.value = true;

  chatStore.sending = true;
  try {
    let sessionId = chatStore.currentSession?.id;

    if (!sessionId) {
      const session = await chatStore.startNewSession();
      sessionId = session.id;
    }

    const baseURL = getOpenCodeURL();
    setConfig({ baseURL });

    // Send message via async API (SSE will handle the response)
    await sessionApi.promptAsync(sessionId, {
      parts: [{ type: 'text', text: userMessage }],
      model: {
        providerID: modelStore.selectedProvider?.name || DEFAULT_PROVIDER_ID,
        modelID: modelStore.selectedModel?.name || DEFAULT_MODEL_ID
      }
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    chatStore.sending = false;
  }
};
</script>

<style scoped>
.home-container {
  position: relative;
  height: var(--app-height, 100vh);
  display: flex;
  background: var(--bg-100);
  overflow: hidden;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  height: 100%;
  overflow: hidden;
}

.main-header {
  height: 56px;
  border-bottom: 1px solid var(--border-100);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  background: var(--bg-000);
  backdrop-filter: blur(12px);
  z-index: 20;
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand-logo {
  display: flex;
  align-items: center;
  gap: 12px;
  animation: fadeIn 0.3s ease;
}

.logo-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: var(--accent-brand);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 14px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.brand-text {
  font-weight: bold;
  color: var(--text-100);
  letter-spacing: -0.02em;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-btn {
  padding: 8px;
  border-radius: 8px;
  transition: background 0.2s;
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--text-400);
}

.header-btn:hover {
  background: var(--bg-100);
}

.chat-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: var(--bg-100);
  overflow: hidden;
  position: relative;
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.welcome-icon {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  background: var(--accent-brand);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  margin-bottom: 24px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.welcome-title {
  font-size: 24px;
  font-weight: bold;
  color: var(--text-100);
  margin-bottom: 24px;
}

.messages-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

.messages-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  padding-bottom: 100px;
}

.messages-list::-webkit-scrollbar {
  width: 6px;
}

.messages-list::-webkit-scrollbar-thumb {
  background-color: var(--border-300);
  border-radius: 999px;
}

.message-item {
  display: flex;
  gap: 16px;
  margin-bottom: 32px;
  animation: slideIn 0.3s ease;
}

.message-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.message-avatar.user {
  background: var(--bg-300);
  color: var(--text-200);
}

.message-avatar.assistant {
  background: var(--accent-brand);
}

.message-content {
  flex: 1;
  overflow: hidden;
  min-width: 0;
}

.thinking-block {
  margin: 8px 0;
  padding: 12px;
  background: var(--bg-200);
  border-left: 2px solid var(--accent-brand);
  border-radius: 0 8px 8px 0;
  font-size: 12px;
  font-style: italic;
  color: var(--text-400);
}

.thinking-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  opacity: 0.5;
  font-size: 12px;
}

.thinking-content {
  white-space: pre-wrap;
  word-break: break-word;
  font-family: ui-monospace, 'SFMono-Regular', 'SF Mono', Menlo, Consolas, monospace;
}

.agent-block {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: var(--bg-200);
  border-radius: 8px;
  font-size: 12px;
  font-family: ui-monospace, 'SFMono-Regular', 'SF Mono', Menlo, Consolas, monospace;
}

.waiting-indicator {
  opacity: 0.7;
}

.waiting-dots {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 0;
}

.waiting-dots .dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--accent-brand);
  animation: dotPulse 1.4s ease-in-out infinite;
}

.waiting-dots .dot:nth-child(1) {
  animation-delay: 0s;
}

.waiting-dots .dot:nth-child(2) {
  animation-delay: 0.2s;
}

.waiting-dots .dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes dotPulse {
  0%, 80%, 100% {
    opacity: 0.3;
    transform: scale(0.8);
  }
  40% {
    opacity: 1;
    transform: scale(1);
  }
}

.floating-input {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 10;
  background: linear-gradient(to top, var(--bg-100), transparent);
  padding: 48px 16px 16px;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
