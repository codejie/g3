<template>
  <div class="login-page">
    <!-- Header -->
    <header class="login-header">
      <div class="header-left">
        <div class="brand-logo">
          <div class="logo-icon">
            <span>G3</span>
          </div>
          <span class="brand-text">G3</span>
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
          <h2 class="login-title">登录</h2>
          <el-form :model="form" class="login-form">
            <el-form-item>
              <el-input
                v-model="form.username"
                placeholder="用户名"
                size="large"
                :prefix-icon="User"
              />
            </el-form-item>
            <el-form-item>
              <el-input
                v-model="form.password"
                type="password"
                placeholder="密码"
                size="large"
                :prefix-icon="Lock"
                show-password
              />
            </el-form-item>
            <el-form-item>
              <el-checkbox v-model="form.isAdmin">管理员登录</el-checkbox>
            </el-form-item>
            <el-form-item class="button-group">
              <el-button size="large" @click="handleCancel">取消</el-button>
              <el-button type="primary" size="large" @click="handleLogin">登录</el-button>
            </el-form-item>
          </el-form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import { User, Lock } from '@element-plus/icons-vue'
import { userApi, setConfig } from '../apis/extension/api/userApi'
import { ElMessage } from 'element-plus'

console.log('[Login.vue] import.meta.env:', JSON.stringify(import.meta.env, null, 2))
const backendUrl = import.meta.env.VITE_BACKEND_URL
console.log('[Login.vue] VITE_BACKEND_URL value:', backendUrl)
console.log('[Login.vue] VITE_BACKEND_URL type:', typeof backendUrl)
if (!backendUrl) {
  throw new Error('VITE_BACKEND_URL is not configured in .env')
}
console.log('[Login.vue] calling setConfig with baseURL:', backendUrl)
setConfig({ baseURL: backendUrl })
console.log('[Login.vue] setConfig called successfully')

const router = useRouter()
const form = reactive({
  username: '',
  password: '',
  isAdmin: false
})

const handleLogin = async () => {
  if (!form.username || !form.password) {
    ElMessage.warning('请输入用户名和密码')
    return
  }

  try {
    const role = form.isAdmin ? 'admin' : 'user'
    const response = await userApi.login({
      username: form.username,
      password: form.password,
      role
    })

    if (response.code === 0) {
      localStorage.setItem('token', response.data.token.token)
      localStorage.setItem('userRole', role)
      if (role === 'admin') {
        router.push('/admin')
      } else {
        router.push('/home')
      }
    } else {
      ElMessage.error(response.message || '登录失败')
    }
  } catch (error) {
    ElMessage.error('登录请求失败')
    console.error('Login error:', error)
  }
}

const handleCancel = () => {
  form.username = ''
  form.password = ''
  form.isAdmin = false
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