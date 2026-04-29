<template>
<div class="workspace-sidebar" :style="{ width: collapsed ? '40px' : sidebarWidth + 'px' }">
<!-- Resize Handle (Left edge when expanded) -->
<div
  v-if="!collapsed"
  class="resize-handle"
@mousedown="startSidebarResize"
></div>
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
    <span>{{ currentFullPath }}</span>
    <button v-if="pathStack.length > 1" class="action-btn back-btn" @click="handleGoBack" title="返回上一级">
      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
    </button>
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
          @preview="handlePreview"
        />
      </div>
    </div>

    <!-- Preview Panel -->
    <div
      v-if="preview.visible"
      class="preview-panel"
      :style="{ height: preview.height + 'px' }"
      @click.stop
    >
      <div class="preview-header">
        <span class="preview-filename">{{ preview.name }}</span>
        <span v-if="preview.language" class="preview-lang">{{ preview.language }}</span>
        <span v-else-if="preview.fileType === 'image'" class="preview-lang">image</span>
        <span v-else-if="preview.fileType === 'binary'" class="preview-lang">binary</span>
        <button class="preview-close" @click="closePreview">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div class="preview-resize-handle" @mousedown="startResize"></div>
      <div v-if="preview.loading" class="preview-loading">
        <div class="waiting-dots">
          <span class="dot"></span>
          <span class="dot"></span>
          <span class="dot"></span>
        </div>
      </div>
      <div v-else-if="preview.error" class="preview-error">{{ preview.error }}</div>
      <template v-else>
        <!-- Image preview -->
        <div v-if="preview.fileType === 'image' && preview.content" class="preview-image-wrap">
          <img :src="`data:${preview.mimeType};base64,${preview.content}`" :alt="preview.name" class="preview-image" />
        </div>
        <!-- Binary file -->
        <div v-else-if="preview.fileType === 'binary'" class="preview-binary">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><polyline points="14 2 14 8 20 8"/></svg>
          <span>二进制文件，无法预览</span>
        </div>
        <!-- Markdown rendered -->
        <div v-else-if="preview.language === 'markdown' && preview.content" class="preview-markdown" v-html="renderMarkdown(preview.content)"></div>
        <!-- HTML rendered in sandboxed iframe -->
        <div v-else-if="preview.language === 'html' && preview.content" class="preview-html-wrap">
          <iframe class="preview-html" :srcdoc="preview.content" sandbox="allow-scripts allow-same-origin" title="HTML Preview"></iframe>
        </div>
        <!-- Code / plain text -->
        <pre v-else class="preview-code"><code>{{ preview.content }}</code></pre>
      </template>
    </div>
  </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, reactive, computed, onMounted, onUnmounted } from 'vue';
import { fileApi, setConfig as setExtConfig, setAuthToken } from '../../apis/extension/api';
import { useUserStore } from '../../store/userStore';
import type { FileNode } from '../../apis/extension/types/file';
import { renderMarkdown } from '../../utils/markdownUtils';
import FileTreeNode from './FileTreeNode.vue';

interface TreeNode extends FileNode {
  children?: TreeNode[];
  loading?: boolean;
}

interface Props {
  collapsed: boolean;
  projectId: string | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'toggle'): void;
}>();

const userStore = useUserStore();
const fileTree = ref<TreeNode[]>([]);
const loading = ref(false);
const sidebarWidth = ref(300);
let sidebarResizing = false;
let sidebarResizeStartX = 0;
let sidebarResizeStartWidth = 0;

const MIN_WIDTH = 300;

const startSidebarResize = (e: MouseEvent) => {
  e.preventDefault();
  sidebarResizing = true;
  sidebarResizeStartX = e.clientX;
  sidebarResizeStartWidth = sidebarWidth.value;
  document.addEventListener('mousemove', onSidebarResizeMove);
  document.addEventListener('mouseup', onSidebarResizeUp);
  document.body.style.cursor = 'col-resize';
  document.body.style.userSelect = 'none';
};

const onSidebarResizeMove = (e: MouseEvent) => {
  if (!sidebarResizing) return;
  const maxWidth = Math.floor(window.innerWidth / 2);
  const delta = sidebarResizeStartX - e.clientX;
  sidebarWidth.value = Math.max(MIN_WIDTH, Math.min(maxWidth, sidebarResizeStartWidth + delta));
};

const onSidebarResizeUp = () => {
  sidebarResizing = false;
  document.removeEventListener('mousemove', onSidebarResizeMove);
  document.removeEventListener('mouseup', onSidebarResizeUp);
  document.body.style.cursor = '';
  document.body.style.userSelect = '';
};
const pathStack = ref<string[]>(['/']);
const currentFullPath = computed(() => pathStack.value[pathStack.value.length - 1]);

const preview = reactive({
  visible: false,
  loading: false,
  name: '',
  path: '',
  content: '',
  language: '',
  fileType: 'text' as 'text' | 'image' | 'binary',
  mimeType: '',
  error: '',
  height: 0,
});

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
    const path = currentFullPath.value === '/' ? undefined : currentFullPath.value.slice(1);
    fileTree.value = await fetchFiles(path);
  } finally {
    loading.value = false;
  }
};

const refreshFiles = () => {
  fileTree.value = [];
  loadRootFiles();
};

const handleNavigate = (path: string) => {
  const newPath = currentFullPath.value === '/' ? `/${path}` : `${currentFullPath.value}/${path}`;
  pathStack.value = [...pathStack.value, newPath];
  loadRootFiles();
};

const handleGoBack = () => {
  if (pathStack.value.length > 1) {
    pathStack.value = pathStack.value.slice(0, -1);
    loadRootFiles();
  }
};

const handlePreview = async (path: string, name: string, size: number) => {
  const fullPath = currentFullPath.value === '/' ? path : `${currentFullPath.value.slice(1)}/${path}`;
  if (size > 10 * 1024) {
    preview.visible = true;
    preview.loading = false;
    preview.name = name;
    preview.path = fullPath;
    preview.content = '';
    preview.language = '';
    preview.fileType = 'text';
    preview.mimeType = '';
    preview.error = '文件超过 10KB，无法预览';
    preview.height = 120;
    return;
  }

  preview.visible = true;
  preview.loading = true;
  preview.name = name;
  preview.path = fullPath;
  preview.content = '';
  preview.language = '';
  preview.fileType = 'text';
  preview.mimeType = '';
  preview.error = '';
  preview.height = getHalfPreviewHeight();

  if (!props.projectId) {
    preview.error = '未选择项目';
    preview.loading = false;
    return;
  }
  initExtApi();

  try {
    const response = await fileApi.readFile({
      project_id: props.projectId,
      path: fullPath,
    });
    if (response.code === 0 && response.data) {
      const data = response.data as any;
      preview.content = data.content || '';
      preview.language = data.language || '';
      preview.fileType = data.fileType || 'text';
      preview.mimeType = data.mimeType || '';
    } else {
      preview.error = (response as any).message || '读取文件失败';
    }
  } catch (error: any) {
    preview.error = error.message || '读取文件失败';
  } finally {
    preview.loading = false;
  }
};

const closePreview = () => {
  preview.visible = false;
};

const getHalfPreviewHeight = () => {
  const el = document.querySelector('.workspace-sidebar');
  if (el) {
    return Math.floor(el.clientHeight / 2);
  }
  return 300;
};

const getMaxPreviewHeight = () => {
  const el = document.querySelector('.workspace-sidebar');
  if (el) {
    return Math.floor(el.clientHeight * 2 / 3);
  }
  return 400;
};

let resizing = false;
let startY = 0;
let startHeight = 0;

const startResize = (e: MouseEvent) => {
  e.preventDefault();
  resizing = true;
  startY = e.clientY;
  startHeight = preview.height;
  document.addEventListener('mousemove', onResizeMove);
  document.addEventListener('mouseup', onResizeUp);
};

const onResizeMove = (e: MouseEvent) => {
  if (!resizing) return;
  const delta = startY - e.clientY;
  const maxH = getMaxPreviewHeight();
  preview.height = Math.max(120, Math.min(maxH, startHeight + delta));
};

const onResizeUp = () => {
  resizing = false;
  document.removeEventListener('mousemove', onResizeMove);
  document.removeEventListener('mouseup', onResizeUp);
};

const onDocumentClick = (e: MouseEvent) => {
  if (!preview.visible) return;
  const sidebar = document.querySelector('.workspace-sidebar');
  if (sidebar && sidebar.contains(e.target as Node)) return;
  closePreview();
};

onMounted(() => {
  document.addEventListener('click', onDocumentClick);
});

onUnmounted(() => {
  document.removeEventListener('click', onDocumentClick);
  document.removeEventListener('mousemove', onResizeMove);
  document.removeEventListener('mouseup', onResizeUp);
  document.removeEventListener('mousemove', onSidebarResizeMove);
  document.removeEventListener('mouseup', onSidebarResizeUp);
});

watch(() => props.projectId, (newId) => {
  pathStack.value = ['/'];
  if (newId) {
    loadRootFiles();
  } else {
    fileTree.value = [];
  }
  closePreview();
}, { immediate: true });

defineExpose({ refreshFiles });
</script>

<style scoped>
.workspace-sidebar {
  position: relative;
  height: 100%;
  border-left: 1px solid var(--border-100);
  background: var(--bg-000);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.resize-handle {
  position: absolute;
  top: 0;
  left: -4px;
  width: 8px;
  height: 100%;
  cursor: col-resize;
  z-index: 50;
}

.resize-handle:hover {
  background: var(--accent-brand);
  opacity: 0.15;
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
  min-height: 0;
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
  min-height: 0;
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
  flex: 1;
  min-width: 0;
}

.back-btn {
  flex-shrink: 0;
  margin-left: auto;
  color: var(--accent-brand);
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

.preview-panel {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  border-top: 1px solid var(--border-200);
  background: var(--bg-000);
  animation: slideUp 0.25s ease;
  overflow: hidden;
}

@keyframes slideUp {
  from {
    max-height: 0;
    opacity: 0;
  }
  to {
    max-height: 600px;
    opacity: 1;
  }
}

.preview-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--border-100);
  background: var(--bg-100);
  flex-shrink: 0;
}

.preview-filename {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-100);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.preview-lang {
  font-size: 10px;
  color: var(--text-500);
  background: var(--bg-200);
  padding: 2px 6px;
  border-radius: 4px;
  flex-shrink: 0;
}

.preview-close {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-400);
  transition: all 0.15s;
  flex-shrink: 0;
}

.preview-close:hover {
  background: var(--bg-200);
  color: var(--text-200);
}

.preview-resize-handle {
  height: 4px;
  cursor: ns-resize;
  background: transparent;
  position: relative;
  flex-shrink: 0;
}

.preview-resize-handle:hover {
  background: var(--accent-brand);
  opacity: 0.3;
}

.preview-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 0;
}

.preview-error {
  padding: 12px;
  font-size: 12px;
  color: var(--text-500);
  text-align: center;
}

.preview-html-wrap {
  flex: 1;
  overflow: hidden;
  display: flex;
}

.preview-html {
  flex: 1;
  border: none;
  width: 100%;
  height: 100%;
  background: #fff;
}

.preview-code {
  flex: 1;
  overflow: auto;
  margin: 0;
  padding: 8px 12px;
  font-size: 12px;
  line-height: 1.5;
  font-family: ui-monospace, 'SFMono-Regular', 'SF Mono', Menlo, Consolas, monospace;
  color: var(--text-200);
  background: var(--bg-000);
  white-space: pre-wrap;
  word-break: break-all;
}

.preview-code code {
  font-family: inherit;
}

.preview-image-wrap {
  flex: 1;
  overflow: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  background: var(--bg-100);
}

.preview-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 4px;
}

.preview-binary {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--text-500);
  font-size: 12px;
}

.preview-markdown {
  flex: 1;
  overflow: auto;
  padding: 12px;
  font-size: 13px;
  line-height: 1.6;
  color: var(--text-200);
}

.preview-markdown :deep(h1) {
  font-size: 1.4em;
  font-weight: 700;
  margin: 0.6em 0 0.3em;
  color: var(--text-100);
  border-bottom: 1px solid var(--border-100);
  padding-bottom: 0.2em;
}

.preview-markdown :deep(h2) {
  font-size: 1.2em;
  font-weight: 700;
  margin: 0.5em 0 0.2em;
  color: var(--text-100);
}

.preview-markdown :deep(h3) {
  font-size: 1.1em;
  font-weight: 600;
  margin: 0.4em 0 0.2em;
  color: var(--text-100);
}

.preview-markdown :deep(p) {
  margin: 0.4em 0;
}

.preview-markdown :deep(pre) {
  background: var(--bg-200);
  border-radius: 6px;
  padding: 8px 12px;
  overflow-x: auto;
  font-size: 12px;
  margin: 0.5em 0;
}

.preview-markdown :deep(code) {
  font-family: ui-monospace, 'SFMono-Regular', 'SF Mono', Menlo, Consolas, monospace;
  font-size: 0.9em;
  background: var(--bg-200);
  padding: 1px 4px;
  border-radius: 3px;
}

.preview-markdown :deep(pre code) {
  background: none;
  padding: 0;
}

.preview-markdown :deep(ul), .preview-markdown :deep(ol) {
  padding-left: 1.5em;
  margin: 0.3em 0;
}

.preview-markdown :deep(li) {
  margin: 0.15em 0;
}

.preview-markdown :deep(blockquote) {
  border-left: 3px solid var(--accent-brand);
  padding-left: 12px;
  margin: 0.5em 0;
  color: var(--text-400);
}

.preview-markdown :deep(a) {
  color: var(--accent-brand);
  text-decoration: none;
}

.preview-markdown :deep(a:hover) {
  text-decoration: underline;
}

.preview-markdown :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 0.5em 0;
  font-size: 12px;
}

.preview-markdown :deep(th), .preview-markdown :deep(td) {
  border: 1px solid var(--border-200);
  padding: 4px 8px;
  text-align: left;
}

.preview-markdown :deep(th) {
  background: var(--bg-100);
  font-weight: 600;
}

.preview-markdown :deep(img) {
  max-width: 100%;
  border-radius: 4px;
}

.preview-markdown :deep(hr) {
  border: none;
  border-top: 1px solid var(--border-200);
  margin: 0.8em 0;
}
</style>
