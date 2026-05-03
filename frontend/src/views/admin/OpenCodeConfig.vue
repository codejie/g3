<template>
  <div class="opencode-config">
    <div class="config-card">
      <div class="config-header">
        <h3>{{ $t('opencodeConfig.title') }}</h3>
        <div class="header-actions">
          <button class="action-btn danger" :disabled="restarting" @click="restartOpencode">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18.36 6.64A9 9 0 1 1 5.64 18.36"/><path d="M18.36 6.64A9 9 0 0 1 19.73 12"/><path d="M12 2v4"/><path d="M2 12h4"/><path d="M12 22v-4"/><path d="M22 12h-4"/></svg>
            <span v-if="!restarting">{{ $t('opencodeConfig.restartOpencode') }}</span>
            <span v-else>{{ $t('opencodeConfig.restarting') }}</span>
          </button>
          <button class="action-btn refresh" :disabled="loading" @click="loadConfig(activeTab)">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
            <span>{{ $t('opencodeConfig.refresh') }}</span>
          </button>
          <button class="action-btn save" :disabled="saving || !hasChanges" @click="saveConfig">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
            <span v-if="!saving">{{ $t('opencodeConfig.save') }}</span>
            <span v-else>{{ $t('opencodeConfig.saving') }}</span>
          </button>
          <button class="action-btn download" :disabled="loading" @click="downloadConfig">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            <span>{{ $t('opencodeConfig.download') }}</span>
          </button>
          <button class="action-btn upload" :disabled="uploading" @click="triggerUpload">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            <span v-if="!uploading">{{ $t('opencodeConfig.upload') }}</span>
            <span v-else>{{ $t('opencodeConfig.uploading') }}</span>
          </button>
          <input ref="fileInputRef" type="file" accept=".json,application/json" class="hidden-input" @change="handleFileUpload" />
        </div>
      </div>

      <div class="tab-bar">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          class="tab-btn"
          :class="{ active: activeTab === tab.key }"
          @click="switchTab(tab.key)"
        >
          <span class="tab-name">{{ tab.label }}</span>
          <span v-if="isTabModified(tab.key)" class="tab-modified-dot"></span>
        </button>
      </div>

      <div class="editor-area">
        <div v-if="loading" class="editor-placeholder">
          <el-icon class="is-loading" :size="20"><Loading /></el-icon>
          <span>{{ $t('opencodeConfig.loading') }}</span>
        </div>
        <div v-else-if="loadError" class="editor-placeholder error">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <span>{{ $t('opencodeConfig.loadFailed') }}</span>
          <button class="retry-btn" @click="loadConfig(activeTab)">{{ $t('opencodeConfig.retry') }}</button>
        </div>
        <textarea
          v-else
          ref="editorRef"
          v-model="editContent"
          class="json-editor"
          spellcheck="false"
          @keydown.tab.prevent="handleTab"
        />
      </div>

      <div class="editor-footer">
        <span class="file-name">{{ activeTab }}</span>
        <span v-if="hasChanges" class="modified-badge">{{ $t('opencodeConfig.modified') }}</span>
        <span v-if="jsonError" class="json-error">{{ jsonError }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { Loading } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { fileApi, setConfig as setExtensionConfig, setAuthToken } from '../../apis/extension/api'
import { systemApi } from '../../apis/extension/api'
import { useUserStore } from '../../store/userStore'
import { useRestartAlertStore } from '../../store/restartAlertStore'

const { t: $t } = useI18n()
const userStore = useUserStore()
const restartAlertStore = useRestartAlertStore()

const backendURL = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:3001/api/'

const ensureExtensionConfig = () => {
  setExtensionConfig({ baseURL: backendURL })
  if (userStore.token) setAuthToken(userStore.token)
}

const tabs = computed(() => [
  { key: 'opencode.json', label: 'opencode.json' },
  { key: 'config.json', label: 'config.json' },
])

const activeTab = ref('opencode.json')
const originalContent = ref('')
const editContent = ref('')
const loading = ref(false)
const loadError = ref(false)
const saving = ref(false)
const uploading = ref(false)
const restarting = ref(false)
const fileInputRef = ref<HTMLInputElement>()
const editorRef = ref<HTMLTextAreaElement>()

const dirtyMap = ref<Record<string, boolean>>({})

const hasChanges = computed(() => editContent.value !== originalContent.value)

const jsonError = computed(() => {
  if (!editContent.value.trim()) return null
  try {
    JSON.parse(editContent.value)
    return null
  } catch (e: any) {
    return e.message
  }
})

const isTabModified = (tabKey: string) => !!dirtyMap.value[tabKey]

const loadConfig = async (name: string) => {
  loading.value = true
  loadError.value = false
  ensureExtensionConfig()
  try {
    const res = await fileApi.readOpencodeConfig({ name })
    if (res.code === 0 && res.data) {
      originalContent.value = res.data.content || ''
      editContent.value = originalContent.value
      dirtyMap.value[name] = false
    } else {
      loadError.value = true
    }
  } catch {
    loadError.value = true
  } finally {
    loading.value = false
  }
}

const switchTab = (key: string) => {
  if (activeTab.value === key) return
  dirtyMap.value[activeTab.value] = hasChanges.value
  activeTab.value = key
  loadConfig(key)
}

const saveConfig = async () => {
  if (jsonError.value) {
    ElMessage.warning($t('opencodeConfig.invalidJson'))
    return
  }
  try {
    await ElMessageBox.confirm(
      $t('opencodeConfig.saveConfirm', { name: activeTab.value }),
      $t('opencodeConfig.saveTitle'),
      { type: 'warning' }
    )
  } catch {
    return
  }
  saving.value = true
  ensureExtensionConfig()
  try {
    const res = await fileApi.saveOpencodeConfig({ name: activeTab.value, content: editContent.value })
    if (res.code === 0) {
      originalContent.value = editContent.value
      dirtyMap.value[activeTab.value] = false
      ElMessage.success($t('opencodeConfig.saveSuccess'))
    } else {
      ElMessage.error($t('opencodeConfig.saveFailed'))
    }
  } catch {
    ElMessage.error($t('opencodeConfig.saveFailed'))
  } finally {
    saving.value = false
  }
}

const downloadConfig = async () => {
  ensureExtensionConfig()
  try {
    const { blob, filename } = await fileApi.downloadOpencodeConfig({ name: activeTab.value }, activeTab.value)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  } catch {
    ElMessage.error($t('opencodeConfig.downloadFailed'))
  }
}

const restartOpencode = async () => {
  try {
    await ElMessageBox.confirm(
      $t('opencodeConfig.restartConfirm'),
      $t('opencodeConfig.restartTitle'),
      {
        confirmButtonText: $t('opencodeConfig.restartConfirmBtn'),
        cancelButtonText: $t('opencodeConfig.restartCancelBtn'),
        type: 'error',
      }
    )
  } catch {
    return
  }
  restarting.value = true
  ensureExtensionConfig()
  try {
    const res = await systemApi.executeScript({ name: 'restart_opencode' })
    if (res.code === 0) {
      restartAlertStore.clearAll()
      ElMessage.success($t('opencodeConfig.restartSuccess'))
    } else {
      ElMessage.error(res.message || $t('opencodeConfig.restartFailed'))
    }
  } catch {
    ElMessage.error($t('opencodeConfig.restartFailed'))
  } finally {
    restarting.value = false
  }
}

const triggerUpload = async () => {
  try {
    await ElMessageBox.confirm(
      $t('opencodeConfig.uploadConfirm', { name: activeTab.value }),
      $t('opencodeConfig.uploadTitle'),
      { type: 'warning' }
    )
  } catch {
    return
  }
  fileInputRef.value?.click()
}

const handleFileUpload = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  if (!file.name.endsWith('.json')) {
    ElMessage.warning($t('opencodeConfig.unsupportedFileType'))
    input.value = ''
    return
  }

  uploading.value = true
  ensureExtensionConfig()
  try {
    const res = await fileApi.uploadOpencodeConfig(file, activeTab.value, backendURL, userStore.token)
    if (res.code === 0) {
      ElMessage.success($t('opencodeConfig.uploadSuccess'))
      await loadConfig(activeTab.value)
    } else {
      ElMessage.error($t('opencodeConfig.uploadFailed'))
    }
  } catch {
    ElMessage.error($t('opencodeConfig.uploadFailed'))
  } finally {
    uploading.value = false
    input.value = ''
  }
}

const handleTab = () => {
  const textarea = editorRef.value
  if (!textarea) return
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  editContent.value = editContent.value.substring(0, start) + '  ' + editContent.value.substring(end)
  requestAnimationFrame(() => {
    textarea.selectionStart = textarea.selectionEnd = start + 2
  })
}

watch(hasChanges, (val) => {
  dirtyMap.value[activeTab.value] = val
})

onMounted(() => {
  loadConfig(activeTab.value)
})
</script>

<style scoped>
.opencode-config {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  animation: fadeIn 0.3s ease;
}

.config-card {
  background: var(--bg-000);
  border: 1px solid var(--border-100);
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.config-header {
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-100);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-shrink: 0;
}

.config-header h3 {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-100);
  margin: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid var(--border-200);
  background: var(--bg-000);
  color: var(--text-200);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover:not(:disabled) {
  background: var(--bg-100);
  border-color: var(--border-300);
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-btn.save {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.action-btn.save:hover:not(:disabled) {
  background: #2563eb;
}

.action-btn.danger {
  background: #ef4444;
  color: white;
  border-color: #ef4444;
}

.action-btn.danger:hover:not(:disabled) {
  background: #dc2626;
  border-color: #dc2626;
}

.tab-bar {
  display: flex;
  gap: 0;
  border-bottom: 1px solid var(--border-100);
  padding: 0 20px;
  flex-shrink: 0;
}

.tab-btn {
  position: relative;
  padding: 10px 20px;
  border: none;
  background: transparent;
  color: var(--text-400);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: color 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
}

.tab-btn:hover {
  color: var(--text-200);
}

.tab-btn.active {
  color: #3b82f6;
}

.tab-btn.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: #3b82f6;
  border-radius: 1px 1px 0 0;
}

.tab-modified-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #f59e0b;
  flex-shrink: 0;
}

.editor-area {
  flex: 1;
  min-height: 0;
  position: relative;
}

.json-editor {
  width: 100%;
  height: 100%;
  padding: 16px 20px;
  border: none;
  outline: none;
  resize: none;
  background: var(--bg-100);
  color: var(--text-100);
  font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', 'JetBrains Mono', Menlo, Monaco, 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.6;
  tab-size: 2;
}

.editor-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 100%;
  min-height: 120px;
  color: var(--text-400);
  font-size: 14px;
}

.editor-placeholder.error {
  color: #ef4444;
}

.retry-btn {
  margin-top: 8px;
  padding: 6px 16px;
  border-radius: 8px;
  border: 1px solid var(--border-200);
  background: var(--bg-000);
  color: var(--text-200);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.retry-btn:hover {
  background: var(--bg-100);
}

.editor-footer {
  padding: 8px 20px;
  border-top: 1px solid var(--border-100);
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.file-name {
  font-size: 12px;
  color: var(--text-400);
  font-family: 'SF Mono', 'Fira Code', Menlo, monospace;
}

.modified-badge {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
  font-weight: 500;
}

.json-error {
  font-size: 11px;
  color: #ef4444;
  max-width: 400px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hidden-input {
  display: none;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>
