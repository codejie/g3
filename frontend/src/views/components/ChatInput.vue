<template>
  <div class="chat-input-wrapper">
    <!-- Quick Actions -->
    <div class="quick-actions">
      <button
        v-for="action in quickActions"
        :key="action.id"
        @click="handleQuickAction(action)"
        class="quick-action-btn"
      >
        {{ action.label }}
      </button>
    </div>

    <!-- Input Area -->
    <div class="input-container">
      <textarea
        :value="modelValue"
        @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
        @keydown.ctrl.enter="handleSubmit"
        @keydown.meta.enter="handleSubmit"
        class="input-textarea"
        placeholder="输入消息... (Ctrl+Enter 发送)"
        rows="2"
      ></textarea>

      <!-- Bottom Controls -->
      <div class="input-controls">
        <div class="left-controls">
          <!-- Skills Placeholder -->
          <div class="skills-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
            <span>Skills</span>
          </div>
        </div>

        <div class="right-controls">
          <!-- Mode Selector -->
          <div class="mode-selector">
            <span class="mode-label">{{ currentMode }}</span>
          </div>

          <!-- Send Button -->
          <button
            @click="handleSubmit"
            :disabled="loading || !modelValue.trim()"
            class="send-btn"
          >
            <svg v-if="!loading" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

interface Props {
  modelValue: string;
  loading?: boolean;
}

defineProps<Props>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'submit'): void;
}>();

const currentMode = ref(import.meta.env.VITE_INIT_AGENT || 'build');

const quickActions = [
  { id: 'writing', label: '写作', prompt: '帮我写一篇关于...' },
  { id: 'page', label: '页面', prompt: '创建一个页面...' },
  { id: 'app', label: '应用', prompt: '帮我开发一个应用...' },
  { id: 'excel', label: '表格', prompt: '处理Excel文件...' }
];

const handleQuickAction = (action: typeof quickActions[0]) => {
  emit('update:modelValue', action.prompt);
};

const handleSubmit = () => {
  emit('submit');
};
</script>

<style scoped>
.chat-input-wrapper {
  width: 100%;
  margin: 0 auto;
}

.quick-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
  margin-bottom: 12px;
}

.quick-action-btn {
  padding: 6px 16px;
  border-radius: 9999px;
  font-size: 12px;
  transition: all 0.2s;
  border: 1px solid var(--border-200);
  background: var(--bg-200);
  color: var(--text-300);
  cursor: pointer;
}

.quick-action-btn:hover {
  border-color: var(--accent-brand);
  background: var(--bg-300);
  color: var(--text-100);
}

.input-container {
  position: relative;
  background: var(--bg-000);
  border: 1px solid var(--border-200);
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  transition: border-color 0.2s;
}

.input-container:focus-within {
  border-color: var(--accent-brand);
}

.input-textarea {
  width: 100%;
  background: transparent;
  border: none;
  padding: 16px;
  padding-bottom: 48px;
  resize: none;
  color: var(--text-100);
  font-size: 14px;
  line-height: 1.6;
  min-height: 52px;
  outline: none;
}

.input-textarea::placeholder {
  color: var(--text-400);
}

.input-controls {
  position: absolute;
  bottom: 12px;
  left: 12px;
  right: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.left-controls, .right-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.skills-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border-radius: 8px;
  background: var(--bg-100);
  border: 1px solid var(--border-100);
  cursor: pointer;
  transition: background 0.2s;
  color: var(--text-300);
  font-size: 10px;
  font-weight: bold;
  text-transform: uppercase;
}

.skills-btn:hover {
  background: var(--bg-200);
}

.mode-selector {
  display: flex;
  align-items: center;
  padding: 4px 8px;
  border-radius: 8px;
  background: var(--bg-100);
  border: 1px solid var(--border-100);
  cursor: pointer;
  transition: background 0.2s;
}

.mode-selector:hover {
  background: var(--bg-200);
}

.mode-label {
  font-size: 12px;
  font-weight: bold;
  color: var(--text-200);
  text-transform: uppercase;
  min-width: 40px;
  text-align: center;
}

.send-btn {
  padding: 8px;
  background: var(--accent-brand);
  color: white;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.send-btn:hover:not(:disabled) {
  background: var(--accent-main-000);
  transform: scale(1.05);
}

.send-btn:active:not(:disabled) {
  transform: scale(0.95);
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
