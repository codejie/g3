<template>
  <div class="workspace-sidebar" :style="{ width: collapsed ? '40px' : '300px' }">
    <!-- Toggle Button (Left edge when expanded) -->
    <button
      v-if="!collapsed"
      @click="$emit('toggle')"
      class="toggle-btn"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <polyline points="9 18 15 12 9 6"/>
      </svg>
    </button>

    <!-- Collapsed State - Expand Button with Vertical Title -->
    <div v-if="collapsed" class="collapsed-bar">
      <button @click="$emit('toggle')" class="expand-btn">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
      </button>
      <div class="vertical-title">工作空间</div>
    </div>

    <div v-if="!collapsed" class="sidebar-content">
      <!-- Header -->
      <div class="sidebar-header">
        <span class="sidebar-title">工作空间</span>
        <div class="header-actions">
          <button v-if="projectId" class="action-btn" @click="refreshFiles" title="刷新">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
          </button>
          <button class="collapse-btn" @click="$emit('toggle')">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        </div>
      </div>

  <!-- Path Label -->
  <div class="path-label">
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
    <span>{{ props.currentPath || '/' }}</span>
  </div>

  <!-- File Browser -->
  <div class="file-browser">
        <!-- No project selected -->
        <div v-if="!projectId" class="browser-placeholder">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
          <span>请先选择项目</span>
        </div>

        <!-- Loading -->
        <div v-else-if="loading" class="browser-loading">
          <div class="waiting-dots">
            <span class="dot"></span>
            <span class="dot"></span>
            <span class="dot"></span>
          </div>
        </div>

        <!-- Empty directory -->
        <div v-else-if="fileTree.length === 0" class="browser-placeholder">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
          <span>目录为空</span>
        </div>

        <!-- File Tree -->
        <div v-else class="file-tree">
          <FileTreeNode
            v-for="node in fileTree"
            :key="node.name"
            :node="node"
            :depth="0"
            :projectId="projectId"
            @navigate="handleNavigate"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { fileApi, setConfig as setExtConfig, setAuthToken } from '../../apis/extension/api';
import { useUserStore } from '../../store/userStore';
import type { FileNode } from '../../apis/extension/types/file';
import FileTreeNode from './FileTreeNode.vue';

interface TreeNode extends FileNode {
  children?: TreeNode[];
  loading?: boolean;
}

interface Props {
  collapsed: boolean;
  projectId: string | null;
  currentPath?: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'toggle'): void;
  (e: 'navigate', path: string): void;
  (e: 'pathChange', path: string): void;
}>();

const userStore = useUserStore();
const fileTree = ref<TreeNode[]>([]);
const loading = ref(false);

const initExtApi = () => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  if (backendUrl) setExtConfig({ baseURL: backendUrl });
  const token = userStore.token;
  if (token) setAuthToken(token);
};

const fetchFiles = async (path?: string): Promise<TreeNode[]> => {
  if (!props.projectId) return [];
  initExtApi();
  try {
    const response = await fileApi.getFiles({
      project_id: props.projectId,
      path,
    });
    if (response.code === 0 && response.data) {
      const items = (response.data as any).items || [];
      return items.map((item: FileNode) => ({
        ...item,
        children: item.type === 'directory' ? [] : undefined,
        loading: false,
      }));
    }
    return [];
  } catch (error) {
    console.error('[Workspace] Failed to fetch files:', error);
    return [];
  }
};

const loadRootFiles = async () => {
  if (!props.projectId) {
    fileTree.value = [];
    return;
  }
  loading.value = true;
  try {
    fileTree.value = await fetchFiles();
  } finally {
    loading.value = false;
  }
};

const refreshFiles = () => {
  fileTree.value = [];
  loadRootFiles();
};

const handleNavigate = (path: string) => {
  emit('pathChange', `/${path}`);
};

watch(() => props.projectId, (newId) => {
  if (newId) {
    loadRootFiles();
  } else {
    fileTree.value = [];
  }
}, { immediate: true });
</script>

<style scoped>
.workspace-sidebar {
  position: relative;
  height: 100%;
  border-left: 1px solid var(--border-100);
  background: var(--bg-000);
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease-in-out;
  overflow: hidden;
}

.toggle-btn {
  position: absolute;
  top: 80px;
  left: -16px;
  z-index: 40;
  width: 16px;
  height: 64px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--bg-000);
  border: 1px solid var(--border-100);
  border-radius: 8px 0 0 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  cursor: pointer;
  transition: all 0.2s;
}

.toggle-btn:hover {
  background: var(--bg-100);
}

.toggle-btn svg {
  color: var(--text-400);
  transition: color 0.2s;
}

.toggle-btn:hover svg {
  color: var(--accent-brand);
}

.collapsed-bar {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 16px;
}

.expand-btn {
  padding: 8px;
  border-radius: 6px;
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--text-400);
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.expand-btn:hover {
  background: var(--bg-100);
  color: var(--accent-brand);
}

.vertical-title {
  writing-mode: vertical-rl;
  text-orientation: mixed;
  font-weight: bold;
  font-size: 12px;
  color: var(--text-400);
  margin-top: 16px;
  letter-spacing: 2px;
  cursor: pointer;
  transition: color 0.2s;
}

.vertical-title:hover {
  color: var(--accent-brand);
}

.sidebar-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 300px;
  animation: fadeIn 0.3s ease;
}

.sidebar-header {
  height: 56px;
  padding: 16px;
  border-bottom: 1px solid var(--border-100);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.sidebar-title {
  font-weight: bold;
  color: var(--text-100);
  font-size: 14px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.action-btn {
  padding: 6px;
  border-radius: 6px;
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--text-400);
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-btn:hover {
  background: var(--bg-100);
  color: var(--accent-brand);
}

.collapse-btn {
  padding: 6px;
  border-radius: 6px;
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--text-400);
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.collapse-btn:hover {
  background: var(--bg-100);
  color: var(--accent-brand);
}

.file-browser {
  flex: 1;
  overflow: auto;
  padding: 8px 0;
}

.path-label {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-top: 1px solid var(--border-100);
  border-bottom: 1px solid var(--border-100);
  font-size: 12px;
  color: var(--text-400);
  font-family: ui-monospace, 'SFMono-Regular', 'SF Mono', Menlo, Consolas, monospace;
  background: var(--bg-100);
  flex-shrink: 0;
}

.path-label svg {
  flex-shrink: 0;
  color: var(--text-500);
}

.path-label span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.browser-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-400);
  gap: 12px;
}

.browser-placeholder span {
  font-size: 14px;
}

.browser-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 80px;
}

.waiting-dots {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 0;
}

.waiting-dots .dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent-brand);
  animation: dotPulse 1.4s ease-in-out infinite;
}

.waiting-dots .dot:nth-child(1) { animation-delay: 0s; }
.waiting-dots .dot:nth-child(2) { animation-delay: 0.2s; }
.waiting-dots .dot:nth-child(3) { animation-delay: 0.4s; }

.file-tree {
  font-size: 13px;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
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
</style>
