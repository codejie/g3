<template>
  <div class="login-page">
    <!-- Header -->
    <header class="login-header">
      <div class="header-left">
        <div class="brand-logo">
          <div class="logo-icon">
<span>AG</span>
      </div>
      <span class="brand-text">{{ $t('app.name') }}</span>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <div class="login-content">
      <!-- Left: Project Image -->
      <div class="login-left">
        <div class="project-image">
          <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
            <path d="M5 3v4"/>
            <path d="M19 17v4"/>
            <path d="M3 5h4"/>
            <path d="M17 19h4"/>
          </svg>
        </div>
      </div>

      <!-- Right: Login Panel -->
      <div class="login-right">
        <div class="login-panel">
          <h2 class="login-title">{{ $t('login.title') }}</h2>
          <el-form :model="form" class="login-form">
            <el-form-item>
        <el-input
          v-model="form.username"
          :placeholder="$t('login.username')"
          size="large"
          :prefix-icon="User"
        />
            </el-form-item>
            <el-form-item>
        <el-input
          v-model="form.password"
          type="password"
          :placeholder="$t('login.password')"
          size="large"
          :prefix-icon="Lock"
          show-password
        />
            </el-form-item>
<el-form-item>
        <el-checkbox v-model="form.isAdmin">{{ $t('login.adminLogin') }}</el-checkbox>
    </el-form-item>
    <el-form-item>
        <el-checkbox v-model="form.remember">{{ $t('login.rememberMe') }}</el-checkbox>
    </el-form-item>
    <el-form-item class="button-group">
        <el-button size="large" @click="handleCancel">{{ $t('login.cancel') }}</el-button>
        <el-button type="primary" size="large" @click="handleLogin">{{ $t('login.submit') }}</el-button>
            </el-form-item>
          </el-form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { User, Lock } from '@element-plus/icons-vue'
import { userApi, setConfig } from '../apis/extension/api/userApi'
import { useUserStore } from '../store/userStore'
import { ElMessage } from 'element-plus'

const backendUrl = import.meta.env.VITE_BACKEND_URL
if (!backendUrl) {
  throw new Error('VITE_BACKEND_URL is not configured in .env')
}
setConfig({ baseURL: backendUrl })

const router = useRouter()
const { t } = useI18n()
const userStore = useUserStore()

const form = reactive({
  username: '',
  password: '',
  isAdmin: false,
  remember: true
})

onMounted(() => {
  userStore.loadUser()
  if (userStore.isLoggedIn) {
    if (userStore.isAdmin) {
      router.replace('/admin')
    } else {
      router.replace('/home')
    }
  }
})

const handleLogin = async () => {
  if (!form.username || !form.password) {
    ElMessage.warning(t('login.inputRequired'))
    return
  }

  try {
    const role = form.isAdmin ? 'admin' : 'user'
    const response = await userApi.login({
      username: form.username,
      password: form.password,
      role
    })

if (response.code === 0 && response.data) {
        const userInfo = {
          id: response.data.profile?.id || '',
          username: form.username,
          role: role as 'admin' | 'user',
          token: response.data.token?.token || '',
          loginTime: Date.now()
        }
        if (form.remember) {
          userStore.saveUser(userInfo)
        } else {
          userStore.setTempUser(userInfo)
        }
        if (role === 'admin') {
          router.push('/admin')
        } else {
          router.push('/home')
        }
      } else {
        ElMessage.error(response.message || t('login.failed'))
      }
  } catch (error) {
    ElMessage.error(t('login.requestFailed'))
    console.error('Login error:', error)
  }
}

const handleCancel = () => {
  form.username = ''
  form.password = ''
  form.isAdmin = false
  form.remember = true
}
</script>

<style scoped>
.login-page {
  height: var(--app-height, 100vh);
  display: flex;
  flex-direction: column;
  background: var(--bg-100);
}

.login-header {
  height: 56px;
  border-bottom: 1px solid var(--border-100);
  display: flex;
  align-items: center;
  padding: 0 16px;
  background: var(--bg-000);
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand-logo {
  display: flex;
  align-items: center;
  gap: 12px;
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
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.brand-text {
  font-weight: bold;
  color: var(--text-100);
  letter-spacing: -0.02em;
}

.login-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.login-left {
  flex: 3;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-000);
}

.project-image {
  width: 200px;
  height: 200px;
  border-radius: 24px;
  background: var(--accent-brand);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 8px 24px rgba(16, 185, 129, 0.3);
}

.login-right {
  flex: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: var(--bg-100);
}

.login-panel {
  width: 100%;
  max-width: 360px;
  padding: 32px;
  background: var(--bg-000);
  border-radius: 16px;
  border: 1px solid var(--border-100);
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}

.login-title {
  font-size: 24px;
  font-weight: bold;
  color: var(--text-100);
  margin-bottom: 24px;
  text-align: center;
}

.login-form {
  display: flex;
  flex-direction: column;
}

.button-group {
  margin-bottom: 0;
}

.button-group:deep(.el-form-item__content) {
  justify-content: flex-end;
}

:deep(.el-input__wrapper) {
  border-radius: 8px;
}

:deep(.el-button) {
  border-radius: 8px;
}
</style>