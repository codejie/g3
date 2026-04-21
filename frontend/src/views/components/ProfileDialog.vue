<template>
  <el-dialog v-model="visible" title="个人中心" width="380px" :close-on-click-modal="true" @close="$emit('update:modelValue', false)">
    <div v-if="loading" class="profile-loading">加载中...</div>
    <template v-else-if="profile">
      <div class="profile-section">
        <div class="profile-avatar">
          <div class="avatar-placeholder">
            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
        </div>
        <div class="profile-name">{{ profile.name || '-' }}</div>
        <div class="profile-role">{{ userStore.userRole }}</div>
      </div>
      <div class="profile-fields">
        <div class="profile-field">
          <span class="field-label">ID</span>
          <span class="field-value">{{ profile.user_id || '-' }}</span>
        </div>
        <div class="profile-field">
          <span class="field-label">邮箱</span>
          <span class="field-value">{{ profile.email || '-' }}</span>
        </div>
        <div class="profile-field">
          <span class="field-label">昵称</span>
          <span class="field-value">{{ profile.nickname || '-' }}</span>
        </div>
        <div class="profile-field">
          <span class="field-label">性别</span>
          <span class="field-value">{{ profile.gender || '-' }}</span>
        </div>
        <div class="profile-field">
          <span class="field-label">部门</span>
          <span class="field-value">{{ profile.department || '-' }}</span>
        </div>
        <div class="profile-field">
          <span class="field-label">描述</span>
          <span class="field-value">{{ profile.description || '-' }}</span>
        </div>
        <div class="profile-field">
          <span class="field-label">备注</span>
          <span class="field-value">{{ profile.remark || '-' }}</span>
        </div>
      </div>
    </template>
    <div v-else class="profile-empty">无法获取个人信息</div>
    <template #footer>
      <div class="dialog-footer">
        <el-button type="danger" @click="handleLogout">登出 / Logout</el-button>
        <el-button type="primary" @click="handleClose">确定</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { userApi, setConfig, setAuthToken } from '../../apis/extension/api'
import { useUserStore } from '../../store/userStore'
import { ElMessage } from 'element-plus'
import type { Profile } from '../../apis/extension/types/user'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ (e: 'update:modelValue', value: boolean): void }>()

const visible = ref(props.modelValue)
const loading = ref(false)
const profile = ref<Profile | null>(null)
const userStore = useUserStore()
const router = useRouter()

const backendUrl = import.meta.env.VITE_BACKEND_URL

watch(() => props.modelValue, (val) => {
  visible.value = val
  if (val) fetchProfile()
})

watch(visible, (val) => {
  emit('update:modelValue', val)
})

const fetchProfile = async () => {
  loading.value = true
  profile.value = null

  try {
    if (!userStore.token) {
      loading.value = false
      return
    }

    if (backendUrl) {
      setConfig({ baseURL: backendUrl })
    }
    setAuthToken(userStore.token)

    const response = await userApi.getProfile({})

    if (response.code === 0 && response.data?.profile) {
      profile.value = response.data.profile
    }
  } catch (error) {
    console.error('Failed to load profile:', error)
  } finally {
    loading.value = false
  }
}

const handleLogout = async () => {
  try {
    if (backendUrl) {
      setConfig({ baseURL: backendUrl })
    }
    setAuthToken(userStore.token || null)
    await userApi.logout()
  } catch (error) {
    console.error('Logout API failed:', error)
  } finally {
    setAuthToken(null)
    userStore.logout()
    visible.value = false
    ElMessage.success('已登出')
    router.push('/login')
  }
}

const handleClose = () => {
  visible.value = false
}
</script>

<style scoped>
.profile-loading,
.profile-empty {
  text-align: center;
  padding: 24px 0;
  color: var(--text-400);
  font-size: 14px;
}

.profile-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20px;
}

.profile-avatar {
  margin-bottom: 12px;
}

.avatar-placeholder {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--bg-200);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-400);
}

.profile-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-100);
}

.profile-role {
  font-size: 12px;
  color: var(--text-400);
  margin-top: 2px;
  text-transform: capitalize;
}

.profile-fields {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.profile-field {
  display: flex;
  align-items: baseline;
  gap: 12px;
  font-size: 13px;
}

.field-label {
  flex-shrink: 0;
  width: 40px;
  color: var(--text-400);
  text-align: right;
}

.field-value {
  color: var(--text-200);
  word-break: break-all;
  min-width: 0;
}

.dialog-footer {
  display: flex;
  justify-content: space-between;
}
</style>
