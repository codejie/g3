<template>
<aside
  class="sidebar"
  :style="{
    width: collapsed ? '0px' : '260px',
    opacity: collapsed ? 0 : 1
  }"
>
  <!-- Header -->
  <div class="sidebar-header">
    <div class="logo-icon">
      <span>G3</span>
    </div>
    <span class="sidebar-title">G3</span>
  </div>

  <!-- Actions -->
  <div class="sidebar-actions">
    <button @click="showCreateDialog = true" class="new-chat-btn">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      <span>新建项目</span>
    </button>
  </div>

  <!-- Project List -->
  <div class="session-section">
    <div class="section-title">项目列表</div>
    <div class="session-list">
      <div v-if="projectList.length === 0" class="empty-sessions">
        暂无项目
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
              <span>详情</span>
            </div>
            <div class="menu-item" @click="handleRename(project)">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              <span>改名</span>
            </div>
            <div class="menu-item" @click="handleResetSession(project)">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
              <span>重置会话</span>
            </div>
            <div class="menu-item danger" @click="handleDelete(project)">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              <span>删除</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Footer -->
  <div class="sidebar-footer">
    <button class="settings-btn" @click="$emit('openSettings')">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
      <span>设置</span>
    </button>
    <button class="profile-btn" @click="profileVisible = true">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
      <span>个人中心</span>
    </button>
  </div>

  <!-- Profile Dialog -->
  <ProfileDialog v-model="profileVisible" />

  <!-- Create Project Dialog -->
  <el-dialog v-model="showCreateDialog" title="新建项目" width="400px" :close-on-click-modal="false">
    <el-form label-position="top">
      <el-form-item label="项目名称">
        <el-input v-model="newProject.name" placeholder="输入项目名称" />
      </el-form-item>
      <el-form-item label="项目类型">
        <el-select v-model="newProject.type" placeholder="选择项目类型" style="width: 100%">
          <el-option label="应用开发" value="app" />
          <el-option label="网站建设" value="web" />
          <el-option label="数据分析" value="data" />
          <el-option label="其他" value="other" />
        </el-select>
      </el-form-item>
      <el-form-item label="项目描述">
        <el-input v-model="newProject.description" type="textarea" :rows="3" placeholder="输入项目描述（可选）" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="showCreateDialog = false">取消</el-button>
      <el-button type="primary" :loading="creating" @click="handleCreateProject">确定</el-button>
    </template>
  </el-dialog>

  <!-- Rename Project Dialog -->
  <el-dialog v-model="showRenameDialog" title="改名" width="400px" :close-on-click-modal="false">
    <el-form label-position="top">
      <el-form-item label="项目名称">
        <el-input v-model="renameValue" placeholder="输入新名称" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="showRenameDialog = false">取消</el-button>
      <el-button type="primary" :loading="renaming" @click="handleConfirmRename">确定</el-button>
    </template>
  </el-dialog>

  <!-- Project Detail Dialog -->
  <el-dialog v-model="showDetailDialog" title="项目详情" width="400px">
    <div v-if="detailProject" class="detail-content">
      <div class="detail-row"><span class="detail-label">ID</span><span class="detail-value">{{ detailProject.id }}</span></div>
      <div class="detail-row"><span class="detail-label">名称</span><span class="detail-value">{{ detailProject.name }}</span></div>
      <div class="detail-row"><span class="detail-label">类型</span><span class="detail-value">{{ detailProject.type }}</span></div>
      <div class="detail-row"><span class="detail-label">状态</span><span class="detail-value">{{ detailProject.status }}</span></div>
      <div class="detail-row"><span class="detail-label">Session</span><span class="detail-value">{{ detailProject.session_id }}</span></div>
      <div v-if="detailProject.description" class="detail-row"><span class="detail-label">描述</span><span class="detail-value">{{ detailProject.description }}</span></div>
      <div class="detail-row"><span class="detail-label">创建时间</span><span class="detail-value">{{ formatDate(detailProject.created) }}</span></div>
      <div class="detail-row"><span class="detail-label">更新时间</span><span class="detail-value">{{ formatDate(detailProject.updated) }}</span></div>
    </div>
  </el-dialog>

  <!-- Toggle Button -->
  <button
    @click="$emit('toggle')"
    class="toggle-btn"
    :style="{ left: collapsed ? '0px' : '260px' }"
  >
    <svg v-if="!collapsed" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
    <svg v-else xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
  </button>
</aside>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { projectApi, setConfig, setAuthToken } from '../../apis/extension/api'
import { useUserStore } from '../../store/userStore'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { Project } from '../../apis/extension/types/project'
import type { GetProjectDetailResult } from '../../apis/extension/types/project'
import ProfileDialog from './ProfileDialog.vue'

interface Props {
  collapsed: boolean;
  currentProjectId?: string | null;
}

const props = withDefaults(defineProps<Props>(), {
  currentProjectId: null
});

const emit = defineEmits<{
  (e: 'toggle'): void;
  (e: 'selectProject', project: Project, directory: string): void;
  (e: 'deselectProject'): void;
  (e: 'openSettings'): void;
}>();

const userStore = useUserStore()
const profileVisible = ref(false)
const projectList = ref<Project[]>([])
const openMenuId = ref<string | null>(null)

const showCreateDialog = ref(false)
const creating = ref(false)
const newProject = ref({ name: '', type: 'app', description: '' })

const showRenameDialog = ref(false)
const renaming = ref(false)
const renameValue = ref('')
const renameProject = ref<Project | null>(null)

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
    ElMessage.warning('请选择项目类型')
    return
  }
  creating.value = true
  try {
    initApi()
    const createRes = await projectApi.create({
      name: newProject.value.name || '未命名项目',
      type: newProject.value.type,
      description: newProject.value.description || undefined,
    })
    ElMessage.success('项目创建成功')
    showCreateDialog.value = false
    newProject.value = { name: '', type: 'app', description: '' }
    await fetchProjects()
    if (createRes.code === 0 && createRes.data?.id) {
      const detail = await fetchProjectDetail(createRes.data.id)
      if (detail) emit('selectProject', detail.item, detail.directory)
    }
  } catch (error) {
    console.error('[Sidebar] Failed to create project:', error)
    ElMessage.error('创建项目失败')
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
  const detail = await fetchProjectDetail(project.id)
  detailProject.value = detail ? detail.item : project
  showDetailDialog.value = true
  openMenuId.value = null
}

const handleRename = (project: Project) => {
  renameProject.value = project
  renameValue.value = project.name
  showRenameDialog.value = true
  openMenuId.value = null
}

const handleConfirmRename = async () => {
  if (!renameProject.value || !renameValue.value.trim()) return
  renaming.value = true
  try {
    initApi()
    await projectApi.update({ id: renameProject.value.id, name: renameValue.value.trim() })
    ElMessage.success('改名成功')
    showRenameDialog.value = false
    await fetchProjects()
  } catch (error) {
    console.error('[Sidebar] Failed to rename project:', error)
    ElMessage.error('改名失败')
  } finally {
    renaming.value = false
  }
}

const handleResetSession = async (project: Project) => {
  openMenuId.value = null
  try {
    await ElMessageBox.confirm('确定要重置该项目的会话吗？重置后不可恢复。', '重置会话', { type: 'warning' })
  } catch {
    return
  }
  try {
    initApi()
    const resetRes = await projectApi.resetSession({ id: project.id })
    ElMessage.success('会话已重置')
    await fetchProjects()
    if (resetRes.code === 0 && resetRes.data?.id) {
      const detail = await fetchProjectDetail(resetRes.data.id)
      if (detail && props.currentProjectId === project.id) {
        emit('selectProject', detail.item, detail.directory)
      }
    }
  } catch (error) {
    console.error('[Sidebar] Failed to reset session:', error)
    ElMessage.error('重置会话失败')
  }
}

const handleDelete = async (project: Project) => {
  openMenuId.value = null
  try {
    await ElMessageBox.confirm(`确定要删除项目"${project.name}"吗？此操作不可恢复。`, '删除项目', { type: 'warning' })
  } catch {
    return
  }
  try {
    initApi()
    await projectApi.setStatus({ id: project.id, status: 'deleted' })
    ElMessage.success('项目已删除')
    if (props.currentProjectId === project.id) {
      emit('deselectProject')
    }
    await fetchProjects()
  } catch (error) {
    console.error('[Sidebar] Failed to delete project:', error)
    ElMessage.error('删除失败')
  }
}

const formatDate = (timestamp?: number): string => {
  if (!timestamp) return ''
  const date = new Date(timestamp * 1000)
  return date.toLocaleString()
}

const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (!target.closest('.project-menu-wrapper')) {
    openMenuId.value = null
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
  transition: all 0.3s ease-in-out;
  z-index: 30;
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

.profile-btn, .settings-btn {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 12px;
  background: transparent;
  color: var(--text-200);
  font-size: 14px;
  border: none;
  cursor: pointer;
  transition: background 0.2s;
}

.profile-btn:hover, .settings-btn:hover {
  background: var(--bg-100);
}

.profile-btn svg, .settings-btn svg {
  color: var(--text-400);
  transition: color 0.2s;
}

.profile-btn:hover svg, .settings-btn:hover svg {
  color: var(--accent-brand);
}

.toggle-btn {
  position: absolute;
  top: 80px;
  z-index: 40;
  width: 16px;
  height: 64px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--bg-000);
  border: 1px solid var(--border-100);
  border-radius: 0 8px 8px 0;
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

.detail-content {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.detail-row {
  display: flex;
  gap: 12px;
  font-size: 13px;
}

.detail-label {
  width: 70px;
  flex-shrink: 0;
  color: var(--text-400);
}

.detail-value {
  color: var(--text-200);
  word-break: break-all;
}
</style>
