<template>
<aside
  class="sidebar"
  :style="{
    width: collapsed ? '0px' : '260px'
  }"
>
  <!-- Header -->
  <div class="sidebar-header">
    <div class="logo-icon">
      <span>AG</span>
    </div>
    <span class="sidebar-title">{{ $t('app.name') }}</span>
  </div>

  <!-- Actions -->
  <div class="sidebar-actions">
    <button @click="showCreateDialog = true" class="new-chat-btn">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      <span>{{ $t('sidebar.newProject') }}</span>
    </button>
  </div>

  <!-- Project List -->
  <div class="session-section">
    <div class="section-title">{{ $t('sidebar.projectList') }}</div>
    <div class="session-list">
    <div v-if="projectList.length === 0" class="empty-sessions">
      {{ $t('sidebar.noProjects') }}
    </div>
      <div
        v-for="project in projectList"
        :key="project.id"
        class="project-item"
        :class="{ active: currentProjectId === project.id }"
        @click="handleProjectClick(project)"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
        <div class="project-info">
          <span class="project-name">{{ project.name }}</span>
          <span class="project-type">{{ project.type }}</span>
        </div>
        <div class="project-menu-wrapper" @click.stop>
          <button class="project-menu-btn" @click="toggleMenu(project.id)">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
          </button>
          <div v-if="openMenuId === project.id" class="project-menu">
      <div class="menu-item" @click="handleDetail(project)">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
        <span>{{ $t('sidebar.detail') }}</span>
      </div>
      <div class="menu-item" @click="handleResetSession(project)">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
        <span>{{ $t('sidebar.resetSession') }}</span>
      </div>
      <div class="menu-item danger" @click="handleDelete(project)">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        <span>{{ $t('sidebar.delete') }}</span>
      </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Footer -->
  <div class="sidebar-footer">
    <button class="user-menu-trigger" :class="{ active: showUserMenu }" @click="showUserMenu = !showUserMenu">
      <div class="user-avatar">{{ userInitial }}</div>
      <div class="user-meta">
        <span class="user-name">{{ userStore.userInfo?.username }}</span>
        <span class="user-role">{{ userStore.userInfo?.role }}</span>
      </div>
      <svg class="chevron-icon" :class="{ rotated: showUserMenu }" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
    </button>
    <div v-if="showUserMenu" class="user-menu-panel">
      <div class="user-detail-row">
        <span class="detail-label">{{ $t('sidebar.userUsername') }}</span>
        <span class="detail-value">{{ userStore.userInfo?.username }}</span>
      </div>
      <div class="user-detail-row">
        <span class="detail-label">{{ $t('sidebar.userRole') }}</span>
        <span class="detail-value">{{ userStore.userInfo?.role }}</span>
      </div>
          <button class="menu-action-btn" @click="toggleLanguage">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
            <span>{{ $t('sidebar.language') }} {{ currentLanguage }}</span>
          </button>
          <button class="menu-action-btn" @click="handleChangePassword">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        <span>{{ $t('sidebar.changePassword') }}</span>
      </button>
      <button class="menu-action-btn logout-btn" @click="handleLogout">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        <span>{{ $t('sidebar.logout') }}</span>
      </button>
    </div>
  </div>

  <!-- Change Password Dialog -->
  <el-dialog v-model="showChangePwdDialog" :title="$t('sidebar.changePasswordTitle')" width="380px" :close-on-click-modal="false">
    <el-form label-position="top">
      <el-form-item :label="$t('sidebar.newPassword')">
        <el-input v-model="changePwdForm.newPassword" type="password" show-password :placeholder="$t('sidebar.enterNewPassword')" />
      </el-form-item>
      <el-form-item :label="$t('sidebar.confirmPassword')">
        <el-input v-model="changePwdForm.confirmPassword" type="password" show-password :placeholder="$t('sidebar.enterConfirmPassword')" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="showChangePwdDialog = false">{{ $t('sidebar.cancel') }}</el-button>
      <el-button type="primary" :loading="changingPwd" @click="submitChangePassword">{{ $t('sidebar.confirm') }}</el-button>
    </template>
  </el-dialog>

  <!-- Project Detail Dialog -->
  <ProjectDetailDialog v-model="showDetailDialog" :project="detailProject" />

  <!-- Create Project Dialog -->
  <el-dialog v-model="showCreateDialog" :title="$t('sidebar.createProject')" width="400px" :close-on-click-modal="false">
  <el-form label-position="top">
    <el-form-item :label="$t('sidebar.projectName')">
      <el-input v-model="newProject.name" :placeholder="$t('sidebar.enterProjectName')" />
    </el-form-item>
    <el-form-item :label="$t('sidebar.projectType')">
      <el-select v-model="newProject.type" :placeholder="$t('sidebar.selectProjectType')" style="width: 100%">
        <el-option :label="$t('sidebar.typeApp')" value="app" />
        <el-option :label="$t('sidebar.typeWeb')" value="web" />
        <el-option :label="$t('sidebar.typeData')" value="data" />
        <el-option :label="$t('sidebar.typeOther')" value="other" />
      </el-select>
    </el-form-item>
    <el-form-item :label="$t('sidebar.projectDesc')">
      <el-input v-model="newProject.description" type="textarea" :rows="3" :placeholder="$t('sidebar.enterProjectDesc')" />
    </el-form-item>
  </el-form>
  <template #footer>
    <el-button @click="showCreateDialog = false">{{ $t('login.cancel') }}</el-button>
    <el-button type="primary" :loading="creating" @click="handleCreateProject">{{ $t('sidebar.confirm') }}</el-button>
  </template>
</el-dialog>

</aside>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { projectApi, userApi, setConfig, setAuthToken } from '../../apis/extension/api'
import { useUserStore } from '../../store/userStore'
import { ElMessage, ElMessageBox } from 'element-plus'
import { setLocale, getLocale } from '../../locales'
import type { Project } from '../../apis/extension/types/project'
import ProjectDetailDialog from './ProjectDetailDialog.vue'

interface Props {
  collapsed: boolean;
  currentProjectId?: string | null;
}

const props = withDefaults(defineProps<Props>(), {
  currentProjectId: null
});

const emit = defineEmits<{
  (e: 'selectProject', project: Project, directory: string): void;
  (e: 'deselectProject'): void;
}>();

const { t } = useI18n()
const router = useRouter()
const userStore = useUserStore()
const showUserMenu = ref(false)
const projectList = ref<Project[]>([])
const openMenuId = ref<string | null>(null)

const showChangePwdDialog = ref(false)
const changingPwd = ref(false)
const changePwdForm = ref({ newPassword: '', confirmPassword: '' })

const userInitial = computed(() => {
  return userStore.userInfo?.username?.charAt(0)?.toUpperCase() || 'U'
})

const currentLanguage = computed(() => {
  const locale = getLocale()
  return locale === 'zh-CN' ? t('sidebar.languageZh') : t('sidebar.languageEn')
})

const toggleLanguage = () => {
  const locale = getLocale()
  const newLocale = locale === 'zh-CN' ? 'en-US' : 'zh-CN'
  setLocale(newLocale)
}

const showCreateDialog = ref(false)
const creating = ref(false)
const newProject = ref({ name: '', type: 'app', description: '' })

const showDetailDialog = ref(false)
const detailProject = ref<Project | null>(null)

const initApi = () => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL
  if (backendUrl) setConfig({ baseURL: backendUrl })
  const token = userStore.token
  if (token) setAuthToken(token)
}

const fetchProjects = async () => {
  try {
    initApi()
    const response = await projectApi.list()
    if (response.code === 0 && response.data?.items) {
      projectList.value = response.data.items
    }
  } catch (error) {
    console.error('[Sidebar] Failed to fetch projects:', error)
  }
}

const fetchProjectDetail = async (projectId: string): Promise<{ item: Project; directory: string } | null> => {
  try {
    initApi()
    const response = await projectApi.activate({ id: projectId })
    if (response.code === 0 && response.data) {
      const data = response.data as any
      if (data.item) {
        return { item: data.item, directory: data.directory || '' }
      }
      return { item: data as Project, directory: `${(data as Project).user_id}/${(data as Project).id}/` }
    }
    return null
  } catch (error) {
    console.error('[Sidebar] Failed to activate project:', error)
    return null
  }
}

const handleCreateProject = async () => {
  if (!newProject.value.type) {
    ElMessage.warning(t('sidebar.selectType'))
    return
  }
  creating.value = true
  try {
    initApi()
    const createRes = await projectApi.create({
      name: newProject.value.name || t('sidebar.unnamedProject'),
      type: newProject.value.type,
      description: newProject.value.description || undefined,
    })
    ElMessage.success(t('sidebar.createSuccess'))
    showCreateDialog.value = false
    newProject.value = { name: '', type: 'app', description: '' }
    await fetchProjects()
    if (createRes.code === 0 && createRes.data?.id) {
      const detail = await fetchProjectDetail(createRes.data.id)
      if (detail) emit('selectProject', detail.item, detail.directory)
    }
  } catch (error) {
    console.error('[Sidebar] Failed to create project:', error)
    ElMessage.error(t('sidebar.createFailed'))
  } finally {
    creating.value = false
  }
}

const toggleMenu = (projectId: string) => {
  openMenuId.value = openMenuId.value === projectId ? null : projectId
}

const handleProjectClick = async (project: Project) => {
  const detail = await fetchProjectDetail(project.id)
  if (detail) {
    emit('selectProject', detail.item, detail.directory)
  } else {
    emit('selectProject', project, `${project.user_id}/${project.id}/`)
  }
}

const handleDetail = async (project: Project) => {
  try {
    initApi()
    const response = await projectApi.detail({ id: project.id })
    if (response.code === 0 && response.data?.item) {
      detailProject.value = response.data.item
    } else {
      detailProject.value = project
    }
  } catch (error) {
    console.error('[Sidebar] Failed to get project detail:', error)
    detailProject.value = project
  }
  showDetailDialog.value = true
  openMenuId.value = null
}

const handleResetSession = async (project: Project) => {
  openMenuId.value = null
  try {
    await ElMessageBox.confirm(t('sidebar.resetConfirm'), t('sidebar.resetTitle'), { type: 'warning' })
  } catch {
    return
  }
  try {
    initApi()
    const resetRes = await projectApi.resetSession({ id: project.id })
    ElMessage.success(t('sidebar.resetSuccess'))
    await fetchProjects()
    if (resetRes.code === 0 && resetRes.data?.id) {
      const detail = await fetchProjectDetail(resetRes.data.id)
      if (detail && props.currentProjectId === project.id) {
        emit('selectProject', detail.item, detail.directory)
      }
    }
  } catch (error) {
    console.error('[Sidebar] Failed to reset session:', error)
    ElMessage.error(t('sidebar.resetFailed'))
  }
}

const handleDelete = async (project: Project) => {
  openMenuId.value = null
  try {
    await ElMessageBox.confirm(t('sidebar.deleteConfirm', { name: project.name }), t('sidebar.deleteTitle'), { type: 'warning' })
  } catch {
    return
  }
  try {
    initApi()
    await projectApi.setStatus({ id: project.id, status: 'deleted' })
    ElMessage.success(t('sidebar.deleteSuccess'))
    if (props.currentProjectId === project.id) {
      emit('deselectProject')
    }
    await fetchProjects()
  } catch (error) {
    console.error('[Sidebar] Failed to delete project:', error)
    ElMessage.error(t('sidebar.deleteFailed'))
  }
}

const handleChangePassword = () => {
  showUserMenu.value = false
  changePwdForm.value = { newPassword: '', confirmPassword: '' }
  showChangePwdDialog.value = true
}

const submitChangePassword = async () => {
  if (!changePwdForm.value.newPassword) {
    ElMessage.warning(t('sidebar.enterNewPassword'))
    return
  }
  if (changePwdForm.value.newPassword !== changePwdForm.value.confirmPassword) {
    ElMessage.warning(t('sidebar.passwordMismatch'))
    return
  }
  changingPwd.value = true
  try {
    initApi()
    await userApi.changePassword({
      id: userStore.userInfo?.id || '',
      new_password: changePwdForm.value.newPassword
    })
    ElMessage.success(t('sidebar.passwordSuccess'))
    showChangePwdDialog.value = false
  } catch (error) {
    console.error('[Sidebar] Failed to change password:', error)
    ElMessage.error(t('sidebar.passwordFailed'))
  } finally {
    changingPwd.value = false
  }
}

const handleLogout = async () => {
  showUserMenu.value = false
  try {
    await ElMessageBox.confirm(t('sidebar.logoutConfirm'), t('sidebar.logoutTitle'), { type: 'warning' })
  } catch {
    return
  }
  try {
    initApi()
    await userApi.logout()
  } catch (error) {
    console.error('[Sidebar] Logout API failed:', error)
  } finally {
    setAuthToken(null)
    userStore.logout()
    ElMessage.success(t('sidebar.logoutSuccess'))
    router.push('/login')
  }
}

const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (!target.closest('.project-menu-wrapper')) {
    openMenuId.value = null
  }
  if (!target.closest('.sidebar-footer')) {
    showUserMenu.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  fetchProjects()
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

defineExpose({ fetchProjects })
</script>

<style scoped>
.sidebar {
  position: relative;
  height: 100%;
  border-right: 1px solid var(--border-100);
  background: var(--bg-000);
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease-in-out;
  overflow: hidden;
}

.sidebar-header {
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid var(--border-100);
  height: 56px;
  flex-shrink: 0;
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
  flex-shrink: 0;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.sidebar-title {
  font-weight: bold;
  color: var(--text-100);
  letter-spacing: -0.02em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sidebar-actions {
  padding: 8px;
  padding-top: 24px;
}

.new-chat-btn {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 12px;
  background: var(--accent-brand);
  color: white;
  font-size: 14px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.new-chat-btn:hover {
  opacity: 0.9;
}

.new-chat-btn svg {
  transition: transform 0.3s;
}

.new-chat-btn:hover svg {
  transform: rotate(90deg);
}

.session-section {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding: 8px;
}

.section-title {
  padding: 8px 16px;
  font-size: 10px;
  font-weight: bold;
  color: var(--text-400);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.session-list {
  flex: 1;
  overflow-y: auto;
  padding: 0 8px;
}

.session-list::-webkit-scrollbar {
  width: 4px;
}

.session-list::-webkit-scrollbar-thumb {
  background-color: var(--border-200);
  border-radius: 10px;
}

.empty-sessions {
  padding: 16px;
  text-align: center;
  font-size: 12px;
  color: var(--text-400);
  font-style: italic;
}

.project-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.2s;
  color: var(--text-200);
  margin-bottom: 2px;
}

.project-item:hover {
  background: var(--bg-100);
}

.project-item.active {
  background: var(--bg-200);
}

.project-item.active svg {
  color: var(--accent-brand);
}

.project-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.project-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-100);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.project-type {
  font-size: 10px;
  color: var(--text-400);
  margin-top: 1px;
}

.project-menu-wrapper {
  position: relative;
  flex-shrink: 0;
}

.project-menu-btn {
  padding: 4px;
  border-radius: 6px;
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--text-400);
  transition: all 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
}

.project-item:hover .project-menu-btn {
  opacity: 1;
}

.project-menu-btn:hover {
  background: var(--bg-200);
  color: var(--text-200);
}

.project-menu {
  position: absolute;
  right: 0;
  top: 100%;
  min-width: 140px;
  background: var(--bg-000);
  border: 1px solid var(--border-200);
  border-radius: 10px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  z-index: 50;
  padding: 4px;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  color: var(--text-200);
  transition: background 0.15s;
}

.menu-item:hover {
  background: var(--bg-100);
}

.menu-item.danger {
  color: #f56c6c;
}

.menu-item.danger:hover {
  background: #fef0f0;
}

.sidebar-footer {
  padding: 12px;
  border-top: 1px solid var(--border-100);
  background: var(--bg-000);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.user-menu-trigger {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.2s;
  background: transparent;
  border: none;
  text-align: left;
  color: inherit;
}

.user-menu-trigger:hover {
  background: var(--bg-100);
}

.user-menu-trigger.active {
  background: var(--bg-100);
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--accent-brand);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  flex-shrink: 0;
}

.user-meta {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}

.user-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-100);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-role {
  font-size: 11px;
  color: var(--text-400);
}

.chevron-icon {
  color: var(--text-400);
  transition: transform 0.2s;
  flex-shrink: 0;
}

.chevron-icon.rotated {
  transform: rotate(180deg);
}

.user-menu-panel {
  margin-top: 4px;
  padding: 8px;
  background: var(--bg-100);
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  animation: fadeIn 0.15s ease;
}

.user-detail-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 8px;
}

.detail-label {
  font-size: 12px;
  color: var(--text-400);
}

.detail-value {
  font-size: 12px;
  color: var(--text-200);
  font-weight: 500;
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.menu-action-btn {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 8px;
  background: transparent;
  color: var(--text-300);
  font-size: 13px;
  border: none;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}

.menu-action-btn:hover {
  background: var(--bg-200);
  color: var(--text-100);
}

.menu-action-btn svg {
  flex-shrink: 0;
  transition: color 0.2s;
}

.logout-btn:hover {
  background: rgba(239, 68, 68, 0.08);
  color: #ef4444;
}

.logout-btn:hover svg {
  color: #ef4444;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}

</style>
