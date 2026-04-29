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
      :disabled="disabled"
    ></textarea>

      <!-- Bottom Controls -->
      <div class="input-controls">
      <div class="left-controls">
      </div>

      <div class="right-controls">
        <!-- Skills Dropdown -->
        <div class="skills-dropdown" :class="{ open: skillsDropdownOpen }">
          <button
            class="skills-trigger"
            @click="toggleSkillsDropdown"
            :disabled="disabled"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
            <span>Skills</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          <div v-if="skillsDropdownOpen" class="skills-options">
            <div v-if="skillsLoading" class="skills-loading">加载中...</div>
            <div v-else-if="skillsList.length === 0" class="skills-empty">暂无 Skills</div>
            <button
              v-else
              v-for="skill in skillsList"
              :key="skill.name"
              class="skill-item"
              @click="handleSkillSelect(skill)"
            >
              <span class="skill-name">{{ skill.name }}</span>
              <span class="skill-desc">{{ truncateDesc(skill.description) }}</span>
            </button>
          </div>
        </div>

        <!-- Mode Dropdown -->
        <div class="mode-dropdown" :class="{ open: modeDropdownOpen }">
          <button
            class="mode-trigger"
            @click="modeDropdownOpen = !modeDropdownOpen"
            :disabled="disabled"
          >
            <span class="mode-label">{{ currentMode }}</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          <div v-if="modeDropdownOpen" class="mode-options">
            <button
              v-for="option in agentModes"
              :key="option.id"
              class="mode-option"
              :class="{ active: currentMode === option.id }"
              @click="selectMode(option.id)"
            >
              <span class="mode-option-label">{{ option.label }}</span>
            </button>
          </div>
        </div>

        <!-- Send Button -->
          <button
            @click="handleSubmit"
            :disabled="loading || disabled || !modelValue.trim()"
            class="send-btn"
          >
            <svg v-if="!loading" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { skillApi, setConfig } from '../../apis/opencode/api';
import type { Skill } from '../../apis/opencode/types';

interface Props {
  modelValue: string;
  loading?: boolean;
  disabled?: boolean;
  directory?: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'submit'): void;
  (e: 'agentModeChange', mode: string): void;
  (e: 'skillSelect', skill: Skill): void;
}>();

const skillsList = ref<Skill[]>([]);
const skillsLoading = ref(false);
const skillsDropdownOpen = ref(false);

const fetchSkills = async () => {
  skillsLoading.value = true;
  try {
    const baseURL = import.meta.env.VITE_OPENCODE_URL || 'http://127.0.0.1:10090';
    setConfig({ baseURL });
    skillsList.value = await skillApi.list();
  } catch (error) {
    console.error('[ChatInput] Failed to fetch skills:', error);
    skillsList.value = [];
  } finally {
    skillsLoading.value = false;
  }
};

const toggleSkillsDropdown = () => {
  skillsDropdownOpen.value = !skillsDropdownOpen.value;
  if (skillsDropdownOpen.value && skillsList.value.length === 0 && !skillsLoading.value) {
    fetchSkills();
  }
};

const truncateDesc = (desc: string): string => {
  if (!desc) return '';
  if (desc.length <= 64) return desc;
  return desc.slice(0, 64) + '...';
};

const handleSkillSelect = (skill: Skill) => {
  const current = props.modelValue || '';
  emit('update:modelValue', current + `/${skill.name} `);
  skillsDropdownOpen.value = false;
};

const agentModes = [
  { id: 'build', label: 'BUILD', agent: import.meta.env.VITE_AGENT_BUILD || 'build-extended' },
  { id: 'plan', label: 'PLAN', agent: import.meta.env.VITE_AGENT_PLAN || 'plan-extended' }
];

const initMode = import.meta.env.VITE_INIT_AGENT_MODE || 'build';
const currentMode = ref(initMode);
const modeDropdownOpen = ref(false);

const selectMode = (modeId: string) => {
  const mode = agentModes.find(m => m.id === modeId);
  if (mode) {
    currentMode.value = mode.id;
    emit('agentModeChange', mode.agent);
  }
  modeDropdownOpen.value = false;
};

const handleClickOutside = (e: MouseEvent) => {
  const target = e.target as HTMLElement;
  if (!target.closest('.mode-dropdown')) {
    modeDropdownOpen.value = false;
  }
  if (!target.closest('.skills-dropdown')) {
    skillsDropdownOpen.value = false;
  }
};

onMounted(() => document.addEventListener('click', handleClickOutside));
onUnmounted(() => document.removeEventListener('click', handleClickOutside));

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

.input-textarea:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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

.skills-dropdown {
  position: relative;
}

.skills-trigger {
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

.skills-trigger:hover:not(:disabled) {
  background: var(--bg-200);
}

.skills-trigger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.skills-options {
  position: absolute;
  bottom: 100%;
  right: 0;
  margin-bottom: 4px;
  background: var(--bg-000);
  border: 1px solid var(--border-200);
  border-radius: 10px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  z-index: 100;
  min-width: 240px;
  max-height: 320px;
  overflow-y: auto;
  padding: 4px;
}

.skills-options::-webkit-scrollbar {
  width: 4px;
}

.skills-options::-webkit-scrollbar-thumb {
  background-color: var(--border-200);
  border-radius: 10px;
}

.skills-loading,
.skills-empty {
  padding: 12px 16px;
  font-size: 12px;
  color: var(--text-400);
  text-align: center;
}

.skill-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 100%;
  padding: 8px 12px;
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  text-align: left;
  transition: background 0.15s;
}

.skill-item:hover {
  background: var(--bg-100);
}

.skill-name {
  font-size: 12px;
  font-weight: 700;
  color: var(--text-100);
}

.skill-desc {
  font-size: 11px;
  color: var(--text-400);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-word;
}

.mode-dropdown {
  position: relative;
}

.mode-trigger {
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

.mode-trigger:hover:not(:disabled) {
  background: var(--bg-200);
}

.mode-trigger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.mode-label {
  font-size: 10px;
  font-weight: bold;
  color: var(--text-300);
  text-transform: uppercase;
  min-width: 40px;
  text-align: center;
}

.mode-options {
  position: absolute;
  bottom: 100%;
  right: 0;
  margin-bottom: 4px;
  background: var(--bg-000);
  border: 1px solid var(--border-200);
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  z-index: 100;
  min-width: 100px;
}

.mode-option {
  display: block;
  width: 100%;
  padding: 8px 12px;
  background: transparent;
  border: none;
  cursor: pointer;
  text-align: left;
  transition: background 0.15s;
  color: var(--text-200);
}

.mode-option:hover {
  background: var(--bg-100);
}

.mode-option.active {
  background: var(--bg-200);
  color: var(--accent-brand);
}

.mode-option-label {
  font-size: 12px;
  font-weight: bold;
  text-transform: uppercase;
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
