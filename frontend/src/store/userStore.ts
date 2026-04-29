import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const SECRET_KEY = 'AppGenius_User_Auth_2026'

function encode(data: string): string {
  const encoded = btoa(unescape(encodeURIComponent(data)))
  const reversed = encoded.split('').reverse().join('')
  return reversed + '.' + SECRET_KEY
}

function decode(encoded: string): string | null {
  try {
    const [reversed, key] = encoded.split('.')
    if (key !== SECRET_KEY) return null
    const unreversed = reversed.split('').reverse().join('')
    return decodeURIComponent(escape(atob(unreversed)))
  } catch {
    return null
  }
}

export interface UserInfo {
  id: string
  username: string
  role: 'admin' | 'user'
  token: string
  loginTime: number
}

export const useUserStore = defineStore('user', () => {
  const userInfo = ref<UserInfo | null>(null)

  const isLoggedIn = computed(() => !!userInfo.value)
  const userRole = computed(() => userInfo.value?.role || null)
  const isAdmin = computed(() => userInfo.value?.role === 'admin')
  const token = computed(() => userInfo.value?.token || '')

function saveUser(info: UserInfo) {
    const data = JSON.stringify(info)
    const encrypted = encode(data)
    localStorage.setItem('appgenius_user', encrypted)
    userInfo.value = info
  }

  function loadUser(): boolean {
    const encrypted = localStorage.getItem('appgenius_user')
    if (!encrypted) return false

    const decrypted = decode(encrypted)
    if (!decrypted) {
localStorage.removeItem('appgenius_user')
    return false
  }

  try {
    const info = JSON.parse(decrypted) as UserInfo
    userInfo.value = info
    return true
  } catch {
    localStorage.removeItem('appgenius_user')
      return false
    }
  }

  function logout() {
    localStorage.removeItem('appgenius_user')
    localStorage.removeItem('token')
    userInfo.value = null
  }

  function setTempUser(info: UserInfo) {
    userInfo.value = info
  }

  function clearAll() {
    logout()
  }

  return {
    userInfo,
    isLoggedIn,
    userRole,
    isAdmin,
    token,
    saveUser,
    setTempUser,
    loadUser,
    logout,
    clearAll
  }
})