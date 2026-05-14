<template>
  <div class="user-management">
    <!-- Role Tabs & Add Button -->
    <div class="toolbar">
      <div class="tab-group">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          class="tab-btn"
          :class="{ active: activeTab === tab.key }"
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
          <span class="tab-count">{{ tabCount(tab.key) }}</span>
        </button>
      </div>
      <el-button type="primary" size="small" :icon="Plus" @click="showAddDialog = true">
        {{ $t('userManagement.addUser') }}
      </el-button>
    </div>

    <!-- User Table -->
    <div class="table-card">
      <div class="table-wrapper">
        <table class="user-table">
          <thead>
            <tr>
              <th>{{ $t('userManagement.username') }}</th>
              <th>{{ $t('userManagement.role') }}</th>
              <th>{{ $t('userManagement.status') }}</th>
              <th>{{ $t('userManagement.createdAt') }}</th>
              <th>{{ $t('userManagement.actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="5">
                <div class="loading-placeholder">
                  <el-icon class="is-loading" :size="20"><Loading /></el-icon>
                  <span>{{ $t('userManagement.loading') }}</span>
                </div>
              </td>
            </tr>
            <tr v-else-if="filteredUsers.length === 0">
              <td colspan="5">
                <div class="empty-placeholder">
                  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  <p>{{ $t('userManagement.noUsers') }}</p>
                </div>
              </td>
            </tr>
            <tr v-for="user in filteredUsers" :key="user.id">
              <td>
                <div class="user-cell">
                  <div class="user-avatar-sm">{{ user.username.charAt(0).toUpperCase() }}</div>
                  <span class="user-name-text">{{ user.username }}</span>
                </div>
              </td>
              <td>
                <span class="role-badge" :class="user.role">{{ user.role === 'admin' ? $t('userManagement.roleAdmin') : $t('userManagement.roleUser') }}</span>
              </td>
              <td>
                <span class="status-badge" :class="{ enabled: !user.disabled, disabled: !!user.disabled }">
                  {{ user.disabled ? $t('userManagement.statusDisabled') : $t('userManagement.statusEnabled') }}
                </span>
              </td>
              <td>
                <span class="date-text">{{ formatDate(user.created_at) }}</span>
              </td>
              <td>
          <div class="action-btns">
          <button class="action-btn detail" @click="openDetailDialog(user)">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            {{ $t('userManagement.detail') }}
          </button>
          <button class="action-btn edit" @click="openEditDialog(user)">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            {{ $t('userManagement.edit') }}
          </button>
          <button class="action-btn password" @click="openPasswordDialog(user)">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            {{ $t('userManagement.changePassword') }}
          </button>
          <button class="action-btn delete" @click="openDeleteConfirm(user)">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            {{ $t('userManagement.delete') }}
          </button>
          </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Detail Dialog -->
    <el-dialog v-model="showDetailDialog" :title="$t('userManagement.detailTitle')" width="500px" :close-on-click-modal="false">
      <div v-if="detailUser" class="detail-grid">
        <div class="detail-row">
          <span class="detail-label">{{ $t('userManagement.username') }}</span>
          <span class="detail-value">{{ detailUser.username }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">{{ $t('userManagement.role') }}</span>
          <span class="detail-value">
            <span class="role-badge" :class="detailUser.role">{{ detailUser.role === 'admin' ? $t('userManagement.roleAdmin') : $t('userManagement.roleUser') }}</span>
          </span>
        </div>
        <div class="detail-row">
          <span class="detail-label">{{ $t('userManagement.status') }}</span>
          <span class="detail-value">
            <span class="status-badge" :class="{ enabled: !detailUser.disabled, disabled: !!detailUser.disabled }">
              {{ detailUser.disabled ? $t('userManagement.statusDisabled') : $t('userManagement.statusEnabled') }}
            </span>
          </span>
        </div>
        <div class="detail-row">
          <span class="detail-label">{{ $t('userManagement.createdAt') }}</span>
          <span class="detail-value">{{ formatDate(detailUser.created_at) }}</span>
        </div>
        <template v-if="detailUser.profile">
          <div class="detail-divider">{{ $t('userManagement.profileInfo') }}</div>
          <div class="detail-row">
            <span class="detail-label">{{ $t('userManagement.profileName') }}</span>
            <span class="detail-value">{{ detailUser.profile.name || '-' }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">{{ $t('userManagement.profileEmail') }}</span>
            <span class="detail-value">{{ detailUser.profile.email || '-' }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">{{ $t('userManagement.profileNickname') }}</span>
            <span class="detail-value">{{ detailUser.profile.nickname || '-' }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">{{ $t('userManagement.profileGender') }}</span>
            <span class="detail-value">{{ formatGender(detailUser.profile.gender) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">{{ $t('userManagement.profileDepartment') }}</span>
            <span class="detail-value">{{ detailUser.profile.department || '-' }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">{{ $t('userManagement.profileDescription') }}</span>
            <span class="detail-value">{{ detailUser.profile.description || '-' }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">{{ $t('userManagement.profileRemark') }}</span>
            <span class="detail-value">{{ detailUser.profile.remark || '-' }}</span>
          </div>
        </template>
        <div v-else class="detail-divider">{{ $t('userManagement.noProfile') }}</div>
      </div>
      <template #footer>
        <el-button @click="showDetailDialog = false">{{ $t('userManagement.close') }}</el-button>
      </template>
    </el-dialog>

  <!-- Edit User Dialog -->
  <el-dialog v-model="showEditDialog" :title="$t('userManagement.editTitle')" width="640px" :close-on-click-modal="false">
    <el-form label-position="top" class="dialog-form">
      <div class="form-row-2">
        <el-form-item :label="$t('userManagement.username')">
          <el-input :model-value="editTarget?.username" disabled />
        </el-form-item>
        <el-form-item :label="$t('userManagement.role')">
          <el-select v-model="editForm.role" style="width: 100%">
            <el-option :label="$t('userManagement.roleUser')" value="user" />
            <el-option :label="$t('userManagement.roleAdmin')" value="admin" />
          </el-select>
        </el-form-item>
      </div>
      <el-form-item :label="$t('userManagement.status')">
        <el-select v-model="editForm.disabled" style="width: 100%">
          <el-option :label="$t('userManagement.statusEnabled')" :value="0" />
          <el-option :label="$t('userManagement.statusDisabled')" :value="1" />
        </el-select>
      </el-form-item>

      <div class="profile-section-toggle" @click="showEditProfile = !showEditProfile">
        <span>{{ $t('userManagement.profileInfo') }}</span>
        <svg :class="{ rotated: showEditProfile }" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
      </div>

      <transition name="collapse">
        <div v-if="showEditProfile" class="profile-fields">
          <div class="form-row-3">
            <el-form-item :label="$t('userManagement.profileName')">
              <el-input :placeholder="$t('userManagement.enterProfileName')" v-model="editForm.name" />
            </el-form-item>
            <el-form-item :label="$t('userManagement.profileEmail')">
              <el-input :placeholder="$t('userManagement.enterEmail')" v-model="editForm.email" />
            </el-form-item>
            <el-form-item :label="$t('userManagement.profileNickname')">
              <el-input :placeholder="$t('userManagement.enterNickname')" v-model="editForm.nickname" />
            </el-form-item>
          </div>
          <div class="form-row-2">
            <el-form-item :label="$t('userManagement.profileGender')">
              <el-select v-model="editForm.gender" :placeholder="$t('userManagement.selectGender')" style="width: 100%" clearable>
                <el-option :label="$t('userManagement.genderMale')" value="male" />
                <el-option :label="$t('userManagement.genderFemale')" value="female" />
                <el-option :label="$t('userManagement.genderOther')" value="other" />
              </el-select>
            </el-form-item>
            <el-form-item :label="$t('userManagement.profileDepartment')">
              <el-input :placeholder="$t('userManagement.enterDepartment')" v-model="editForm.department" />
            </el-form-item>
          </div>
          <el-form-item :label="$t('userManagement.profileDescription')">
            <el-input type="textarea" :rows="2" :placeholder="$t('userManagement.enterDescription')" v-model="editForm.description" />
          </el-form-item>
          <el-form-item :label="$t('userManagement.profileRemark')">
            <el-input type="textarea" :rows="2" :placeholder="$t('userManagement.enterRemark')" v-model="editForm.remark" />
          </el-form-item>
        </div>
      </transition>
    </el-form>
    <template #footer>
      <el-button @click="showEditDialog = false">{{ $t('userManagement.cancel') }}</el-button>
      <el-button type="primary" @click="handleEditUser">{{ $t('userManagement.confirm') }}</el-button>
    </template>
  </el-dialog>

  <!-- Add User Dialog -->
  <el-dialog v-model="showAddDialog" :title="$t('userManagement.addUserTitle')" width="640px" :close-on-click-modal="false">
    <el-form label-position="top" class="dialog-form">
      <div class="form-row-2">
        <el-form-item :label="$t('userManagement.username')">
          <el-input :placeholder="$t('userManagement.enterUsername')" v-model="addForm.username" />
        </el-form-item>
        <el-form-item :label="$t('userManagement.password')">
          <el-input type="password" show-password :placeholder="$t('userManagement.enterPassword')" v-model="addForm.password" />
        </el-form-item>
      </div>
      <el-form-item :label="$t('userManagement.role')">
        <el-select v-model="addForm.role" :placeholder="$t('userManagement.selectRole')" style="width: 100%">
          <el-option :label="$t('userManagement.roleUser')" value="user" />
          <el-option :label="$t('userManagement.roleAdmin')" value="admin" />
        </el-select>
      </el-form-item>

      <div class="profile-section-toggle" @click="showAddProfile = !showAddProfile">
        <span>{{ $t('userManagement.addProfileSection') }}</span>
        <svg :class="{ rotated: showAddProfile }" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
      </div>

      <transition name="collapse">
        <div v-if="showAddProfile" class="profile-fields">
          <div class="form-row-3">
            <el-form-item :label="$t('userManagement.profileName')">
              <el-input :placeholder="$t('userManagement.enterProfileName')" v-model="addForm.name" />
            </el-form-item>
            <el-form-item :label="$t('userManagement.profileEmail')">
              <el-input :placeholder="$t('userManagement.enterEmail')" v-model="addForm.email" />
            </el-form-item>
            <el-form-item :label="$t('userManagement.profileNickname')">
              <el-input :placeholder="$t('userManagement.enterNickname')" v-model="addForm.nickname" />
            </el-form-item>
          </div>
          <div class="form-row-2">
            <el-form-item :label="$t('userManagement.profileGender')">
              <el-select v-model="addForm.gender" :placeholder="$t('userManagement.selectGender')" style="width: 100%" clearable>
                <el-option :label="$t('userManagement.genderMale')" value="male" />
                <el-option :label="$t('userManagement.genderFemale')" value="female" />
                <el-option :label="$t('userManagement.genderOther')" value="other" />
              </el-select>
            </el-form-item>
            <el-form-item :label="$t('userManagement.profileDepartment')">
              <el-input :placeholder="$t('userManagement.enterDepartment')" v-model="addForm.department" />
            </el-form-item>
          </div>
          <el-form-item :label="$t('userManagement.profileDescription')">
            <el-input type="textarea" :rows="2" :placeholder="$t('userManagement.enterDescription')" v-model="addForm.description" />
          </el-form-item>
          <el-form-item :label="$t('userManagement.profileRemark')">
            <el-input type="textarea" :rows="2" :placeholder="$t('userManagement.enterRemark')" v-model="addForm.remark" />
          </el-form-item>
        </div>
      </transition>
    </el-form>
    <template #footer>
      <el-button @click="showAddDialog = false">{{ $t('userManagement.cancel') }}</el-button>
      <el-button type="primary" @click="handleAddUser">{{ $t('userManagement.confirm') }}</el-button>
    </template>
  </el-dialog>

    <!-- Change Password Dialog -->
    <el-dialog v-model="showPasswordDialog" :title="$t('userManagement.changePasswordTitle')" width="440px" :close-on-click-modal="false">
      <p class="password-user-hint">{{ $t('userManagement.changePasswordFor', { name: passwordTarget?.username }) }}</p>
      <el-form label-position="top" class="dialog-form">
        <el-form-item :label="$t('userManagement.newPassword')">
          <el-input type="password" show-password :placeholder="$t('userManagement.enterNewPassword')" v-model="passwordForm.newPassword" />
        </el-form-item>
        <el-form-item :label="$t('userManagement.confirmPassword')">
          <el-input type="password" show-password :placeholder="$t('userManagement.enterConfirmPassword')" v-model="passwordForm.confirmPassword" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showPasswordDialog = false">{{ $t('userManagement.cancel') }}</el-button>
        <el-button type="primary" @click="handleChangePassword">{{ $t('userManagement.confirm') }}</el-button>
      </template>
    </el-dialog>

    <!-- Delete Confirm Dialog -->
    <el-dialog v-model="showDeleteDialog" :title="$t('userManagement.deleteTitle')" width="400px" :close-on-click-modal="false">
      <p class="delete-msg">{{ $t('userManagement.deleteConfirm', { name: deleteTarget?.username }) }}</p>
      <template #footer>
        <el-button @click="showDeleteDialog = false">{{ $t('userManagement.cancel') }}</el-button>
        <el-button type="danger" @click="handleDeleteUser">{{ $t('userManagement.delete') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Plus, Loading } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { userApi, setConfig as setExtensionConfig, setAuthToken } from '../../apis/extension/api'
import type { UserItem } from '../../apis/extension/types/user'
import { useUserStore } from '../../store/userStore'
import { getEnv } from '../../utils/runtimeEnv'

const { t: $t } = useI18n()
const userStore = useUserStore()

const backendURL = getEnv('VITE_BACKEND_URL', 'http://127.0.0.1:3001/api/')!

const ensureExtensionConfig = () => {
  setExtensionConfig({ baseURL: backendURL })
  if (userStore.token) setAuthToken(userStore.token)
}

// Role tabs
const activeTab = ref<'all' | 'admin' | 'user'>('all')
const tabs = computed(() => [
  { key: 'all' as const, label: $t('userManagement.tabAll') },
  { key: 'admin' as const, label: $t('userManagement.tabAdmin') },
  { key: 'user' as const, label: $t('userManagement.tabUser') }
])

// Data
const users = ref<UserItem[]>([])
const loading = ref(false)

const tabCount = (key: string): number => {
  if (key === 'all') return users.value.length
  return users.value.filter(u => u.role === key).length
}

const filteredUsers = computed(() => {
  if (activeTab.value === 'all') return users.value
  return users.value.filter(u => u.role === activeTab.value)
})

const fetchUsers = async () => {
  loading.value = true
  try {
    ensureExtensionConfig()
    const resp = await userApi.list()
    if (resp.code === 0 && resp.data) {
      users.value = resp.data.items || []
    }
  } catch (error) {
    console.error('[UserManagement] Failed to fetch users:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchUsers()
})

// Detail dialog
const showDetailDialog = ref(false)
const detailUser = ref<UserItem | null>(null)

const openDetailDialog = (user: UserItem) => {
  detailUser.value = user
  showDetailDialog.value = true
}

// Add User dialog
const showAddDialog = ref(false)
const showAddProfile = ref(false)
const addForm = ref({ username: '', password: '', role: 'user', name: '', email: '', nickname: '', gender: '', description: '', department: '', remark: '' })

// Edit User dialog
const showEditDialog = ref(false)
const showEditProfile = ref(true)
const editTarget = ref<UserItem | null>(null)
const editForm = ref({ role: 'user', disabled: 0, name: '', email: '', nickname: '', gender: '', description: '', department: '', remark: '' })

const openEditDialog = (user: UserItem) => {
  editTarget.value = user
  editForm.value = {
    role: user.role,
    disabled: user.disabled,
    name: user.profile?.name || '',
    email: user.profile?.email || '',
    nickname: user.profile?.nickname || '',
    gender: user.profile?.gender || '',
    description: user.profile?.description || '',
    department: user.profile?.department || '',
    remark: user.profile?.remark || '',
  }
  showEditProfile.value = true
  showEditDialog.value = true
}

const handleEditUser = async () => {
  if (!editTarget.value) return
  try {
    ensureExtensionConfig()
    const userId = editTarget.value.id
    const profileData: Record<string, string> = { user_id: userId }
    const profileKeys = ['name', 'email', 'nickname', 'gender', 'description', 'department', 'remark'] as const
    for (const key of profileKeys) {
      profileData[key] = editForm.value[key]
    }
    const [profileResp, userResp] = await Promise.all([
      userApi.updateProfile(profileData as any),
      userApi.update({ id: userId, role: editForm.value.role, disabled: editForm.value.disabled }),
    ])
    if (profileResp.code === 0 && userResp.code === 0) {
      ElMessage.success($t('userManagement.editSuccess'))
      showEditDialog.value = false
      await fetchUsers()
    } else {
      ElMessage.error(profileResp.message || userResp.message || $t('userManagement.editFailed'))
    }
  } catch (error) {
    console.error('[UserManagement] Edit user failed:', error)
    ElMessage.error($t('userManagement.editFailed'))
  }
}

const handleAddUser = async () => {
  if (!addForm.value.username || !addForm.value.password) {
    ElMessage.warning($t('userManagement.enterUsername'))
    return
  }
  try {
    ensureExtensionConfig()
    const payload: Record<string, string> = {
      username: addForm.value.username,
      password: addForm.value.password,
      role: addForm.value.role,
    }
    // Only send non-empty profile fields
    const profileKeys = ['name', 'email', 'nickname', 'gender', 'description', 'department', 'remark'] as const
    for (const key of profileKeys) {
      if (addForm.value[key]) payload[key] = addForm.value[key]
    }
    const resp = await userApi.register(payload as any)
    if (resp.code === 0) {
      ElMessage.success($t('userManagement.createSuccess'))
      showAddDialog.value = false
      showAddProfile.value = false
      addForm.value = { username: '', password: '', role: 'user', name: '', email: '', nickname: '', gender: '', description: '', department: '', remark: '' }
      await fetchUsers()
    } else {
      ElMessage.error(resp.message || $t('userManagement.createFailed'))
    }
  } catch (error) {
    console.error('[UserManagement] Create user failed:', error)
    ElMessage.error($t('userManagement.createFailed'))
  }
}

// Change Password dialog
const showPasswordDialog = ref(false)
const passwordTarget = ref<UserItem | null>(null)
const passwordForm = ref({ newPassword: '', confirmPassword: '' })

const openPasswordDialog = (user: UserItem) => {
  passwordTarget.value = user
  passwordForm.value = { newPassword: '', confirmPassword: '' }
  showPasswordDialog.value = true
}

const handleChangePassword = async () => {
  if (!passwordTarget.value) return
  if (!passwordForm.value.newPassword) {
    ElMessage.warning($t('userManagement.enterNewPassword'))
    return
  }
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    ElMessage.error($t('userManagement.passwordMismatch'))
    return
  }
  try {
    ensureExtensionConfig()
    const resp = await userApi.changePassword({ id: passwordTarget.value.id, new_password: passwordForm.value.newPassword })
    if (resp.code === 0) {
      ElMessage.success($t('userManagement.passwordSuccess'))
      showPasswordDialog.value = false
    } else {
      ElMessage.error(resp.message || $t('userManagement.passwordFailed'))
    }
  } catch (error) {
    console.error('[UserManagement] Change password failed:', error)
    ElMessage.error($t('userManagement.passwordFailed'))
  }
}

// Delete dialog
const showDeleteDialog = ref(false)
const deleteTarget = ref<UserItem | null>(null)

const openDeleteConfirm = (user: UserItem) => {
  deleteTarget.value = user
  showDeleteDialog.value = true
}

const handleDeleteUser = async () => {
  if (!deleteTarget.value) return
  try {
    ensureExtensionConfig()
    const resp = await userApi.delete({ id: deleteTarget.value.id })
    if (resp.code === 0) {
      ElMessage.success($t('userManagement.deleteSuccess', { name: deleteTarget.value.username }))
      showDeleteDialog.value = false
      await fetchUsers()
    } else {
      ElMessage.error(resp.message || $t('userManagement.deleteFailed'))
    }
  } catch (error) {
    console.error('[UserManagement] Delete user failed:', error)
    ElMessage.error($t('userManagement.deleteFailed'))
  }
}

// Utilities
const formatDate = (ts: number): string => {
  if (!ts) return '-'
  return new Date(ts * 1000).toLocaleDateString()
}

const formatGender = (gender?: string): string => {
  if (!gender) return '-'
  const map: Record<string, string> = { male: $t('userManagement.genderMale'), female: $t('userManagement.genderFemale'), other: $t('userManagement.genderOther') }
  return map[gender] || gender
}
</script>

<style scoped>
.user-management {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ===== Toolbar ===== */
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.tab-group {
  display: flex;
  gap: 4px;
  background: var(--bg-200);
  border-radius: 10px;
  padding: 3px;
}

.tab-btn {
  padding: 6px 14px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: var(--text-300);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
}

.tab-btn:hover {
  color: var(--text-200);
}

.tab-btn.active {
  background: var(--bg-000);
  color: var(--text-100);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.tab-count {
  font-size: 11px;
  background: var(--bg-200);
  color: var(--text-400);
  border-radius: 6px;
  padding: 1px 6px;
  min-width: 18px;
  text-align: center;
}

.tab-btn.active .tab-count {
  background: var(--admin-accent-bg, rgba(59, 130, 246, 0.08));
  color: var(--admin-accent, #3b82f6);
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

.user-table {
  width: 100%;
  border-collapse: collapse;
}

.user-table th {
  padding: 12px 16px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-400);
  text-align: left;
  border-bottom: 1px solid var(--border-100);
  white-space: nowrap;
}

.user-table td {
  padding: 12px 16px;
  font-size: 13px;
  color: var(--text-200);
  border-bottom: 1px solid var(--border-100);
  vertical-align: middle;
}

.user-table tbody tr:last-child td {
  border-bottom: none;
}

.user-table tbody tr:hover {
  background: var(--bg-100);
}

/* ===== User Cell ===== */
.user-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-avatar-sm {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--admin-accent, #3b82f6);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
}

.user-name-text {
  font-weight: 500;
  color: var(--text-100);
}

/* ===== Badges ===== */
.role-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
}

.role-badge.admin {
  background: rgba(234, 179, 8, 0.1);
  color: #ca8a04;
}

.role-badge.user {
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

.status-badge.enabled {
  background: rgba(34, 197, 94, 0.1);
  color: #16a34a;
}

.status-badge.disabled {
  background: rgba(239, 68, 68, 0.1);
  color: #dc2626;
}

.date-text {
  font-size: 13px;
  color: var(--text-400);
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

.action-btn.edit {
  color: #8b5cf6;
}

.action-btn.edit:hover {
  background: rgba(139, 92, 246, 0.08);
}

.action-btn.password {
  color: var(--text-400);
}

.action-btn.password:hover {
  background: var(--bg-100);
  color: var(--text-200);
}

.action-btn.delete {
  color: #dc2626;
}

.action-btn.delete:hover {
  background: rgba(239, 68, 68, 0.08);
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

/* ===== Detail Dialog ===== */
.detail-grid {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.detail-row {
  display: flex;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid var(--border-100);
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-label {
  width: 100px;
  flex-shrink: 0;
  font-size: 13px;
  color: var(--text-400);
}

.detail-value {
  font-size: 13px;
  color: var(--text-200);
  word-break: break-all;
}

.detail-divider {
  padding: 12px 0 4px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-400);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* ===== Dialog ===== */
.dialog-form {
  padding-top: 4px;
}

.form-row-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0 16px;
}

.form-row-3 {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 0 16px;
}

/* ===== Profile Section Toggle ===== */
.profile-section-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 0 6px;
  cursor: pointer;
  user-select: none;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-400);
  border-top: 1px solid var(--border-100);
  margin-top: 4px;
}

.profile-section-toggle:hover {
  color: var(--admin-accent, #3b82f6);
}

.profile-section-toggle svg {
  transition: transform 0.2s;
}

.profile-section-toggle svg.rotated {
  transform: rotate(180deg);
}

.profile-fields {
  padding-top: 4px;
}

/* ===== Collapse Transition ===== */
.collapse-enter-active,
.collapse-leave-active {
  transition: all 0.25s ease;
  overflow: hidden;
}

.collapse-enter-from,
.collapse-leave-to {
  opacity: 0;
  max-height: 0;
}

.collapse-enter-to,
.collapse-leave-from {
  opacity: 1;
  max-height: 600px;
}

.delete-msg {
  font-size: 14px;
  color: var(--text-200);
  line-height: 1.6;
  margin: 0;
}

.password-user-hint {
  font-size: 13px;
  color: var(--text-400);
  margin: 0 0 8px;
}
</style>
