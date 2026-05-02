<template>
  <div class="skills-management">
    <!-- Table Card -->
    <div class="table-card">
      <div class="table-header">
        <h3>{{ $t('skillsManagement.title') }}</h3>
        <div class="table-header-right">
          <button class="upload-btn" :disabled="uploading" @click="triggerFileInput">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            <span v-if="!uploading">{{ $t('skillsManagement.upload') }}</span>
            <span v-else>{{ $t('skillsManagement.uploading') }}</span>
          </button>
          <span class="skill-count">{{ $t('skillsManagement.skillCount', { count: skills.length }) }}</span>
        </div>
        <input ref="fileInputRef" type="file" accept=".tgz,.tar.gz,.zip,application/gzip,application/x-gzip,application/zip" class="hidden-input" @change="handleFileSelected" />
      </div>

      <div class="table-wrapper">
        <table class="skills-table">
          <thead>
            <tr>
              <th class="col-name">{{ $t('skillsManagement.name') }}</th>
              <th class="col-desc">{{ $t('skillsManagement.description') }}</th>
              <th>{{ $t('skillsManagement.actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <!-- Loading State -->
            <tr v-if="loading">
              <td colspan="3">
                <div class="loading-placeholder">
                  <el-icon class="is-loading" :size="20"><Loading /></el-icon>
                  <span>{{ $t('skillsManagement.loading') }}</span>
                </div>
              </td>
            </tr>

            <!-- Error State -->
            <tr v-else-if="loadError">
              <td colspan="3">
                <div class="error-placeholder">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  <span>{{ $t('skillsManagement.loadFailed') }}</span>
                  <button class="retry-btn" @click="fetchSkills">{{ $t('skillsManagement.retry') }}</button>
                </div>
              </td>
            </tr>

            <!-- Empty State -->
            <tr v-else-if="skills.length === 0">
              <td colspan="3">
                <div class="empty-placeholder">
                  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                  <p>{{ $t('skillsManagement.noSkills') }}</p>
                </div>
              </td>
            </tr>

            <!-- Skill Rows -->
            <tr v-for="skill in skills" :key="skill.name + '|' + skill.location">
              <td>
                <span class="skill-name">{{ skill.name }}</span>
              </td>
              <td>
                <span class="skill-desc">{{ skill.description || $t('skillsManagement.noDescription') }}</span>
              </td>
              <td>
                <div class="action-btns">
            <button class="action-btn detail" @click="viewSkillDetail(skill)">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              {{ $t('skillsManagement.viewDetail') }}
            </button>
            <button class="action-btn download" @click="downloadSkill(skill)">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              {{ $t('skillsManagement.download') }}
            </button>
            <button class="action-btn delete" @click="handleDeleteSkill(skill)">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    {{ $t('skillsManagement.delete') }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Delete Confirm Dialog -->
    <el-dialog v-model="showDeleteDialog" :title="$t('skillsManagement.deleteTitle')" width="460px" :close-on-click-modal="false">
      <div class="delete-confirm-content">
        <div class="delete-warning-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        </div>
        <p class="delete-message">{{ $t('skillsManagement.deleteConfirm', { name: deleteTarget?.name }) }}</p>
        <p class="delete-path">{{ deleteTargetPath }}</p>
        <p class="delete-irreversible">{{ $t('skillsManagement.deleteIrreversible') }}</p>
      </div>
      <template #footer>
        <el-button @click="showDeleteDialog = false">{{ $t('skillsManagement.cancel') }}</el-button>
        <el-button type="danger" @click="confirmDeleteSkill">{{ $t('skillsManagement.confirmDelete') }}</el-button>
      </template>
    </el-dialog>

    <!-- Skill Detail Dialog -->
    <el-dialog v-model="showDetailDialog" :title="detailSkill?.name" width="560px" :close-on-click-modal="false">
      <div v-if="detailSkill" class="skill-detail">
        <div class="detail-row">
          <span class="detail-label">{{ $t('skillsManagement.name') }}</span>
          <span class="detail-value">{{ detailSkill.name }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">{{ $t('skillsManagement.description') }}</span>
          <span class="detail-value">{{ detailSkill.description || $t('skillsManagement.noDescription') }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">{{ $t('skillsManagement.location') }}</span>
          <span class="detail-value detail-location">{{ detailSkill.location }}</span>
        </div>
      </div>
      <template #footer>
        <el-button @click="showDetailDialog = false">{{ $t('skillsManagement.close') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Loading } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { skillApi as opencodeSkillApi, setConfig as setOpencodeConfig } from '../../apis/opencode/api'
import { skillApi, setConfig as setExtensionConfig, setAuthToken } from '../../apis/extension/api'
import { useUserStore } from '../../store/userStore'
import type { Skill } from '../../apis/opencode/types'

const { t: $t } = useI18n()
const userStore = useUserStore()

const backendURL = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:3001/api/'

const ensureExtensionConfig = () => {
  setExtensionConfig({ baseURL: backendURL })
  if (userStore.token) setAuthToken(userStore.token)
}

const skills = ref<Skill[]>([])
const loading = ref(false)
const loadError = ref(false)

const fetchSkills = async () => {
  loading.value = true
  loadError.value = false
  try {
    const baseURL = import.meta.env.VITE_OPENCODE_URL || 'http://127.0.0.1:10090'
    setOpencodeConfig({ baseURL })
    skills.value = await opencodeSkillApi.list()
  } catch (error) {
    console.error('[SkillsManagement] Failed to fetch skills:', error)
    loadError.value = true
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchSkills()
})

// Detail dialog
const showDetailDialog = ref(false)
const detailSkill = ref<Skill | null>(null)

const viewSkillDetail = (skill: Skill) => {
  detailSkill.value = skill
  showDetailDialog.value = true
}

// Delete — confirmation dialog
const showDeleteDialog = ref(false)
const deleteTarget = ref<Skill | null>(null)

const deleteTargetPath = computed(() => {
  if (!deleteTarget.value) return ''
  return deleteTarget.value.location
})

const handleDeleteSkill = (skill: Skill) => {
  deleteTarget.value = skill
  showDeleteDialog.value = true
}

const downloadSkill = async (skill: Skill) => {
  ensureExtensionConfig()
  try {
    const { blob, filename } = await skillApi.download({ name: skill.name })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(a.href)
  } catch (error) {
    console.error('[SkillsManagement] Download failed:', error)
    ElMessage.error($t('skillsManagement.downloadFailed'))
  }
}

const confirmDeleteSkill = async () => {
  if (!deleteTarget.value) return
  ensureExtensionConfig()
  try {
  const result = await skillApi.delete({ name: deleteTarget.value.name })
      if (result.code === 0) {
        await fetchSkills()
        ElMessageBox.alert($t('skillsManagement.restartRequiredMessage'), $t('skillsManagement.restartRequiredTitle'), {
          confirmButtonText: $t('skillsManagement.restartRequiredConfirm'),
          type: 'warning',
        })
    } else {
      ElMessage.error(result.message || $t('skillsManagement.deleteFailed'))
    }
  } catch (error) {
    console.error('[SkillsManagement] Delete failed:', error)
    ElMessage.error($t('skillsManagement.deleteFailed'))
  } finally {
    showDeleteDialog.value = false
    deleteTarget.value = null
  }
}

// Upload
const fileInputRef = ref<HTMLInputElement | null>(null)
const uploading = ref(false)

const triggerFileInput = () => {
  fileInputRef.value?.click()
}

const handleFileSelected = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  const filename = file.name.toLowerCase()
  const isValid = filename.endsWith('.tar.gz') || filename.endsWith('.tgz') || filename.endsWith('.zip')
  if (!isValid) {
    ElMessage.error($t('skillsManagement.unsupportedFileType') || 'Only .tar.gz, .tgz and .zip files are supported')
    input.value = ''
    return
  }

  uploading.value = true
  try {
    ensureExtensionConfig()
    const result = await skillApi.upload(file, backendURL, userStore.token)
      if (result.code === 0) {
        await fetchSkills()
        ElMessageBox.alert($t('skillsManagement.restartRequiredMessage'), $t('skillsManagement.restartRequiredTitle'), {
          confirmButtonText: $t('skillsManagement.restartRequiredConfirm'),
          type: 'warning',
        })
    } else {
      ElMessage.error(result.message || $t('skillsManagement.uploadFailed'))
    }
  } catch (error: any) {
    console.error('[SkillsManagement] Upload failed:', error)
    ElMessage.error($t('skillsManagement.uploadFailed'))
  } finally {
    uploading.value = false
    input.value = ''
  }
}
</script>

<style scoped>
.skills-management {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ===== Table Card ===== */
.table-card {
  background: var(--bg-000);
  border: 1px solid var(--border-100);
  border-radius: 12px;
  overflow: hidden;
}

.table-header {
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-100);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.table-header h3 {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-100);
  margin: 0;
}

.skill-count {
  font-size: 13px;
  color: var(--text-400);
}

.table-header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.upload-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 8px;
  border: 1px solid var(--admin-accent, #3b82f6);
  background: transparent;
  color: var(--admin-accent, #3b82f6);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}

.upload-btn:hover:not(:disabled) {
  background: var(--admin-accent-bg, rgba(59, 130, 246, 0.08));
}

.upload-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.hidden-input {
  display: none;
}

.table-wrapper {
  overflow-x: auto;
}

/* ===== Skills Table ===== */
.skills-table {
  width: 100%;
  border-collapse: collapse;
}

.skills-table th {
  padding: 10px 16px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-400);
  text-align: left;
  border-bottom: 1px solid var(--border-100);
  white-space: nowrap;
}

.skills-table td {
  padding: 12px 16px;
  font-size: 13px;
  color: var(--text-200);
  border-bottom: 1px solid var(--border-100);
  vertical-align: middle;
}

.skills-table tbody tr:last-child td {
  border-bottom: none;
}

.skills-table tbody tr:hover {
  background: var(--bg-100);
}

/* ===== Column Widths ===== */
.col-name {
  width: 20%;
}

.col-desc {
  width: auto;
}

/* ===== Name Cell ===== */
.skill-name {
  font-weight: 600;
  color: var(--text-100);
}

.skill-desc {
  font-size: 13px;
  color: var(--text-300);
}

/* ===== Action Buttons ===== */
.action-btns {
  display: flex;
  align-items: center;
  gap: 4px;
}

.action-btn {
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
}

.action-btn.detail {
  color: var(--admin-accent, #3b82f6);
}

.action-btn.detail:hover {
  background: rgba(59, 130, 246, 0.08);
}

.action-btn.download {
  color: #059669;
}

.action-btn.download:hover {
  background: rgba(5, 150, 105, 0.08);
}

.action-btn.delete {
  color: #dc2626;
}

.action-btn.delete:hover {
  background: rgba(239, 68, 68, 0.08);
}

/* ===== Loading State ===== */
.loading-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 32px 16px;
  color: var(--text-400);
  font-size: 13px;
}

/* ===== Error State ===== */
.error-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 32px 16px;
  color: var(--text-400);
  font-size: 13px;
}

.retry-btn {
  padding: 4px 12px;
  border-radius: 6px;
  border: 1px solid var(--border-200);
  background: transparent;
  color: var(--text-300);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s;
}

.retry-btn:hover {
  background: var(--bg-100);
  border-color: var(--border-300);
}

/* ===== Empty Placeholder ===== */
.empty-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 16px;
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

/* ===== Skill Detail Dialog ===== */
.skill-detail {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.detail-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.detail-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-400);
  min-width: 80px;
  flex-shrink: 0;
}

.detail-value {
  font-size: 13px;
  color: var(--text-100);
  word-break: break-all;
}

.detail-location {
  font-family: monospace;
  background: var(--bg-100);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

/* ===== Delete Confirm Dialog ===== */
.delete-confirm-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 12px;
  padding: 8px 0;
}

.delete-warning-icon {
  color: #f59e0b;
}

.delete-message {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-100);
  margin: 0;
}

.delete-path {
  font-family: monospace;
  font-size: 12px;
  color: var(--text-400);
  background: var(--bg-100);
  padding: 6px 12px;
  border-radius: 6px;
  word-break: break-all;
  margin: 0;
  max-width: 100%;
}

.delete-irreversible {
  font-size: 12px;
  color: #dc2626;
  margin: 0;
}
</style>
