<template>
  <div class="session-management">
    <!-- Toolbar: Filters -->
    <div class="toolbar">
      <div class="filter-group">
        <el-select v-model="filters.bound" :placeholder="$t('sessionManagement.filterBound')" size="small" style="width: 130px">
          <el-option :label="$t('sessionManagement.filterAll')" value="all" />
          <el-option :label="$t('sessionManagement.filterBoundOnly')" value="bound" />
          <el-option :label="$t('sessionManagement.filterUnboundOnly')" value="unbound" />
        </el-select>
        <el-input v-model="filters.username" :placeholder="$t('sessionManagement.filterPlaceholder', { field: $t('sessionManagement.filterUsername') })" size="small" clearable style="width: 140px" />
        <el-input v-model="filters.projectName" :placeholder="$t('sessionManagement.filterPlaceholder', { field: $t('sessionManagement.filterProjectName') })" size="small" clearable style="width: 140px" />
        <el-select v-model="filters.projectType" :placeholder="$t('sessionManagement.filterPlaceholder', { field: $t('sessionManagement.filterProjectType') })" size="small" clearable filterable allow-create style="width: 120px">
          <el-option :label="$t('sessionManagement.filterTypeApp')" value="app" />
          <el-option :label="$t('sessionManagement.filterTypeWeb')" value="web" />
          <el-option :label="$t('sessionManagement.filterTypeData')" value="data" />
          <el-option :label="$t('sessionManagement.filterTypeOther')" value="other" />
        </el-select>
        <el-select v-model="filters.projectStatus" :placeholder="$t('sessionManagement.filterPlaceholder', { field: $t('sessionManagement.filterProjectStatus') })" size="small" clearable style="width: 120px">
          <el-option :label="$t('sessionManagement.filterStatusActive')" value="active" />
          <el-option :label="$t('sessionManagement.filterStatusDeleted')" value="deleted" />
        </el-select>
        <el-date-picker v-model="filters.createdRange" type="daterange" size="small" :start-placeholder="$t('sessionManagement.filterCreatedFrom')" :end-placeholder="$t('sessionManagement.filterCreatedTo')" style="width: 220px" />
        <el-date-picker v-model="filters.updatedRange" type="daterange" size="small" :start-placeholder="$t('sessionManagement.filterUpdatedFrom')" :end-placeholder="$t('sessionManagement.filterUpdatedTo')" style="width: 220px" />
        <button class="toolbar-btn" @click="clearFilters">{{ $t('sessionManagement.clearFilter') }}</button>
      </div>
      <div class="toolbar-right">
        <button class="toolbar-btn" @click="fetchSessions">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
          {{ $t('sessionManagement.refresh') }}
        </button>
      </div>
    </div>

    <!-- Batch Actions -->
    <div v-if="selectedIds.length > 0" class="batch-bar">
      <span class="selected-info">{{ $t('sessionManagement.selectedCount', { count: selectedIds.length }) }}</span>
      <el-button type="danger" size="small" :disabled="!canBatchDelete" @click="openBatchDeleteConfirm">{{ $t('sessionManagement.batchDelete') }}</el-button>
      <span v-if="!canBatchDelete" class="batch-hint">{{ $t('sessionManagement.deleteDisabled') }}</span>
    </div>

    <!-- Table -->
    <div class="table-card">
      <div class="table-wrapper">
        <table class="session-table">
          <thead>
            <tr>
              <th class="check-col"><input type="checkbox" :checked="isAllSelected" :indeterminate.prop="isPartialSelected" @change="toggleSelectAll" /></th>
              <th>{{ $t('sessionManagement.sessionId') }}</th>
              <th>{{ $t('sessionManagement.titleCol') }}</th>
              <th>{{ $t('sessionManagement.userName') }}</th>
              <th>{{ $t('sessionManagement.projectName') }}</th>
              <th>{{ $t('sessionManagement.projectType') }}</th>
              <th>{{ $t('sessionManagement.projectStatus') }}</th>
              <th>{{ $t('sessionManagement.created') }}</th>
              <th>{{ $t('sessionManagement.updated') }}</th>
              <th>{{ $t('sessionManagement.actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="10">
                <div class="loading-placeholder">
                  <el-icon class="is-loading" :size="20"><Loading /></el-icon>
                  <span>{{ $t('sessionManagement.loading') }}</span>
                </div>
              </td>
            </tr>
            <tr v-else-if="filteredSessions.length === 0">
              <td colspan="10">
                <div class="empty-placeholder">
                  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
                  <p>{{ $t('sessionManagement.noSessions') }}</p>
                </div>
              </td>
            </tr>
            <tr v-for="item in filteredSessions" :key="item.id" :class="{ selected: selectedIds.includes(item.id) }">
              <td class="check-col"><input type="checkbox" :checked="selectedIds.includes(item.id)" @change="toggleSelect(item.id)" /></td>
              <td><span class="session-id" :title="item.id">{{ shortId(item.id) }}</span></td>
              <td><span class="title-text">{{ item.title || '—' }}</span></td>
              <td><span class="user-text">{{ item.user_name || '—' }}</span></td>
              <td><span class="project-text">{{ item.project_name || '—' }}</span></td>
              <td>
                <span v-if="item.project_type" class="type-badge">{{ formatType(item.project_type) }}</span>
                <span v-else class="no-data">—</span>
              </td>
              <td>
                <span v-if="item.project_status" class="status-badge" :class="item.project_status">{{ formatStatus(item.project_status) }}</span>
                <span v-else class="no-data">—</span>
              </td>
              <td><span class="date-text">{{ formatDate(item.created) }}</span></td>
              <td><span class="date-text">{{ formatDate(item.updated) }}</span></td>
              <td>
                <button class="action-btn delete" :disabled="!!item.project_name" :title="item.project_name ? $t('sessionManagement.deleteDisabled') : ''" @click="openDeleteConfirm(item)">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  {{ $t('sessionManagement.delete') }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Delete Confirm Dialog -->
    <el-dialog v-model="showDeleteDialog" :title="$t('sessionManagement.deleteTitle')" width="440px" :close-on-click-modal="false">
      <p class="delete-msg">{{ $t('sessionManagement.deleteConfirm', { id: deleteTarget?.id }) }}</p>
      <template #footer>
        <el-button @click="showDeleteDialog = false">{{ $t('sessionManagement.cancel') }}</el-button>
        <el-button type="danger" @click="handleDelete">{{ $t('sessionManagement.confirm') }}</el-button>
      </template>
    </el-dialog>

    <!-- Batch Delete Confirm Dialog -->
    <el-dialog v-model="showBatchDeleteDialog" :title="$t('sessionManagement.batchDeleteTitle')" width="440px" :close-on-click-modal="false">
      <p class="delete-msg">{{ $t('sessionManagement.batchDeleteConfirm', { count: deletableSelectedIds.length }) }}</p>
      <template #footer>
        <el-button @click="showBatchDeleteDialog = false">{{ $t('sessionManagement.cancel') }}</el-button>
        <el-button type="danger" @click="handleBatchDelete">{{ $t('sessionManagement.confirm') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import { Loading } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { sessionApi as extSessionApi, setConfig as setExtensionConfig, setAuthToken } from '../../apis/extension/api'
import { sessionApi as opencodeSessionApi, setConfig as setOpenCodeConfig } from '../../apis/opencode/api/request'
import type { SessionItem } from '../../apis/extension/types/session'
import { useUserStore } from '../../store/userStore'
import { getEnv } from '../../utils/runtimeEnv'

const { t: $t } = useI18n()
const userStore = useUserStore()

const backendURL = getEnv('VITE_BACKEND_URL', 'http://127.0.0.1:3001/api/')!
const opencodeURL = getEnv('VITE_OPENCODE_URL', 'http://127.0.0.1:10090')!

const ensureExtensionConfig = () => {
  setExtensionConfig({ baseURL: backendURL })
  if (userStore.token) setAuthToken(userStore.token)
}

const ensureOpenCodeConfig = () => {
  setOpenCodeConfig({ baseURL: opencodeURL })
}

// Data
const sessions = ref<SessionItem[]>([])
const loading = ref(false)
const selectedIds = ref<string[]>([])

// Filters
const filters = reactive({
  bound: 'all' as 'all' | 'bound' | 'unbound',
  username: '',
  projectName: '',
  projectType: '',
  projectStatus: '',
  createdRange: null as [Date, Date] | null,
  updatedRange: null as [Date, Date] | null,
})

const filteredSessions = computed(() => {
  return sessions.value.filter(item => {
    if (filters.bound === 'bound' && !item.project_name) return false
    if (filters.bound === 'unbound' && item.project_name) return false
    if (filters.username && !(item.user_name || '').toLowerCase().includes(filters.username.toLowerCase())) return false
    if (filters.projectName && !(item.project_name || '').toLowerCase().includes(filters.projectName.toLowerCase())) return false
    if (filters.projectType && !(item.project_type || '').toLowerCase().includes(filters.projectType.toLowerCase())) return false
    if (filters.projectStatus && !(item.project_status || '').toLowerCase().includes(filters.projectStatus.toLowerCase())) return false
    if (filters.createdRange) {
      const [from, to] = filters.createdRange
      const itemDate = new Date(item.created * 1000)
      if (itemDate < from || itemDate > new Date(to.getTime() + 86400000)) return false
    }
    if (filters.updatedRange) {
      const [from, to] = filters.updatedRange
      const itemDate = new Date(item.updated * 1000)
      if (itemDate < from || itemDate > new Date(to.getTime() + 86400000)) return false
    }
    return true
  })
})

const clearFilters = () => {
  filters.bound = 'all'
  filters.username = ''
  filters.projectName = ''
  filters.projectType = ''
  filters.projectStatus = ''
  filters.createdRange = null
  filters.updatedRange = null
}

// Selection
const isAllSelected = computed(() => {
  return filteredSessions.value.length > 0 && filteredSessions.value.every(s => selectedIds.value.includes(s.id))
})

const isPartialSelected = computed(() => {
  const count = filteredSessions.value.filter(s => selectedIds.value.includes(s.id)).length
  return count > 0 && count < filteredSessions.value.length
})

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedIds.value = []
  } else {
    selectedIds.value = filteredSessions.value.map(s => s.id)
  }
}

const toggleSelect = (id: string) => {
  const idx = selectedIds.value.indexOf(id)
  if (idx >= 0) {
    selectedIds.value.splice(idx, 1)
  } else {
    selectedIds.value.push(id)
  }
}

const canBatchDelete = computed(() => {
  return deletableSelectedIds.value.length > 0
})

const deletableSelectedIds = computed(() => {
  return selectedIds.value.filter(id => {
    const item = sessions.value.find(s => s.id === id)
    return item && !item.project_name
  })
})

// Fetch
const fetchSessions = async () => {
  loading.value = true
  try {
    ensureExtensionConfig()
    const resp = await extSessionApi.list()
    if (resp.code === 0 && resp.data) {
      sessions.value = resp.data.items || []
    }
  } catch (error) {
    console.error('[SessionManagement] Failed to fetch sessions:', error)
    ElMessage.error($t('sessionManagement.loadFailed'))
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchSessions()
})

// Delete single
const showDeleteDialog = ref(false)
const deleteTarget = ref<SessionItem | null>(null)

const openDeleteConfirm = (item: SessionItem) => {
  if (item.project_name) return
  deleteTarget.value = item
  showDeleteDialog.value = true
}

const handleDelete = async () => {
  if (!deleteTarget.value) return
  try {
    ensureOpenCodeConfig()
    await opencodeSessionApi.delete(deleteTarget.value.id)
    ElMessage.success($t('sessionManagement.deleteSuccess'))
    showDeleteDialog.value = false
    selectedIds.value = selectedIds.value.filter(id => id !== deleteTarget.value!.id)
    await fetchSessions()
  } catch (error) {
    console.error('[SessionManagement] Delete failed:', error)
    ElMessage.error($t('sessionManagement.deleteFailed'))
  }
}

// Batch delete
const showBatchDeleteDialog = ref(false)

const openBatchDeleteConfirm = () => {
  if (deletableSelectedIds.value.length === 0) return
  showBatchDeleteDialog.value = true
}

const handleBatchDelete = async () => {
  const ids = deletableSelectedIds.value
  let successCount = 0
  try {
    ensureOpenCodeConfig()
    for (const id of ids) {
      try {
        await opencodeSessionApi.delete(id)
        successCount++
      } catch (e) {
        console.error(`[SessionManagement] Failed to delete session ${id}:`, e)
      }
    }
    if (successCount > 0) {
      ElMessage.success($t('sessionManagement.batchDeleteSuccess', { count: successCount }))
    }
    if (successCount < ids.length) {
      ElMessage.error($t('sessionManagement.batchDeleteFailed'))
    }
    showBatchDeleteDialog.value = false
    selectedIds.value = []
    await fetchSessions()
  } catch (error) {
    console.error('[SessionManagement] Batch delete failed:', error)
    ElMessage.error($t('sessionManagement.batchDeleteFailed'))
  }
}

// Utilities
const shortId = (id: string): string => {
  if (!id) return '—'
  return id.length > 8 ? id.substring(0, 8) + '…' : id
}

const formatDate = (ts: number): string => {
  if (!ts) return '—'
  return new Date(ts * 1000).toLocaleDateString() + ' ' + new Date(ts * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const formatType = (type: string): string => {
  const map: Record<string, string> = {
    app: $t('sidebar.typeApp'),
    web: $t('sidebar.typeWeb'),
    data: $t('sidebar.typeData'),
    other: $t('sidebar.typeOther'),
  }
  return map[type] || type
}

const formatStatus = (status: string): string => {
  const map: Record<string, string> = {
    active: 'Active',
    inactive: 'Inactive',
    deleted: 'Deleted',
  }
  return map[status] || status
}
</script>

<style scoped>
.session-management {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* ===== Toolbar ===== */
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.toolbar-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid var(--border-100);
  background: var(--bg-000);
  color: var(--text-300);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.toolbar-btn:hover {
  color: var(--admin-accent, #3b82f6);
  border-color: var(--admin-accent, #3b82f6);
}

/* ===== Batch Bar ===== */
.batch-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: var(--bg-000);
  border: 1px solid var(--border-100);
  border-radius: 10px;
}

.selected-info {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-200);
}

.batch-hint {
  font-size: 12px;
  color: var(--text-400);
  font-style: italic;
}

/* ===== Table Card ===== */
.table-card {
  background: var(--bg-000);
  border: 1px solid var(--border-100);
  border-radius: 12px;
  overflow: hidden;
}

.table-wrapper {
  overflow-x: auto;
}

.session-table {
  width: 100%;
  border-collapse: collapse;
}

.session-table th {
  padding: 10px 12px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-400);
  text-align: left;
  border-bottom: 1px solid var(--border-100);
  white-space: nowrap;
}

.session-table td {
  padding: 10px 12px;
  font-size: 13px;
  color: var(--text-200);
  border-bottom: 1px solid var(--border-100);
  vertical-align: middle;
}

.session-table tbody tr:last-child td {
  border-bottom: none;
}

.session-table tbody tr:hover {
  background: var(--bg-100);
}

.session-table tbody tr.selected {
  background: rgba(59, 130, 246, 0.04);
}

.check-col {
  width: 36px;
  text-align: center;
}

.check-col input[type="checkbox"] {
  cursor: pointer;
  accent-color: var(--admin-accent, #3b82f6);
}

/* ===== Cell Styles ===== */
.session-id {
  font-family: monospace;
  font-size: 12px;
  color: var(--text-400);
  cursor: default;
}

.title-text {
  font-weight: 500;
  color: var(--text-100);
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: inline-block;
}

.user-text {
  color: var(--text-200);
}

.project-text {
  color: var(--text-200);
  font-weight: 500;
}

.no-data {
  color: var(--text-500);
}

.type-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.active {
  background: rgba(34, 197, 94, 0.1);
  color: #16a34a;
}

.status-badge.inactive {
  background: rgba(239, 68, 68, 0.1);
  color: #dc2626;
}

.status-badge.deleted {
  background: rgba(107, 114, 128, 0.1);
  color: #6b7280;
}

.date-text {
  font-size: 12px;
  color: var(--text-400);
  white-space: nowrap;
}

/* ===== Action Buttons ===== */
.action-btn.delete {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border: none;
  border-radius: 6px;
  background: transparent;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
  color: #dc2626;
}

.action-btn.delete:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.08);
}

.action-btn.delete:disabled {
  color: var(--text-500);
  cursor: not-allowed;
  opacity: 0.5;
}

/* ===== Loading & Empty Placeholder ===== */
.loading-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 40px 16px;
  color: var(--text-400);
  font-size: 13px;
}

.empty-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 16px;
  color: var(--text-400);
}

.empty-placeholder svg {
  margin-bottom: 12px;
  opacity: 0.4;
}

.empty-placeholder p {
  font-size: 13px;
  margin: 0;
}

/* ===== Delete Dialog ===== */
.delete-msg {
  font-size: 14px;
  color: var(--text-200);
  line-height: 1.6;
  margin: 0;
}
</style>
