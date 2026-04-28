<template>
  <div class="tree-node">
    <div
      class="node-row"
      :style="{ paddingLeft: `${depth * 16 + 8}px` }"
      @click="handleClick"
    >
      <!-- Expand/collapse arrow for directories -->
      <span class="node-arrow" v-if="node.type === 'directory'">
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
          :class="{ rotated: expanded }"
          class="arrow-icon"
        >
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </span>
      <span class="node-arrow placeholder" v-else></span>

      <!-- Icon -->
      <span class="node-icon">
        <svg v-if="node.type === 'directory'" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><polyline points="14 2 14 8 20 8"/></svg>
      </span>

      <!-- Name -->
      <span class="node-name" :title="node.name">{{ node.name }}</span>

      <!-- Size for files -->
      <span v-if="node.type === 'file' && node.size > 0" class="node-size">{{ formatSize(node.size) }}</span>

      <!-- Action buttons -->
      <span class="node-actions">
        <button
          v-if="node.type === 'directory'"
          class="node-action-btn"
          title="进入目录"
          @click.stop="handleEnter"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
        <button
          class="node-action-btn"
          :class="{ active: downloading }"
          title="下载"
          @click.stop="handleDownload"
        >
          <svg v-if="!downloading" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
        </button>
      </span>
    </div>

    <!-- Children for directories -->
    <div v-if="node.type === 'directory' && expanded" class="node-children">
      <div v-if="node.loading" class="children-loading">
        <div class="waiting-dots">
          <span class="dot"></span>
          <span class="dot"></span>
          <span class="dot"></span>
        </div>
      </div>
        <FileTreeNode
          v-else
          v-for="child in node.children"
          :key="child.name"
          :node="child"
          :depth="depth + 1"
          :projectId="projectId"
          :parentPath="currentPath"
          @navigate="$emit('navigate', $event)"
          @preview="(path, name, size) => $emit('preview', path, name, size)"
        />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { fileApi, setConfig as setExtConfig, setAuthToken } from '../../apis/extension/api';
import { useUserStore } from '../../store/userStore';
import { ElMessageBox, ElMessage } from 'element-plus';
import type { FileNode } from '../../apis/extension/types/file';

interface TreeNode extends FileNode {
  children?: TreeNode[];
  loading?: boolean;
}

interface Props {
  node: TreeNode;
  depth: number;
  projectId: string;
  parentPath?: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'navigate', path: string): void;
  (e: 'preview', path: string, name: string, size: number): void;
}>();

const userStore = useUserStore();
const expanded = ref(false);

const currentPath = computed(() => {
  if (props.parentPath) {
    return `${props.parentPath}/${props.node.name}`;
  }
  return props.node.name;
});

const initExtApi = () => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  if (backendUrl) setExtConfig({ baseURL: backendUrl });
  const token = userStore.token;
  if (token) setAuthToken(token);
};

const handleClick = async () => {
  if (props.node.type === 'directory') {
    expanded.value = !expanded.value;
    if (expanded.value && props.node.children && props.node.children.length === 0 && !props.node.loading) {
      await loadChildren();
    }
  } else {
    emit('preview', currentPath.value, props.node.name, props.node.size);
  }
};

const loadChildren = async () => {
  if (!props.node.children) return;
  props.node.loading = true;
  initExtApi();
  try {
    const response = await fileApi.getFiles({
      project_id: props.projectId,
      path: currentPath.value,
    });
    if (response.code === 0 && response.data) {
      const items = (response.data as any).items || [];
      props.node.children = items.map((item: FileNode) => ({
        ...item,
        children: item.type === 'directory' ? [] : undefined,
        loading: false,
      }));
    }
  } catch (error) {
    console.error('[FileTreeNode] Failed to load children:', error);
  } finally {
    props.node.loading = false;
  }
};

const handleEnter = () => {
  if (props.node.type === 'directory') {
    emit('navigate', currentPath.value);
  }
};

const downloading = ref(false);

const handleDownload = async () => {
  if (downloading.value) return;

  const typeLabel = props.node.type === 'directory' ? '目录' : '文件';
  const hint = props.node.type === 'directory' ? '\n目录将打包为 .tar.gz 后下载' : '';

  try {
    await ElMessageBox.confirm(
      `确认下载${typeLabel} "${props.node.name}" 吗？${hint}`,
      '下载确认',
      { confirmButtonText: '下载', cancelButtonText: '取消', type: 'info' }
    );
  } catch {
    return;
  }

  downloading.value = true;
  initExtApi();
  try {
    const fallback = props.node.type === 'directory' ? `${props.node.name}.tar.gz` : props.node.name;
    const { blob, filename } = await fileApi.download({ project_id: props.projectId, path: currentPath.value }, fallback);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || props.node.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    ElMessage.success(`"${filename}" 下载成功`);
  } catch (error: any) {
    ElMessage.error(error.message || '下载失败');
  } finally {
    downloading.value = false;
  }
};

const formatSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
</script>

<style scoped>
.tree-node {
  user-select: none;
}

.node-row {
  display: flex;
  align-items: center;
  gap: 4px;
  height: 28px;
  cursor: pointer;
  color: var(--text-200);
  transition: background 0.15s;
  padding-right: 8px;
  white-space: nowrap;
}

.node-row:hover {
  background: var(--bg-100);
}

.node-arrow {
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.node-arrow.placeholder {
  visibility: hidden;
}

.arrow-icon {
  transition: transform 0.2s;
  color: var(--text-400);
}

.arrow-icon.rotated {
  transform: rotate(90deg);
}

.node-icon {
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: var(--text-400);
}

.node-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 13px;
  line-height: 28px;
}

.node-size {
  font-size: 11px;
  color: var(--text-500);
  flex-shrink: 0;
  margin-left: auto;
  padding-left: 8px;
}

.node-actions {
  display: none;
  align-items: center;
  gap: 2px;
  margin-left: auto;
  flex-shrink: 0;
}

.node-row:hover .node-actions {
  display: flex;
}

.node-row:hover .node-size {
  display: none;
}

.node-action-btn {
  width: 22px;
  height: 22px;
  border-radius: 4px;
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-400);
  transition: all 0.15s;
}

.node-action-btn:hover {
  background: var(--bg-200);
  color: var(--accent-brand);
}

.node-children {
  animation: fadeIn 0.15s ease;
}

.children-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 0;
}

.waiting-dots {
  display: flex;
  align-items: center;
  gap: 3px;
}

.waiting-dots .dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--accent-brand);
  animation: dotPulse 1.4s ease-in-out infinite;
}

.waiting-dots .dot:nth-child(1) { animation-delay: 0s; }
.waiting-dots .dot:nth-child(2) { animation-delay: 0.2s; }
.waiting-dots .dot:nth-child(3) { animation-delay: 0.4s; }

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

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
